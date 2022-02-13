import fs from 'fs'
import path from 'path'
import request from 'request'
import { EventEmitter } from 'events'
import { performance } from 'perf_hooks'
import { STATUS } from './util'


const defaultChunkInfo = {
  path: null,
  startByte: 0,
  endByte: '',
}

const defaultRequestOptions = {
  method: 'GET',
  headers: {},
}
const defaultOptions = {

}

class Task extends EventEmitter {
  /**
   *
   * @param {String} url download url
   * @param {Object} chunkInfo
   * @param {Object} options
   */
  constructor(url, savePath, filename, options = {}) {
    super()

    this.resumeLastChunk = null
    this.downloadUrl = url
    this.chunkInfo = Object.assign({}, defaultChunkInfo, {
      path: path.join(savePath, filename),
      startByte: 0,
    })
    if (!this.chunkInfo.endByte) this.chunkInfo.endByte = ''

    this.options = Object.assign({}, defaultOptions, options)

    this.requestOptions = Object.assign({}, defaultRequestOptions, this.options.requestOptions || {})
    if (!this.requestOptions.headers) this.requestOptions.headers = {}

    this.progress = {
      total: 0,
      downloaded: 0,
      speed: 0,
    }
    this.statsEstimate = {
      time: 0,
      bytes: 0,
      prevBytes: 0,
    }
    this.status = STATUS.idle
  }

