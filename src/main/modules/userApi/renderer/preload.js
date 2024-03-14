import { contextBridge, ipcRenderer, webFrame } from 'electron'
import needle from 'needle'
import zlib from 'zlib'
import { createCipheriv, publicEncrypt, constants, randomBytes, createHash } from 'crypto'
import USER_API_RENDERER_EVENT_NAME from '../rendererEvent/name'
import { httpOverHttp, httpsOverHttp } from 'tunnel'


const sendMessage = (action, data, status, message) => {
  ipcRenderer.send(action, { data, status, message })
}

let isInitedApi = false
const proxy = {
  host: '',
  port: '',
}
let isShowedUpdateAlert = false
const EVENT_NAMES = {
  request: 'request',
  inited: 'inited',
  updateAlert: 'updateAlert',
}
const eventNames = Object.values(EVENT_NAMES)
const events = {
  request: null,
}
const allSources = ['kw', 'kg', 'tx', 'wy', 'mg', 'local']
const supportQualitys = {
  kw: ['128k', '320k', 'flac', 'flac24bit'],
  kg: ['128k', '320k', 'flac', 'flac24bit'],
  tx: ['128k', '320k', 'flac', 'flac24bit'],
  wy: ['128k', '320k', 'flac', 'flac24bit'],
  mg: ['128k', '320k', 'flac', 'flac24bit'],
  local: [],
}
const supportActions = {
  kw: ['musicUrl'],
  kg: ['musicUrl'],
  tx: ['musicUrl'],
  wy: ['musicUrl'],
  mg: ['musicUrl'],
  xm: ['musicUrl'],
  local: ['musicUrl', 'lyric', 'pic'],
}

const httpsRxp = /^https:/
const getRequestAgent = url => {
  return proxy.host ? (httpsRxp.test(url) ? httpsOverHttp : httpOverHttp)({
    proxy: {
      host: proxy.host,
      port: proxy.port,
    },
  }) : undefined
}

const verifyLyricInfo = (info) => {
  if (typeof info != 'object' || typeof info.lyric != 'string') throw new Error('failed')
  if (info.lyric.length > 51200) throw new Error('failed')
  return {
    lyric: info.lyric,
    tlyric: (typeof info.tlyric == 'string' && info.tlyric.length < 5120) ? info.tlyric : null,
    rlyric: (typeof info.rlyric == 'string' && info.rlyric.length < 5120) ? info.rlyric : null,
    lxlyric: (typeof info.lxlyric == 'string' && info.lxlyric.length < 8192) ? info.lxlyric : null,
  }
}

const handleRequest = (context, { requestKey, data }) => {
  // console.log(data)
  if (!events.request) return sendMessage(USER_API_RENDERER_EVENT_NAME.response, { requestKey }, false, 'Request event is not defined')
  try {
    events.request.call(context, { source: data.source, action: data.action, info: data.info }).then(response => {
      let sendData = {
        requestKey,
      }
      switch (data.action) {
        case 'musicUrl':
          if (typeof response != 'string' || response.length > 2048 || !/^https?:/.test(response)) throw new Error('failed')
          sendData.result = {
            source: data.source,
            action: data.action,
            data: {
              type: data.info.type,
              url: response,
            },
          }
          break
        case 'lyric':
          sendData.result = {
            source: data.source,
            action: data.action,
            data: verifyLyricInfo(response),
          }
          break
        case 'pic':
          if (typeof response != 'string' || response.length > 2048 || !/^https?:/.test(response)) throw new Error('failed')
          sendData.result = {
            source: data.source,
            action: data.action,
            data: response,
          }
          break
      }
      sendMessage(USER_API_RENDERER_EVENT_NAME.response, sendData, true)
    }).catch(err => {
      sendMessage(USER_API_RENDERER_EVENT_NAME.response, { requestKey }, false, err.message)
    })
  } catch (err) {
    sendMessage(USER_API_RENDERER_EVENT_NAME.response, { requestKey }, false, err.message)
  }
}

/**
 *
 * @param {*} context
 * @param {*} info {
 *                    openDevTools: false,
 *                    message: 'xxx',
 *                    sources: {
 *                         kw: ['128k', '320k', 'flac', 'flac24bit'],
 *                         kg: ['128k', '320k', 'flac', 'flac24bit'],
 *                         tx: ['128k', '320k', 'flac', 'flac24bit'],
 *                         wy: ['128k', '320k', 'flac', 'flac24bit'],
 *                         mg: ['128k', '320k', 'flac', 'flac24bit'],
 *                     }
 *                 }
 */
