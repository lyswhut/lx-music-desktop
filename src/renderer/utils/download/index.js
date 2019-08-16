import { DownloaderHelper } from 'node-downloader-helper'
// import { pauseResumeTimer } from './util'
import { sizeFormate } from '../index'
import { debugDownload } from '../env'

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

export default ({
  url,
  path,
  fileName,
  method = 'get',
  headers,
  override,
  forceResume,
  // resumeTime = 5000,
  onEnd = () => {},
  onError = () => {},
  onStateChanged = () => {},
  onDownload = () => {},
  onPause = () => {},
  onResume = () => {},
  onProgress = () => {},
  resumeInfo,
} = {}) => {
  const dl = new DownloaderHelper(url, path, {
    fileName,
    method,
    headers,
    override,
    forceResume,
  })

  dl.on('end', () => {
    onEnd()
    debugDownload && console.log('Download Completed')
  }).on('error', err => {
    onError(err)
    dl.resume()
    console.log('Download failed, Attempting Retry')
    debugDownload && console.error('Something happend', err)
  }).on('stateChanged', state => {
    onStateChanged(state)
    debugDownload && console.log('State: ', state)
  }).on('download', () => {
    onDownload()
    // pauseResumeTimer(dl, resumeTime)
  }).on('progress', stats => {
    const progress = stats.progress.toFixed(2)
    const speed = sizeFormate(stats.speed)
    onProgress({
      progress,
      speed,
      downloaded: stats.downloaded,
      total: stats.total,
    })
    if (debugDownload) {
      const downloaded = sizeFormate(stats.downloaded)
      const total = sizeFormate(stats.total)
      console.log(`${speed}/s - ${progress}% [${downloaded}/${total}]`)
    }
  }).on('pause', () => {
    onPause()
    debugDownload && console.log('paused')
  }).on('resume', () => {
    onResume()
    debugDownload && console.log('resume')
  })

  debugDownload && console.log('Downloading: ', url)

  if (resumeInfo) {
    dl.__total = resumeInfo.totalFileSize // <--- Workaround
    // dl.__filePath = resumeInfo.filePath // <--- Workaround
    dl.__isResumable = true // <--- Workaround
    dl.resume()
  } else {
    dl.start()
  }

  return dl
}

