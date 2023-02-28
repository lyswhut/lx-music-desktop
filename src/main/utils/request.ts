import needle, { type NeedleHttpVerbs, type NeedleOptions, type BodyData, type NeedleCallback, type NeedleResponse } from 'needle'
// import progress from 'request-progress'
import { httpOverHttp, httpsOverHttp } from 'tunnel'
import { type ClientRequest } from 'node:http'
// import fs from 'fs'

export const requestMsg = {
  fail: '请求异常😮，可以多试几次，若还是不行就换一首吧。。。',
  unachievable: '哦No😱...接口无法访问了！',
  timeout: '请求超时',
  // unachievable: '哦No😱...接口无法访问了！已帮你切换到临时接口，重试下看能不能播放吧~',
  notConnectNetwork: '无法连接到服务器',
  cancelRequest: '取消http请求',
} as const


const httpsRxp = /^https:/
let envProxy: null | { host: string, port: string } = null

const getRequestAgent = (url: string) => {
  if (envProxy == null) {
    if (global.envParams.cmdParams['proxy-server'] && typeof global.envParams.cmdParams['proxy-server'] == 'string') {
      const [host, port = ''] = global.envParams.cmdParams['proxy-server'].split(':')
      envProxy = {
        host,
        port,
      }
    }
  }
  const proxy = {
    enable: global.lx.appSetting['network.proxy.enable'],
    host: global.lx.appSetting['network.proxy.host'],
    port: global.lx.appSetting['network.proxy.port'],
    envProxy,
  }

  let options
  if (global.lx.appSetting['network.proxy.enable'] && proxy.host) {
    options = {
      proxy: {
        host: proxy.host,
        port: parseInt(proxy.port || '80'),
      },
    }
  } else if (proxy.envProxy) {
    options = {
      proxy: {
        host: proxy.envProxy.host,
        port: parseInt(proxy.envProxy.port || '80'),
      },
    }
  }
  return options ? (httpsRxp.test(url) ? httpsOverHttp : httpOverHttp)(options) : undefined
}

export interface RequestOptions extends NeedleOptions {
  method?: NeedleHttpVerbs
  body?: BodyData
  form?: BodyData
  formData?: BodyData
}
export type RequestCallback = NeedleCallback
type RequestResponse = NeedleResponse
const request = (url: string, options: RequestOptions, callback: RequestCallback): ClientRequest => {
  let data: BodyData = null
  if (options.body) {
    data = options.body
  } else if (options.form) {
    data = options.form
    // data.content_type = 'application/x-www-form-urlencoded'
    options.json = false
  } else if (options.formData) {
    data = options.formData
    // data.content_type = 'multipart/form-data'
    options.json = false
  }
  options.response_timeout = options.timeout

  return needle.request(options.method ?? 'get', url, data, options, (err, resp, body) => {
    if (!err) {
      body = resp.body = resp.raw.toString()
      try {
        resp.body = JSON.parse(resp.body)
      } catch (_) {}
      body = resp.body
    }
    callback(err, resp, body)
    // @ts-expect-error
  }).request
}


const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}
// var proxyUrl = "http://" + user + ":" + password + "@" + host + ":" + port;
// var proxiedRequest = request.defaults({'proxy': proxyUrl});

// interface RequestPromise extends Promise<RequestResponse> {
//   abort: () => void
// }

/**
 * promise 形式的请求方法
 * @param {*} url
 * @param {*} options
 */
const buildHttpPromose = async(url: string, options: RequestOptions): Promise<RequestResponse> => {
  return new Promise((resolve, reject) => {
    void fetchData(url, options.method, options, (err, resp, body) => {
      // options.isShowProgress && window.api.hideProgress()
      // debugRequest && console.log(`\n---response------${url}------------`)
      // debugRequest && console.log(body)
      // obj.requestObj = null
      // obj.cancelFn = null
      if (err) {
        reject(err)
        return
      }
      resolve(resp)
    })
    // .then(request => {
    //   // obj.requestObj = ro
    //   // if (obj.isCancelled) obj.cancelHttp()
    //   promise.abort = () => {
    //     request.destroy(new Error('cancelled'))
    //   }
    // })
  })
  // let obj = {
  //   isCancelled: false,
  //   cancelHttp: () => {
  //     if (!obj.requestObj) return obj.isCancelled = true
  //     cancelHttp(obj.requestObj)
  //     obj.requestObj = null
  //     obj.promise = obj.cancelHttp = null
  //     obj.cancelFn(new Error(requestMsg.cancelRequest))
  //     obj.cancelFn = null
  //   },
  // }
  // obj.promise = new Promise((resolve, reject) => {
  //   obj.cancelFn = reject
  //   debugRequest && console.log(`\n---send request------${url}------------`)
  //   fetchData(url, options.method, options, (err, resp, body) => {
  //     // options.isShowProgress && window.api.hideProgress()
  //     debugRequest && console.log(`\n---response------${url}------------`)
  //     debugRequest && console.log(body)
  //     obj.requestObj = null
  //     obj.cancelFn = null
  //     if (err) { reject(err); return }
  //     resolve(resp)
  //   }).then(ro => {
  //     obj.requestObj = ro
  //     if (obj.isCancelled) obj.cancelHttp()
  //   })
  // })
  // return obj
}

/**
 * 请求超时自动重试
 * @param {*} url
 * @param {*} options
 */
export const httpFetch = async(url: string, options: RequestOptions = { method: 'get' }) => {
  return buildHttpPromose(url, options).catch(async(err: any) => {
    // console.log('出错', err)
    if (err.message === 'socket hang up') {
      // window.globalObj.apiSource = 'temp'
      throw new Error(requestMsg.unachievable)
    }
    switch (err.code) {
      case 'ETIMEDOUT':
      case 'ESOCKETTIMEDOUT':
        throw new Error(requestMsg.timeout)
      case 'ENOTFOUND':
        throw new Error(requestMsg.notConnectNetwork)
      default:
        throw err
    }
  })
  // requestObj.promise = requestObj.promise.catch(async err => {
  //   // console.log('出错', err)
  //   if (err.message === 'socket hang up') {
  //     // window.globalObj.apiSource = 'temp'
  //     return Promise.reject(new Error(requestMsg.unachievable))
  //   }
  //   switch (err.code) {
  //     case 'ETIMEDOUT':
  //     case 'ESOCKETTIMEDOUT':
  //       return Promise.reject(new Error(requestMsg.timeout))
  //     case 'ENOTFOUND':
  //       return Promise.reject(new Error(requestMsg.notConnectNetwork))
  //     default:
  //       return Promise.reject(err)
  //   }
  // })
  // return requestPromise
}

const fetchData = async(url: string, method: RequestOptions['method'], {
  headers = {},
  format = 'json',
  timeout = 15000,
  ...options
}, callback: RequestCallback) => {
  // console.log(url, options)
  console.log('---start---', url)
  headers = Object.assign({}, headers)

  return request(url, {
    ...options,
    method,
    headers: Object.assign({}, defaultHeaders, headers),
    timeout,
    agent: getRequestAgent(url),
    json: format === 'json',
  }, (err, resp, body) => {
    callback(err, resp, body)
  })
}