const handleInit = (context, info) => {
  if (!info) {
    sendMessage(USER_API_RENDERER_EVENT_NAME.init, null, false, 'Missing required parameter init info')
    // sendMessage(USER_API_RENDERER_EVENT_NAME.init, false, null, typeof info.message === 'string' ? info.message.substring(0, 100) : '')
    return
  }
  if (info.openDevTools === true) {
    sendMessage(USER_API_RENDERER_EVENT_NAME.openDevTools)
  }
  // if (!info.status) {
  //   sendMessage(USER_API_RENDERER_EVENT_NAME.init, null, false, 'Missing required parameter init info')
  //   // sendMessage(USER_API_RENDERER_EVENT_NAME.init, false, null, typeof info.message === 'string' ? info.message.substring(0, 100) : '')
  //   return
  // }
  const sourceInfo = {
    sources: {},
  }
  try {
    for (const source of allSources) {
      const userSource = info.sources[source]
      if (!userSource || userSource.type !== 'music') continue
      const qualitys = supportQualitys[source]
      const actions = supportActions[source]
      sourceInfo.sources[source] = {
        type: 'music',
        actions: actions.filter(a => userSource.actions.includes(a)),
        qualitys: qualitys.filter(q => userSource.qualitys.includes(q)),
      }
    }
  } catch (error) {
    console.log(error)
    sendMessage(USER_API_RENDERER_EVENT_NAME.init, null, false, error.message)
    return
  }
  sendMessage(USER_API_RENDERER_EVENT_NAME.init, sourceInfo, true)

  ipcRenderer.on(USER_API_RENDERER_EVENT_NAME.request, (event, data) => {
    handleRequest(context, data)
  })
}

const handleShowUpdateAlert = (data, resolve, reject) => {
  if (!data || typeof data != 'object') return reject(new Error('parameter format error.'))
  if (!data.log || typeof data.log != 'string') return reject(new Error('log is required.'))
  if (data.updateUrl && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(data.updateUrl) && data.updateUrl.length > 1024) delete data.updateUrl
  if (data.log.length > 1024) data.log = data.log.substring(0, 1024) + '...'
  sendMessage(USER_API_RENDERER_EVENT_NAME.showUpdateAlert, {
    log: data.log,
    updateUrl: data.updateUrl,
  })
  resolve()
}

const onError = (errorMessage) => {
  if (isInitedApi) return
  isInitedApi = true
  if (errorMessage.length > 1024) errorMessage = errorMessage.substring(0, 1024) + '...'
  sendMessage(USER_API_RENDERER_EVENT_NAME.init, null, false, errorMessage)
}