  __init() {
    this.status = STATUS.init
    const { path, startByte, endByte } = this.chunkInfo
    this.progress.downloaded = 0
    if (startByte != null) this.requestOptions.headers.range = `bytes=${startByte}-${endByte}`
    return new Promise((resolve, reject) => {
      if (!path) return resolve()
      fs.stat(path, (errStat, stats) => {
        if (errStat) {
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
                this.requestOptions.headers.range = `bytes=${stats.size - 10}-${endByte || ''}`
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

  __httpFetch(url, options) {
    // console.log(options)
    this.request = request(url, options)
      .on('response', response => {
        if (response.statusCode !== 200 && response.statusCode !== 206) {
          if (response.statusCode == 416) {
            fs.unlink(this.chunkInfo.path, async err => {
              await this.__handleError(new Error(response.statusMessage))
              this.chunkInfo.startByte = 0
              this.resumeLastChunk = null
              this.progress.downloaded = 0
              if (err) this.__handleError(err)
            })
            return
          }
          this.status = STATUS.failed
          this.emit('fail', response)
          this.__closeRequest()
          this.__closeWriteStream()
          return
        }
        this.emit('response', response)
        try {
          this.__initDownload(response)
        } catch (error) {
          return this.__handleError(error)
        }
        this.status = STATUS.running
        response
          .on('data', this.__handleWriteData.bind(this))
          .on('error', err => this.__handleError(err))
          .on('end', () => {
            if (response.complete) {
              this.__handleComplete()
            } else {
              // this.__handleError(new Error('The connection was terminated while the message was still being sent'))
              this.stop()
            }
          })
      })
      .on('error', err => this.__handleError(err))
      .on('close', () => this.__closeWriteStream())
  }

  __initDownload(response) {
    this.progress.total = parseInt(response.headers['content-length'] || 0)
    let options = {}
    let isResumable = this.options.forceResume || response.headers['accept-ranges'] !== 'none' || (typeof response.headers['accept-ranges'] == 'string' && parseInt(response.headers['accept-ranges'].replace(/^bytes=(\d+)/, '$1')) > 0)
    if (isResumable) {
      options.flags = 'a'
      if (this.progress.downloaded) this.progress.total -= 10
    } else {
      if (this.chunkInfo.startByte > 0) return this.__handleError(new Error('The resource cannot be resumed download.'))
    }
    this.progress.total += this.progress.downloaded
    this.statsEstimate.prevBytes = this.progress.downloaded
    if (!this.chunkInfo.path) return this.__handleError(new Error('Chunk save Path is not set.'))
    this.ws = fs.createWriteStream(this.chunkInfo.path, options)

    this.ws.on('finish', () => this.__closeWriteStream())
    this.ws.on('error', err => {
      fs.unlink(this.chunkInfo.path, async unlinkErr => {
        await this.__handleError(err)
        this.chunkInfo.startByte = 0
        this.resumeLastChunk = null
        this.progress.downloaded = 0
        if (unlinkErr && unlinkErr.code !== 'ENOENT') this.__handleError(unlinkErr)
      })
    })
  }

  __handleComplete() {
    if (this.status == STATUS.error) return
    this.__closeWriteStream().then(() => {
      if (this.progress.downloaded == this.progress.total) {
        this.status = STATUS.completed
        this.emit('completed')
      } else {
        this.status = STATUS.stopped
        this.emit('stop')
      }
    })
    console.log('end')
  }

  __handleError(error) {
    if (this.status == STATUS.error) return
    this.status = STATUS.error
    this.__closeRequest()
    this.__closeWriteStream()
    this.emit('error', error)
  }

  __closeWriteStream() {
    return new Promise((resolve, reject) => {
      if (!this.ws) return resolve()
      console.log('close write stream')
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
    })
  }

  __closeRequest() {
    if (!this.request) return
    console.log('close request')
    this.request.abort()
    this.request = null
  }

  __handleWriteData(chunk) {
    if (this.resumeLastChunk) {
      chunk = this.__handleDiffChunk(chunk)
      if (!chunk) {
        this.__handleStop().finally(() => {
          this.__handleError(new Error('Resume failed, response chunk does not match.'))
        })
        return
      }
    }
    // console.log('data', chunk)
    if (this.status == STATUS.stopped || this.ws == null) return console.log('cancel write')
    this.__calculateProgress(chunk.length)
    this.ws.write(chunk, err => {
      if (!err) return
      console.log(err)
      this.__handleError(err)
      this.stop()
    })
  }

  __handleDiffChunk(chunk) {
    // console.log('diff', chunk)
    let resumeLastChunkLen = this.resumeLastChunk.length
    let chunkLen = chunk.length
    let isOk
    if (chunkLen >= resumeLastChunkLen) {
      isOk = chunk.slice(0, resumeLastChunkLen).toString('hex') === this.resumeLastChunk.toString('hex')
      if (!isOk) return null

      this.resumeLastChunk = null
      return chunk.slice(resumeLastChunkLen)
    } else {
      isOk = chunk.slice(0, chunkLen).toString('hex') === this.resumeLastChunk.slice(0, chunkLen).toString('hex')
      if (!isOk) return null
      this.resumeLastChunk = this.resumeLastChunk.slice(chunkLen)
      return chunk.slice(chunkLen)
    }
  }

  __handleStop() {
    return new Promise((resolve, reject) => {
      if (this.request) {
        this.request.abort()
        this.request = null
      }
      if (this.ws) {
        this.ws.close(err => {
          if (err) {
            reject(err)
            this.emit('error', err)
            return
          }
          this.ws = null
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  __calculateProgress(receivedBytes) {
    const currentTime = performance.now()
    const elaspsedTime = currentTime - this.statsEstimate.time

    const progress = this.progress
    progress.downloaded += receivedBytes
    progress.progress = progress.total ? (progress.downloaded / progress.total) * 100 : -1


    // emit the progress every second or if finished
    if (progress.downloaded === progress.total || elaspsedTime > 1000) {
      this.statsEstimate.time = currentTime
      this.statsEstimate.bytes = progress.downloaded - this.statsEstimate.prevBytes
      this.statsEstimate.prevBytes = progress.downloaded
      this.emit('progress', {
        total: progress.total,
        downloaded: progress.downloaded,
        progress: progress.progress,
        speed: this.statsEstimate.bytes,
      })
    }
  }

  async start() {
    this.status = STATUS.running
    await this.__init()
    this.__httpFetch(this.downloadUrl, this.requestOptions)
    this.emit('start')
  }

  async stop() {
    if (this.status === STATUS.stopped) return
    this.status = STATUS.stopped
    await this.__handleStop()
    this.emit('stop')
  }

  refreshUrl(url) {
    this.downloadUrl = url
  }

  updateSaveInfo(filePath, fileName) {
    this.chunkInfo.path = path.join(filePath, fileName)
  }
}

export default Task
