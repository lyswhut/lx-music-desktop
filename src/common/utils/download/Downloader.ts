import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { performance } from 'perf_hooks'
import { STATUS } from './util'
import type http from 'http'
import { request, type Options as RequestOptions } from './request'

export interface Options {
  forceResume: boolean
  timeout: number
  requestOptions: RequestOptions
}

const defaultChunkInfo = {
  path: '',
  startByte: '0',
  endByte: '',
}

const defaultRequestOptions: Options['requestOptions'] = {
  method: 'get',
  headers: {},
}
const defaultOptions: Options = {
  forceResume: true,
  timeout: 20_000,
  requestOptions: { ...defaultRequestOptions },
}

class Task extends EventEmitter {
  resumeLastChunk: Buffer | null
  downloadUrl: string
  chunkInfo: { path: string, startByte: string, endByte: string }
  status: typeof STATUS[keyof typeof STATUS]
  options: Options
  requestOptions: Options['requestOptions']
  ws: fs.WriteStream | null = null
  progress = { total: 0, downloaded: 0, speed: 0, progress: 0 }
  statsEstimate = { time: 0, bytes: 0, prevBytes: 0 }
  requestInstance: http.ClientRequest | null = null
  maxRedirectNum = 2
  private redirectNum = 0
  private dataWriteQueueLength = 0
  private closeWaiting = false
  private timeout: null | NodeJS.Timeout = null


  constructor(url: string, savePath: string, filename: string, options: Partial<Options> = {}) {
    super()

    this.resumeLastChunk = null
    this.downloadUrl = url
    this.chunkInfo = Object.assign({}, defaultChunkInfo, {
      path: path.join(savePath, filename),
      startByte: '0',
    })
    // if (!this.chunkInfo.endByte) this.chunkInfo.endByte = ''

    this.options = Object.assign({}, defaultOptions, options)
    this.requestOptions = Object.assign({}, defaultRequestOptions, this.options.requestOptions || {})
    this.requestOptions.headers = this.requestOptions.headers ? { ...this.requestOptions.headers } : {}

    this.status = STATUS.idle
  }

  async __init() {
    const { path, startByte, endByte } = this.chunkInfo
    this.redirectNum = 0
    this.progress.downloaded = 0
    this.progress.progress = 0
    this.progress.speed = 0
    this.dataWriteQueueLength = 0
    this.closeWaiting = false
    this.__clearTimeout()
    this.__startTimeout()
    if (startByte) this.requestOptions.headers!.range = `bytes=${startByte}-${endByte}`

    if (!path) return
    return new Promise<void>((resolve, reject) => {
      fs.stat(path, (errStat, stats) => {
        if (errStat) {
          // console.log(errStat.code)
          if (errStat.code !== 'ENOENT') {
            this.__handleError(errStat)
            reject(errStat)
            return
          }
        } else if (stats.size >= 10) {
          fs.open(path, 'r', (errOpen, fd) => {
            if (errOpen) {
              this.__handleError(errOpen)
              reject(errOpen)
              return
            }
            fs.read(fd, Buffer.alloc(10), 0, 10, stats.size - 10, (errRead, bytesRead, buffer) => {
              if (errRead) {
                this.__handleError(errRead)
                reject(errRead)
                return
              }
              fs.close(fd, errClose => {
                if (errClose) {
                  this.__handleError(errClose)
                  reject(errClose)
                  return
                }

                // resume download
                // console.log(buffer)
                this.resumeLastChunk = buffer
                this.progress.downloaded = stats.size
                this.requestOptions.headers!.range = `bytes=${stats.size - 10}-${endByte || ''}`
                resolve()
              })
            })
          })
          return
        }
        resolve()
      })
    })
  }

