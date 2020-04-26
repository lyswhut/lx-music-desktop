import Downloader from './Downloader'
// import { pauseResumeTimer } from './util'
import { sizeFormate, getProxyInfo } from '../index'
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
  forceResume,
  // resumeTime = 5000,
  onCompleted = () => {},
  onError = () => {},
  onFail = () => {},
  onStart = () => {},
  onStop = () => {},
  onProgress = () => {},
} = {}) => {
  const dl = new Downloader(url, path, fileName, {
    requestOptions: {
      method,
      headers,
      proxy: getProxyInfo(),
    },

    forceResume,
  })

  dl.on('completed', () => {
    onCompleted()
    debugDownload && console.log('Download Completed')
  }).on('error', err => {
    if (err.message === 'socket hang up') return
    onError(err)
    debugDownload && console.error('Something happend', err)
  }).on('start', () => {
    onStart()
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
  }).on('stop', () => {
    onStop()
    debugDownload && console.log('paused')
  }).on('fail', resp => {
    onFail(resp)
    debugDownload && console.log('fail')
  })

  debugDownload && console.log('Downloading: ', url)

  dl.start().catch(err => {
    onError(err)
  })

  return dl
}

