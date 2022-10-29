import { URL } from 'url'
import http from 'http'
import https from 'https'

export interface Options {
  method: 'get' | 'head' | 'delete' | 'patch' | 'post' | 'put'
  params?: Record<string, string>
  // body?: Record<string, string>
  headers?: Record<string, string>
  timeout?: number
  agent?: http.Agent
}

const defaultOptions: Options = {
  method: 'get',
}

type HttpCallback = (res: http.IncomingMessage) => void

const sendRequest = (url: string, options: Options, callback?: HttpCallback) => {
  const urlParse = new URL(url)
  const httpOptions: http.RequestOptions | https.RequestOptions = {
    host: urlParse.hostname,
    port: urlParse.port,
    path: urlParse.pathname + urlParse.search,
    method: options.method,
  }

  if (options.params) {
    (httpOptions.path as string) += `${urlParse.search ? '&' : '?'}${Object.entries(options.params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')}`
  }

  if (options.headers) httpOptions.headers = { ...options.headers }

  if (options.agent) httpOptions.agent = options.agent

  return urlParse.protocol == 'https:'
    ? https.request(httpOptions, callback)
    : http.request(httpOptions, callback)
}

const applyTimeout = (request: http.ClientRequest, time: number) => {
  let timeout: NodeJS.Timeout | null = setTimeout(() => {
    timeout = null
    if (request.destroyed) return
    request.destroy(new Error('Request timeout'))
  }, time)
  request.on('response', () => {
    if (!timeout) return
    clearTimeout(timeout)
    timeout = null
  })
}

// const isRequireRedirect = (response: http.IncomingMessage) => {
//   return response.statusCode &&
//     response.statusCode > 300 &&
//     response.statusCode < 400 &&
//     Object.hasOwn(response.headers, 'location') &&
//     response.headers.location
// }

// export function request(url: string, callback: HttpCallback)
// export function request(url: string, options: Partial<Options>, callback: HttpCallback)
export function request(url: string, _options: Partial<Options>, callback?: HttpCallback) {
  let options: Options = { ...defaultOptions, ..._options }
  const request = sendRequest(url, options, callback)
  if (options.timeout) applyTimeout(request, options.timeout)
  return request
}