  __httpFetch(url: string, options: Options['requestOptions']) {
    // console.log(options)
    let redirected = false
    this.requestInstance = request(url, options)
      .on('response', response => {
        if (response.statusCode !== 200 && response.statusCode !== 206) {
          if (response.statusCode == 416) {
            fs.unlink(this.chunkInfo.path, (err) => {
              this.__handleError(new Error(response.statusMessage))
              this.chunkInfo.startByte = '0'
              this.resumeLastChunk = null
              this.progress.downloaded = 0
              if (err) this.__handleError(err)
            })
            return
          }
          if ((response.statusCode == 301 || response.statusCode == 302) && response.headers.location && this.redirectNum < this.maxRedirectNum) {
            console.log('current url:', url)
            console.log('redirect to:', response.headers.location)
            redirected = true
            this.redirectNum++
            const location = response.headers.location
            this.__httpFetch(location, options)
            return
          }
          this.status = STATUS.failed
          this.emit('fail', response)
          this.__clearTimeout()
          this.__closeRequest()
          void this.__closeWriteStream()
          return
        }
        this.emit('response', response)
        try {
          this.__initDownload(response)
        } catch (error: any) {
          this.__handleError(error)
          return
        }
        this.status = STATUS.running
        this.__startTimeout()
        response
          .on('data', this.__handleWriteData.bind(this))
          .on('error', err => { this.__handleError(err) })
          .on('end', () => {
            if (response.complete) {
              this.__handleComplete()
            } else {
              // this.__handleError(new Error('The connection was terminated while the message was still being sent'))
              void this.stop()
            }
          })
      })
      .on('error', err => { this.__handleError(err) })
      .on('close', () => {
        if (redirected) return
        void this.__closeWriteStream()
      })
      .end()
  }

  __initDownload(response: http.IncomingMessage) {
    this.progress.total = response.headers['content-length'] ? parseInt(response.headers['content-length']) : 0
    if (!this.progress.total) {
      this.__handleError(new Error('Content length is 0'))
      return
    }
    let options: any = {}
    let isResumable = this.options.forceResume ||
      response.headers['accept-ranges'] !== 'none' ||
      (typeof response.headers['accept-ranges'] == 'string' &&
        parseInt(response.headers['accept-ranges'].replace(/^bytes=(\d+)/, '$1')) > 0)

    if (isResumable) {
      options.flags = 'a'
      if (this.progress.downloaded) this.progress.total -= 10
    } else {
      if (this.chunkInfo.startByte != '0') {
        this.__handleError(new Error('The resource cannot be resumed download.'))
        return
      }
    }
    this.progress.total += this.progress.downloaded
    this.statsEstimate.prevBytes = this.progress.downloaded
    if (!this.chunkInfo.path) {
      this.__handleError(new Error('Chunk save Path is not set.'))
      return
    }
    this.ws = fs.createWriteStream(this.chunkInfo.path, options)

    this.ws.on('finish', () => {
      if (this.closeWaiting) return
      void this.__closeWriteStream()
    })
    this.ws.on('error', err => {
      fs.unlink(this.chunkInfo.path, (unlinkErr: any) => {
        this.__handleError(err)
        this.chunkInfo.startByte = '0'
        this.resumeLastChunk = null
        this.progress.downloaded = 0
        if (unlinkErr && unlinkErr.code !== 'ENOENT') this.__handleError(unlinkErr)
      })
    })
  }

  __handleComplete() {
    if (this.status == STATUS.error) return
    this.__clearTimeout()
    void this.__closeWriteStream().then(() => {
      if (this.progress.downloaded == this.progress.total) {
        this.status = STATUS.completed
        this.emit('completed')
      } else {
        this.status = STATUS.stopped
        this.emit('stop')
      }
    })
    // console.log('end')
  }

  __handleError(error: Error) {
    if (this.status == STATUS.error) return
    this.status = STATUS.error
    this.__clearTimeout()
    this.__closeRequest()
    void this.__closeWriteStream()
    if (error.message == 'aborted') return
    this.emit('error', error)
  }

  async __closeWriteStream() {
    return new Promise<void>((resolve, reject) => {
      if (!this.ws) {
        resolve()
        return
      }
      // console.log('close write stream')
      if (this.closeWaiting || this.dataWriteQueueLength) {
        this.closeWaiting ||= true
        this.ws.on('close', resolve)
      } else {
        this.ws.close(err => {
          if (err) {
            this.status = STATUS.error
            this.emit('error', err)
            reject(err)
            return
          }
          this.ws = null
          resolve()
        })
      }
    })
  }

  __closeRequest() {
    if (!this.requestInstance || this.requestInstance.destroyed) return
    // console.log('close request')
    this.requestInstance.destroy()
    this.requestInstance = null
  }

