import qs from 'node:querystring'
import {
  FormData,
  getGlobalDispatcher,
  request as nodeRrequest,
  ProxyAgent,
  setGlobalDispatcher,
  type Dispatcher,
} from 'undici'

const defaultOptions: Options = {
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
  },
  maxRedirect: 5,
} as const
let proxyAgent: ProxyAgent | null = null
let globalDispatcher = getGlobalDispatcher()
const buildDispatcher = () => {
  return proxyAgent ?? globalDispatcher
}

setGlobalDispatcher(buildDispatcher())

export const setProxy = (url?: string) => {
  proxyAgent = url ? new ProxyAgent(url) : null
  setGlobalDispatcher(buildDispatcher())
}
export const setProxyByHost = (host?: string, port?: string) => {
  console.log(host)
  setProxy(host ? `http://${host}:${port}` : undefined)
}
const CONTENT_TYPE = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  text: 'text/plain',
  formdata: 'multipart/form-data',
  xml: 'application/xml',
  binary: 'application/octet-stream',
}
type ParamsData = Record<string, string | number | null | undefined | boolean>
export interface Options {
  method?:
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'OPTIONS'
  | 'PATCH'
  | 'PROPFIND'
  | 'COPY'
  | 'MOVE'
  | 'MKCOL'
  | 'PROPPATCH'
  | 'QUOTA'
  query?: ParamsData
  headers?: Record<string, string | string[]>
  timeout?: number
  maxRedirect?: number
  signal?: AbortController['signal']
  json?: Record<string, unknown>
  form?: ParamsData
  binary?: Buffer | Uint8Array
  text?: string
  formdata?: Record<string, string | Buffer | Uint8Array>
  xml?: string
  needBody?: boolean
  needRaw?: boolean
  retryNum?: number
}
export interface Response<Res> {
  headers: {
    accept?: string | undefined
    'accept-language'?: string | undefined
    'accept-patch'?: string | undefined
    'accept-ranges'?: string | undefined
    'access-control-allow-credentials'?: string | undefined
    'access-control-allow-headers'?: string | undefined
    'access-control-allow-methods'?: string | undefined
    'access-control-allow-origin'?: string | undefined
    'access-control-expose-headers'?: string | undefined
    'access-control-max-age'?: string | undefined
    'access-control-request-headers'?: string | undefined
    'access-control-request-method'?: string | undefined
    age?: string | undefined
    allow?: string | undefined
    'alt-svc'?: string | undefined
    authorization?: string | undefined
    'cache-control'?: string | undefined
    connection?: string | undefined
    'content-disposition'?: string | undefined
    'content-encoding'?: string | undefined
    'content-language'?: string | undefined
    'content-length'?: string | undefined
    'content-location'?: string | undefined
    'content-range'?: string | undefined
    'content-type'?: string | undefined
    cookie?: string | undefined
    date?: string | undefined
    etag?: string | undefined
    expect?: string | undefined
    expires?: string | undefined
    forwarded?: string | undefined
    from?: string | undefined
    host?: string | undefined
    'if-match'?: string | undefined
    'if-modified-since'?: string | undefined
    'if-none-match'?: string | undefined
    'if-unmodified-since'?: string | undefined
    'last-modified'?: string | undefined
    location?: string | undefined
    origin?: string | undefined
    pragma?: string | undefined
    'proxy-authenticate'?: string | undefined
    'proxy-authorization'?: string | undefined
    'public-key-pins'?: string | undefined
    range?: string | undefined
    referer?: string | undefined
    'retry-after'?: string | undefined
    'sec-websocket-accept'?: string | undefined
    'sec-websocket-extensions'?: string | undefined
    'sec-websocket-key'?: string | undefined
    'sec-websocket-protocol'?: string | undefined
    'sec-websocket-version'?: string | undefined
    'set-cookie'?: string[] | undefined
    'strict-transport-security'?: string | undefined
    tk?: string | undefined
    trailer?: string | undefined
    'transfer-encoding'?: string | undefined
    upgrade?: string | undefined
    'user-agent'?: string | undefined
    vary?: string | undefined
    via?: string | undefined
    warning?: string | undefined
    'www-authenticate'?: string | undefined
  }
  body: Res
  raw: Uint8Array
  statusCode?: number
  statusMessage?: string
}

const buildRequestBody = (options: Options) => {
  let contentType: string | undefined
  let body: string | Buffer | Uint8Array | FormData | undefined
  if (options.json != null) {
    contentType = CONTENT_TYPE.json
    body = JSON.stringify(options.json)
  } else if (options.form != null) {
    contentType = CONTENT_TYPE.form
    body = qs.stringify(options.form)
  } else if (options.binary != null) {
    contentType = CONTENT_TYPE.binary
    body = options.binary
  } else if (options.formdata != null) {
    const formdata = new FormData()
    // eslint-disable-next-line guard-for-in
    for (const key in options.formdata) {
      formdata.append(key, options.formdata[key])
    }
    contentType = CONTENT_TYPE.formdata
    body = formdata
  } else if (options.xml != null) {
    contentType = CONTENT_TYPE.xml
    body = options.xml
  } else if (options.text != null) {
    contentType = CONTENT_TYPE.text
    body = options.text
  }
  const headers = options.headers ?? {}
  if (headers['Content-Type']) {
    contentType = headers['Content-Type'] as string
  }
  const finalHeaders: NonNullable<Options['headers']> = { ...defaultOptions.headers, ...headers }
  if (contentType) finalHeaders['Content-Type'] = contentType
  return [finalHeaders, body] as const
}

const buildRequestDispatcher = (options: Options) => {
  return buildDispatcher()
}

export const request = async <T = unknown>(url: string, options: Options = {}): Promise<Response<T>> => {
  const method = (options.method?.toUpperCase() ?? 'GET') as Dispatcher.RequestOptions['method']
  const timeout = options.timeout ?? defaultOptions.timeout
  const [headers, body] = buildRequestBody(options)
  // console.log(url, {
  //   method,
  //   bodyTimeout: timeout,
  //   headersTimeout: timeout,
  //   headers,
  //   query: options.query,
  //   body,
  //   signal: options.signal,
  //   dispatcher: buildRequestDispatcher(options),
  // })
  return nodeRrequest(url, {
    method,
    bodyTimeout: timeout,
    headersTimeout: timeout,
    headers,
    query: options.query,
    body,
    signal: options.signal,
    dispatcher: buildRequestDispatcher(options),
  }).then(async(response) => {
    if (options.needBody) {
      return {
        headers: response.headers,
        statusCode: response.statusCode,
        body: response.body as unknown as T,
      } satisfies Omit<Response<T>, 'raw'> as Response<T>
    }
    if (options.needRaw) {
      return {
        headers: response.headers,
        statusCode: response.statusCode,
        raw: new Uint8Array(await response.body.arrayBuffer()),
      } satisfies Omit<Response<T>, 'body'> as unknown as Response<T>
    }
    // console.log(response)
    let body = (await response.body.text()) as T
    if (!headers['Content-Type'] || headers['Content-Type'].includes(CONTENT_TYPE.json)) {
      try {
        body = JSON.parse(body as string) as T
      } catch {}
    }
    return {
      body,
      headers: response.headers,
      statusCode: response.statusCode,
    } satisfies Omit<Response<T>, 'raw'> as Response<T>
  })
}
