import needle from 'needle'
// import progress from 'request-progress'
// import { debugRequest } from './env'
import { requestMsg } from './message'
import { bHh } from './musicSdk/options'
import { deflateRaw } from 'zlib'
import { proxy } from '@renderer/store'
import { httpOverHttp, httpsOverHttp } from 'tunnel'
// import fs from 'fs'

const httpsRxp = /^https:/
const getRequestAgent = (url: string) => {
  let options: any
  if (proxy.enable && proxy.host) {
    options = {
      proxy: {
        host: proxy.host,
        port: proxy.port,
      },
    }
  } else if (proxy.envProxy) {
    options = {
      proxy: {
        host: proxy.envProxy.host,
        port: proxy.envProxy.port,
      },
    }
  }
  return options ? (httpsRxp.test(url) ? httpsOverHttp : httpOverHttp)(options) : undefined
}

const request = (url: string, options: any, callback: (err: Error | null, resp: any, body: any) => void) => {
  let data
  if (options.body) {
    data = options.body
  } else if (options.form) {
    data = options.form
    options.json = false
  } else if (options.formData) {
    data = options.formData
    options.json = false
  }
  options.response_timeout = options.timeout

  return (needle.request(options.method || 'get', url, data, options, (err, resp, body) => {
    if (!err) {
      body = resp.body = resp.raw.toString()
      try {
        resp.body = JSON.parse(resp.body)
      } catch (_) {}
      body = resp.body
    }
    callback(err, resp, body)
  }) as any).request
}

const defaultHeaders: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}

/**
 * promise 形式的请求方法
 * @param {*} url
 * @param {*} options
 */
const buildHttpPromose = (url: string, options: any) => {
  let obj: any = {
    isCancelled: false,
    cancelHttp: () => {
      if (!obj.requestObj) return (obj.isCancelled = true)
      cancelHttp(obj.requestObj)
      obj.requestObj = null
      obj.promise = obj.cancelHttp = null
      obj.cancelFn(new Error(requestMsg.cancelRequest))
      obj.cancelFn = null
    },
  }
  obj.promise = new Promise((resolve, reject) => {
    obj.cancelFn = reject
    // console.log(`\n---send request------${url}------------`)
    fetchData(url, options.method, options, (err, resp, body) => {
      // console.log(`\n---response------${url}------------`)
      // console.log(body)
      obj.requestObj = null
      obj.cancelFn = null
      if (err) { reject(err); return }
      resolve(resp)
    }).then((ro) => {
      obj.requestObj = ro
      if (obj.isCancelled) obj.cancelHttp()
    }).catch(reject)
  })
  return obj
}

/**
 * 请求超时自动重试
 * @param {*} url
 * @param {*} options
 */
export const httpFetch = (url: string, options: any = { method: 'get' }) => {
  const requestObj = buildHttpPromose(url, options)
  requestObj.promise = requestObj.promise.catch(async(err: any) => {
    // // console.log('出错', err)
    if (err.message === 'socket hang up') {
      // window.globalObj.apiSource = 'temp'
      return Promise.reject(new Error(requestMsg.unachievable))
    }
    switch (err.code) {
      case 'ETIMEDOUT':
      case 'ESOCKETTIMEDOUT':
        return Promise.reject(new Error(requestMsg.timeout))
      case 'ENOTFOUND':
        return Promise.reject(new Error(requestMsg.notConnectNetwork))
      default:
        return Promise.reject(err)
    }
  })
  return requestObj
}

/**
 * 取消请求
 * @param {*} index
 */
export const cancelHttp = (requestObj: any) => {
  // // console.log(requestObj)
  if (!requestObj) return
  // // console.log('cancel:', requestObj)
  if (!requestObj.abort) return
  requestObj.abort()
}

/**
 * http 请求
 * @param {*} url 地址
 * @param {*} options 选项
 * @param {*} cb 回调
 * @return {Number} index 用于取消请求
 */
export const http = async(url: string, options: any, cb?: any) => {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  // 默认选项
  if (options.method == null) options.method = 'get'

  // console.log(`\n---send request------${url}------------`)
  return fetchData(url, options.method, options, (err, resp, body) => {
    // options.isShowProgress && window.api.hideProgress()
    // console.log(`\n---response------${url}------------`)
    // console.log(body)
    if (err) {
      // console.log(JSON.stringify(err))
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
export const httpGet = async(url: string, options: any, callback?: any) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })

  // console.log(`\n---send request-------${url}------------`)
  return fetchData(url, 'get', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    // console.log(`\n---response------${url}------------`)
    // console.log(body)
    if (err) {
      // console.log(JSON.stringify(err))
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
export const httpPost = async(url: string, data: any, options: any, callback?: any) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })
  options.data = data

  // console.log(`\n---send request-------${url}------------`)
  return fetchData(url, 'post', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    // console.log(`\n---response------${url}------------`)
    // console.log(body)
    if (err) {
      // console.log(JSON.stringify(err))
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
export const http_jsonp = async(url: string, options: any, callback?: any) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  let jsonpCallback = 'jsonpCallback'
  if (!url.includes('?')) url += '?'
  url += `&${options.jsonpCallback}=${jsonpCallback}`

  options.format = 'script'

  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })

  // console.log(`\n---send request-------${url}------------`)
  return fetchData(url, 'get', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    // console.log(`\n---response------${url}------------`)
    // console.log(body)
    if (err) {
      // console.log(JSON.stringify(err))
    } else {
      body = JSON.parse(body.replace(new RegExp(`^${jsonpCallback}\\(({.*})\\)$`), '$1'))
    }

    callback(err, resp, body)
  })
}

const handleDeflateRaw = async(data: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    deflateRaw(data, (err, buf) => {
      if (err) { reject(err); return }
      resolve(buf)
    })
  })

const regx = /(?:\d\w)+/g

const fetchData = async(
  url: string,
  method: string,
  { headers = {}, format = 'json', timeout = 15000, ...options }: any,
  callback: (err: Error | null, resp?: any, body?: any) => void,
) => {
  // // console.log(url, options)
  // console.log('---start---', url)
  headers = Object.assign({}, headers)
  if (headers[bHh]) {
    const path = url.replace(/^https?:\/\/[\w.:]+\//, '/')
    let s = Buffer.from(bHh, 'hex').toString()
    s = s.replace(s.substr(-1), '')
    s = Buffer.from(s, 'base64').toString()
    let v = process.versions.app
      .split('-')[0]
      .split('.')
      .map((n) => (n.length < 3 ? n.padStart(3, '0') : n))
      .join('')
    let v2 = process.versions.app.split('-')[1] || ''
    headers[s] =
      !s ||
      `${(
        await handleDeflateRaw(
          Buffer.from(JSON.stringify(`${path}${v}`.match(regx), null, 1).concat(v)).toString(
            'base64',
          ),
        )
      ).toString('hex')}&${parseInt(v)}${v2}`
    Reflect.deleteProperty(headers, bHh)
  }
  return request(
    url,
    {
      ...options,
      method,
      headers: Object.assign({}, defaultHeaders, headers),
      timeout,
      agent: getRequestAgent(url),
      json: format === 'json',
    },
    (err, resp, body) => {
      if (err) { callback(err, null); return }
      callback(null, resp, body)
    },
  )
}

export const checkUrl = async(url: string, options: any = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    void fetchData(url, 'head', options, (err: Error | null, resp?: any) => {
      if (err) { reject(err); return }
      if (resp.statusCode === 200) {
        resolve()
      } else {
        reject(new Error(resp.statusCode))
      }
    })
  })
}
