import Downloader, { type Options as DownloaderOptions } from './Downloader'
import { getRequestAgent } from './util'
import { sizeFormate } from '@common/utils'
import type http from 'http'

// these are the default options
// const options = {
//   method: 'GET', // Request Method Verb
//   // Custom HTTP Header ex: Authorization, User-Agent
//   headers: {},
//   fileName: '', // Custom filename when saved
//   override: false, // if true it will override the file, otherwise will append '(number)' to the end of file
//   forceResume: false, // If the server does not return the "accept-ranges" header, can be force if it does support it
//   // httpRequestOptions: {}, // Override the http request options
//   // httpsRequestOptions: {}, // Override the https request options, ex: to add SSL Certs
// }

export interface Options {
  url: string
  path: string
  fileName: string
  method?: DownloaderOptions['requestOptions']['method']
  headers?: DownloaderOptions['requestOptions']['headers']
  forceResume?: boolean
  proxy?: { host: string, port: number }
  onCompleted?: () => void
  onError?: (error: Error) => void
  onFail?: (response: http.IncomingMessage) => void
  onStart?: () => void
  onStop?: () => void
  onProgress?: (progress: LX.Download.ProgressInfo) => void
}
const noop = () => {}
export const createDownload = ({
  url,
  path,
  fileName,
  method = 'get',
  forceResume,
  proxy,
  // resumeTime = 5000,
  onCompleted = noop,
  onError = noop,
  onFail = noop,
  onStart = noop,
  onStop = noop,
  onProgress = noop,
}: Options) => {
  const dl = new Downloader(url, path, fileName, {
    requestOptions: {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
      },
      agent: getRequestAgent(url, proxy),
      timeout: 60 * 1000,
    },

    forceResume,
  })

  dl.on('completed', () => {
    onCompleted()
  }).on('error', (err: any) => {
    if (err.message === 'socket hang up') return
    onError(err)
  }).on('start', () => {
    onStart()
    // pauseResumeTimer(dl, resumeTime)
  }).on('progress', (stats) => {
    const speed = sizeFormate(stats.speed)
    onProgress({
      progress: parseInt(stats.progress.toFixed(2)),
      speed,
      downloaded: stats.downloaded,
      total: stats.total,
      writeQueue: stats.writeQueue,
    })
    // if (debugDownload) {
    //   const downloaded = sizeFormate(stats.downloaded)
    //   const total = sizeFormate(stats.total)
    //   console.log(`${speed}/s - ${progress}% [${downloaded}/${total}]`)
    // }
  }).on('stop', () => {
    onStop()
    // debugDownload && console.log('paused')
  }).on('fail', resp => {
    onFail(resp)
    // debugDownload && console.log('fail')
  })

  // debugDownload && console.log('Downloading: ', url)

  dl.start().catch(err => {
    onError(err)
  })

  return dl
}

export type DownloaderType = Downloader
