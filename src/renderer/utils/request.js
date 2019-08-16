import request from 'request'
// import progress from 'request-progress'
import { debugRequest } from './env'
// import fs from 'fs'

const fatchData = (url, method, options, callback) => request(url, {
  method,
  headers: options.headers,
  Origin: options.origin,
  data: options.data,
  json: options.format === undefined || options.format === 'json',
}, (err, resp, body) => {
  if (err) return callback(err, null)
  callback(null, resp, body)
})

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
