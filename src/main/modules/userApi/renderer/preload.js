const { contextBridge, ipcRenderer } = require('electron')
const needle = require('needle')
const { createCipheriv, publicEncrypt, constants, randomBytes, createHash } = require('crypto')
const USER_API_RENDERER_EVENT_NAME = require('../rendererEvent/name')

const sendMessage = (action, status, data, message) => {
  ipcRenderer.send(action, { status, data, message })
}

let isInitedApi = false
const EVENT_NAMES = {
  request: 'request',
  inited: 'inited',
}
const eventNames = Object.values(EVENT_NAMES)
const events = {
  request: null,
}
const allSources = ['kw', 'kg', 'tx', 'wy', 'mg']
const supportQualitys = {
  kw: ['128k', '320k', 'flac'],
  kg: ['128k', '320k', 'flac'],
  tx: ['128k', '320k', 'flac'],
  wy: ['128k', '320k', 'flac'],
  mg: ['128k', '320k', 'flac'],
}
const supportActions = {
  kw: ['musicUrl'],
  kg: ['musicUrl'],
  tx: ['musicUrl'],
  wy: ['musicUrl'],
  mg: ['musicUrl'],
  xm: ['musicUrl'],
}

const handleRequest = (context, { requestKey, data }) => {
  // console.log(data)
  if (!events.request) return sendMessage(USER_API_RENDERER_EVENT_NAME.response, false, { requestKey }, 'Request event is not defined')
  try {
    events.request.call(context, { source: data.source, action: data.action, info: data.info }).then(response => {
      let sendData = {
        requestKey,
      }
      switch (data.action) {
        case 'musicUrl':
          sendData.result = {
            source: data.source,
            action: data.action,
            data: {
              type: data.info.type,
              url: response,
            },
          }
          break
      }
      sendMessage(USER_API_RENDERER_EVENT_NAME.response, true, sendData)
    }).catch(err => {
      sendMessage(USER_API_RENDERER_EVENT_NAME.response, false, { requestKey }, err.message)
    })
  } catch (err) {
    sendMessage(USER_API_RENDERER_EVENT_NAME.response, false, { requestKey }, err.message)
  }
}

/**
 *
 * @param {*} context
 * @param {*} info {
 *                    status: true,
 *                    message: 'xxx',
 *                    sources: {
 *                         kw: ['128k', '320k', 'flac'],
 *                         kg: ['128k', '320k', 'flac'],
 *                         tx: ['128k', '320k', 'flac'],
 *                         wy: ['128k', '320k', 'flac'],
 *                         mg: ['128k', '320k', 'flac'],
 *                     }
 *                 }
 */
const handleInit = (context, info) => {
  if (!info) {
    sendMessage(USER_API_RENDERER_EVENT_NAME.init, false, null, 'Init failed')
    // sendMessage(USER_API_RENDERER_EVENT_NAME.init, false, null, typeof info.message === 'string' ? info.message.substring(0, 100) : '')
    return
  }
  if (info.openDevTools === true) {
    sendMessage(USER_API_RENDERER_EVENT_NAME.openDevTools)
  }
  if (!info.status) {
    sendMessage(USER_API_RENDERER_EVENT_NAME.init, false, null, 'Init failed')
    // sendMessage(USER_API_RENDERER_EVENT_NAME.init, false, null, typeof info.message === 'string' ? info.message.substring(0, 100) : '')
    return
  }
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
    sendMessage(USER_API_RENDERER_EVENT_NAME.init, false, null, error.message)
    return
  }
  sendMessage(USER_API_RENDERER_EVENT_NAME.init, true, sourceInfo)

  ipcRenderer.on(USER_API_RENDERER_EVENT_NAME.request, (event, data) => {
    handleRequest(context, data)
  })
}

contextBridge.exposeInMainWorld('lx', {
  EVENT_NAMES,
  request(url, { method = 'get', timeout, headers, body, form, formData }, callback) {
    let options = { headers }
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
    options.response_timeout = timeout

    let request = needle.request(method, url, data, options, (err, resp, body) => {
      if (!err) {
        body = resp.body = resp.raw.toString()
        try {
          resp.body = JSON.parse(resp.body)
        } catch (_) {}
        body = resp.body
      }
      callback(err, {
        statusCode: resp.statusCode,
        statusMessage: resp.statusMessage,
        headers: resp.headers,
        bytes: resp.bytes,
        raw: resp.raw,
        body: body,
      }, body)
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
          if (isInitedApi) return
          isInitedApi = true
          handleInit(this, data)
          break
        default:
          resolve(new Error('Unknown event name: ' + eventName))
      }
    })
  },
  on(eventName, handler) {
    if (!eventNames.includes(eventName)) return Promise.reject(new Error('The event is not supported: ' + eventName))
    switch (eventName) {
      case EVENT_NAMES.request:
        events.request = handler
        break
    }
  },
  utils: {
    crypto: {
      aesEncrypt(buffer, mode, key, iv) {
        const cipher = createCipheriv('aes-128-' + mode, key, iv)
        return Buffer.concat([cipher.update(buffer), cipher.final()])
      },
      rsaEncrypt(buffer, key) {
        buffer = Buffer.concat([Buffer.alloc(128 - buffer.length), buffer])
        return publicEncrypt({ key: key, padding: constants.RSA_NO_PADDING }, buffer)
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
    },
  },
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