  __handleWriteData(chunk: Buffer) {
    if (this.resumeLastChunk) {
      const result = this.__handleDiffChunk(chunk)
      if (result) chunk = result
      else {
        void this.__handleStop().finally(() => {
          // this.__handleError(new Error('Resume failed, response chunk does not match.'))
          // Resume failed, response chunk does not match, remove file and restart download
          console.log('Resume failed, response chunk does not match.')
          fs.unlink(this.chunkInfo.path, (unlinkErr: any) => {
            // this.__handleError(err)
            this.chunkInfo.startByte = '0'
            this.resumeLastChunk = null
            if (unlinkErr && unlinkErr.code !== 'ENOENT') {
              this.__handleError(unlinkErr)
              return
            }
            void this.start()
          })
        })
        return
      }
    }
    // console.log('data', chunk)
    if (this.status == STATUS.stopped || this.ws == null) {
      console.log('cancel write')
      return
    }
    this.dataWriteQueueLength++
    this.__startTimeout()
    this.__calculateProgress(chunk.length)
    this.ws.write(chunk, err => {
      this.dataWriteQueueLength--
      if (this.status == STATUS.running) this.__calculateProgress(0)
      if (err) {
        console.log(err)
        this.__handleError(err)
        return
      }
      if (this.closeWaiting && !this.dataWriteQueueLength) this.ws?.close()
    })
  }

  __handleDiffChunk(chunk: Buffer): Buffer | null {
    // console.log('diff', chunk)
    let resumeLastChunkLen = this.resumeLastChunk!.length
    let chunkLen = chunk.length
    let isOk
    if (chunkLen >= resumeLastChunkLen) {
      isOk = chunk.subarray(0, resumeLastChunkLen).toString('hex') === this.resumeLastChunk!.toString('hex')
      if (!isOk) return null

      this.resumeLastChunk = null
      return chunk.subarray(resumeLastChunkLen)
    } else {
      isOk = chunk.subarray(0, chunkLen).toString('hex') === this.resumeLastChunk!.subarray(0, chunkLen).toString('hex')
      if (!isOk) return null
      this.resumeLastChunk = this.resumeLastChunk!.subarray(chunkLen)
      return chunk.subarray(chunkLen)
    }
  }

  async __handleStop() {
    this.__clearTimeout()
    this.__closeRequest()
    return this.__closeWriteStream()
  }

  private __clearTimeout() {
    if (!this.timeout) return
    clearTimeout(this.timeout)
    this.timeout = null
  }

  private __startTimeout() {
    this.__clearTimeout()
    this.timeout = setTimeout(() => {
      this.__handleError(new Error('download timeout'))
    }, this.options.timeout)
  }

  __calculateProgress(receivedBytes: number) {
    const currentTime = performance.now()
    const elaspsedTime = currentTime - this.statsEstimate.time

    const progress = this.progress
    progress.downloaded += receivedBytes
    progress.progress = progress.total ? (progress.downloaded / progress.total) * 100 : -1


    // emit the progress every second or if finished
    if ((progress.downloaded === progress.total && this.dataWriteQueueLength == 0) || elaspsedTime > 1000) {
      this.statsEstimate.time = currentTime
      this.statsEstimate.bytes = progress.downloaded - this.statsEstimate.prevBytes
      this.statsEstimate.prevBytes = progress.downloaded
      this.emit('progress', {
        total: progress.total,
        downloaded: progress.downloaded,
        progress: progress.progress,
        speed: this.statsEstimate.bytes,
        writeQueue: this.dataWriteQueueLength,
      })
    }
  }

  async start() {
    this.status = STATUS.init
    await this.__init()
    if (this.status !== STATUS.init) return
    this.status = STATUS.running
    this.__httpFetch(this.downloadUrl, this.requestOptions)
    this.emit('start')
  }

  async stop() {
    if (this.status == STATUS.stopped || this.status == STATUS.completed) return
    this.status = STATUS.stopped
    await this.__handleStop()
    this.emit('stop')
  }

  refreshUrl(url: string) {
    this.downloadUrl = url
  }

  updateSaveInfo(filePath: string, fileName: string) {
    this.chunkInfo.path = path.join(filePath, fileName)
  }
}

export default Task