const initEnv = (userApi) => {
  proxy.host = userApi.proxy.host
  proxy.port = userApi.proxy.port

  contextBridge.exposeInMainWorld('lx', {
    EVENT_NAMES,
    request(url, { method = 'get', timeout, headers, body, form, formData }, callback) {
      let options = {
        headers,
        agent: getRequestAgent(url),
      }
      let data
      if (body) {
        data = body
      } else if (form) {
        data = form
        // data.content_type = 'application/x-www-form-urlencoded'
        options.json = false
      } else if (formData) {
        data = formData
        // data.content_type = 'multipart/form-data'
        options.json = false
      }
      options.response_timeout = typeof timeout == 'number' && timeout > 0 ? Math.min(timeout, 60_000) : 60_000

      let request = needle.request(method, url, data, options, (err, resp, body) => {
        // console.log(err, resp, body)
        try {
          if (err) {
            callback.call(this, err, null, null)
          } else {
            body = resp.body = resp.raw.toString()
            try {
              resp.body = JSON.parse(resp.body)
            } catch (_) {}
            body = resp.body
            callback.call(this, err, {
              statusCode: resp.statusCode,
              statusMessage: resp.statusMessage,
              headers: resp.headers,
              bytes: resp.bytes,
              raw: resp.raw,
              body,
            }, body)
          }
        } catch (err) {
          onError(err.message)
        }
      }).request

      return () => {
        if (!request.aborted) request.abort()
        request = null
      }
    },
    send(eventName, data) {
      return new Promise((resolve, reject) => {
        if (!eventNames.includes(eventName)) return reject(new Error('The event is not supported: ' + eventName))
        switch (eventName) {
          case EVENT_NAMES.inited:
            if (isInitedApi) return reject(new Error('Script is inited'))
            isInitedApi = true
            handleInit(this, data)
            resolve()
            break
          case EVENT_NAMES.updateAlert:
            if (isShowedUpdateAlert) return reject(new Error('The update alert can only be called once.'))
            isShowedUpdateAlert = true
            handleShowUpdateAlert(data, resolve, reject)
            break
          default:
            reject(new Error('Unknown event name: ' + eventName))
        }
      })
    },
    on(eventName, handler) {
      if (!eventNames.includes(eventName)) return Promise.reject(new Error('The event is not supported: ' + eventName))
      switch (eventName) {
        case EVENT_NAMES.request:
          events.request = handler
          break
        default: return Promise.reject(new Error('The event is not supported: ' + eventName))
      }
      return Promise.resolve()
    },
    utils: {
      crypto: {
        aesEncrypt(buffer, mode, key, iv) {
          const cipher = createCipheriv(mode, key, iv)
          return Buffer.concat([cipher.update(buffer), cipher.final()])
        },
        rsaEncrypt(buffer, key) {
          buffer = Buffer.concat([Buffer.alloc(128 - buffer.length), buffer])
          return publicEncrypt({ key, padding: constants.RSA_NO_PADDING }, buffer)
        },
        randomBytes(size) {
          return randomBytes(size)
        },
        md5(str) {
          return createHash('md5').update(str).digest('hex')
        },
      },
      buffer: {
        from(...args) {
          return Buffer.from(...args)
        },
        bufToString(buf, format) {
          return Buffer.from(buf, 'binary').toString(format)
        },
      },
      zlib: {
        inflate(buf) {
          return new Promise((resolve, reject) => {
            zlib.inflate(buf, (err, data) => {
              if (err) reject(new Error(err.message))
              else resolve(data)
            })
          })
        },
        deflate(data) {
          return new Promise((resolve, reject) => {
            zlib.deflate(data, (err, buf) => {
              if (err) reject(new Error(err.message))
              else resolve(buf)
            })
          })
        },
      },
    },
    currentScriptInfo: {
      name: userApi.name,
      description: userApi.description,
      version: userApi.version,
      author: userApi.author,
      homepage: userApi.homepage,
      rawScript: userApi.script,
    },
    version: '2.0.0',
    env: 'desktop',
    // removeEvent(eventName, handler) {
    //   if (!eventNames.includes(eventName)) return Promise.reject(new Error('The event is not supported: ' + eventName))
    //   let handlers
    //   switch (eventName) {
    //     case EVENT_NAMES.request:
    //       handlers = events.request
    //       break
    //   }
    //   for (let index = 0; index < handlers.length; index++) {
    //     if (handlers[index] === handler) {
    //       handlers.splice(index, 1)
    //       break
    //     }
    //   }
    // },
    // removeAllEvents() {
    //   for (const handlers of Object.values(events)) {
    //     handlers.splice(0, handlers.length)
    //   }
    // },
  })

  contextBridge.exposeInMainWorld('__lx_init_error_handler__', {
    sendError(errorMessage) {
      onError(errorMessage)
    },
  })

  webFrame.executeJavaScript(`(() => {
window.addEventListener('error', (event) => {
  if (event.isTrusted) globalThis.__lx_init_error_handler__.sendError(event.message.replace(/^Uncaught\\sError:\\s/, ''))
})
window.addEventListener('unhandledrejection', (event) => {
  if (!event.isTrusted) return
  const message = typeof event.reason === 'string' ? event.reason : event.reason?.message ?? String(event.reason)
  globalThis.__lx_init_error_handler__.sendError(message.replace(/^Error:\\s/, ''))
})
})()`)

  webFrame.executeJavaScript(userApi.script).catch(_ => _)
}


ipcRenderer.on(USER_API_RENDERER_EVENT_NAME.initEnv, (event, data) => {
  initEnv(data)
})

ipcRenderer.on(USER_API_RENDERER_EVENT_NAME.proxyUpdate, (event, data) => {
  proxy.host = data.host
  proxy.port = data.port
})
