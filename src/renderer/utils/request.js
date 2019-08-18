import request from 'request'
// import progress from 'request-progress'
import { debugRequest } from './env'
// import fs from 'fs'

const headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}

const fatchData = (url, method, options, callback) => {
  console.log(url, options)
  // console.log('---start---', url)
  return request(url, {
    method,
    headers: Object.assign({}, headers, options.headers || {}),
    Origin: options.origin,
    data: options.data,
    timeout: options.timeout || 10000,
    json: options.format === undefined || options.format === 'json',
  }, (err, resp, body) => {
    if (err) {
      if (err.message === 'socket hang up') window.globalObj.apiSource = 'temp'
      return callback(err, null)
    }

    // console.log('---end---', url)
    callback(null, resp, body)
  })
}

/**
 * promise 形式的请求方法
 * @param {*} url
 * @param {*} options
 */
const buildHttpPromose = (url, options) => {
  let requestObj
  let cancelFn
  const p = new Promise((resolve, reject) => {
    cancelFn = reject
    debugRequest && console.log(`\n---send request------${url}------------`)
    requestObj = fatchData(url, options.method, options, (err, resp, body) => {
    // options.isShowProgress && window.api.hideProgress()
      debugRequest && console.log(`\n---response------${url}------------`)
      debugRequest && console.log(JSON.stringify(body))
      requestObj = null
      cancelFn = null
      if (err) {
        console.log(err.code)
        if (err.code === 'ETIMEDOUT' || err.code == 'ESOCKETTIMEDOUT') {
          const { promise, cancelHttp } = httpFatch(url, options)
          obj.cancelHttp = cancelHttp
          promise.then()
        }
        return reject(err)
      }
      resolve(resp)
    })
  })
  const obj = {
    promise: p,
    cancelHttp() {
      console.log('cancel')
      if (!requestObj) return
      cancelHttp(requestObj)
      cancelFn(new Error('取消http请求'))
      requestObj = null
      cancelFn = null
    },
  }
  return obj
}

/**
 * 请求超时自动重试
 * @param {*} url
 * @param {*} options
 */
export const httpFatch = (url, options = { method: 'get' }) => {
  const requestObj = buildHttpPromose(url, options)
  requestObj.promise = requestObj.promise.catch(err => {
    if (err.code === 'ETIMEDOUT' || err.code == 'ESOCKETTIMEDOUT') {
      const { promise, cancelHttp } = httpFatch(url, options)
      requestObj.cancelHttp()
      requestObj.cancelHttp = cancelHttp
      return promise
    }
    if (err.message === 'socket hang up') return Promise.reject(new Error('哦No😱...接口挂了！已帮你切换到临时接口，重试下看能不能播放吧~'))
    if (err.code === 'ENOTFOUND') return Promise.reject(new Error('无法连接网络'))
    return Promise.reject(err)
  })
  return requestObj
}

/**
 * 取消请求
 * @param {*} index
 */
export const cancelHttp = requestObj => {
  if (!requestObj) return
  console.log('cancel:', requestObj.href)
  requestObj.abort()
}


/**
 * http 请求
 * @param {*} url 地址
 * @param {*} options 选项
 * @param {*} cb 回调
 * @return {Number} index 用于取消请求
 */
export const http = (url, options, cb) => {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  // 默认选项
  if (options.method == null) options.method = 'get'

  debugRequest && console.log(`\n---send request------${url}------------`)
  return fatchData(url, options.method, options, (err, resp, body) => {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(JSON.stringify(body))
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    }
    cb(err, resp, body)
  })
}

/**
 * http get 请求
 * @param {*} url 地址
 * @param {*} options 选项
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const httpGet = (url, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })

  debugRequest && console.log(`\n---send request-------${url}------------`)
  return fatchData(url, 'get', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(JSON.stringify(body))
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    }
    callback(err, resp, body)
  })
}

/**
 * http post 请求
 * @param {*} url 请求地址
 * @param {*} data 提交的数据
 * @param {*} options 选项
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const httpPost = (url, data, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })
  options.data = data

  debugRequest && console.log(`\n---send request-------${url}------------`)
  return fatchData(url, 'post', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(JSON.stringify(body))
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    }
    callback(err, resp, body)
  })
}

/**
 * http jsonp 请求
 * @param {*} url 请求地址
 * @param {*} options 选项
 *             options.jsonpCallback 回调
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const http_jsonp = (url, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  let jsonpCallback = 'jsonpCallback'
  if (url.indexOf('?') < 0) url += '?'
  url += `&${options.jsonpCallback}=${jsonpCallback}`

  options.format = 'script'

  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })

  debugRequest && console.log(`\n---send request-------${url}------------`)
  return fatchData(url, 'get', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(JSON.stringify(body))
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    } else {
      body = JSON.parse(body.replace(new RegExp(`^${jsonpCallback}\\(({.*})\\)$`), '$1'))
    }

    callback(err, resp, body)
  })
}
