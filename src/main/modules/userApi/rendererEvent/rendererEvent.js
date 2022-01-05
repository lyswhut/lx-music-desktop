const { mainOn, mainSend } = require('@common/ipc')

const USER_API_RENDERER_EVENT_NAME = require('../rendererEvent/name')
const { createWindow } = require('../main')
const { getUserApis } = require('../utils')

let userApi
let status = { status: true }
const requestQueue = new Map()
const timeouts = {}

const handleInit = (event, { status, message, data: apiInfo }) => {
  // console.log('inited')
  if (!status) {
    console.log('init failed:', message)
    global.lx_event.userApi.status(status = { status: false, apiInfo: userApi, message })
    return
  }
  global.lx_event.userApi.status(status = { status: true, apiInfo: { ...userApi, sources: apiInfo.sources } })
}
const handleResponse = (event, { status, data: { requestKey, result }, message }) => {
  const request = requestQueue.get(requestKey)
  if (!request) return
  requestQueue.delete(requestKey)
  clearTimeout(timeouts[requestKey])
  delete timeouts[requestKey]
  if (status) {
    request[0](result)
  } else {
    request[1](new Error(message))
  }
}
const handleOpenDevTools = () => {
  if (global.modules.userApiWindow) {
    global.modules.userApiWindow.webContents.openDevTools({
      mode: 'undocked',
    })
  }
}
mainOn(USER_API_RENDERER_EVENT_NAME.init, handleInit)
mainOn(USER_API_RENDERER_EVENT_NAME.response, handleResponse)
mainOn(USER_API_RENDERER_EVENT_NAME.openDevTools, handleOpenDevTools)

exports.loadApi = async apiId => {
  if (!apiId) return global.lx_event.userApi.status(status = { status: false, message: 'api id is null' })
  userApi = getUserApis().find(api => api.id == apiId)
  console.log('load api', userApi.name)
  await createWindow(userApi)
  // if (!userApi) return global.lx_event.userApi.status(status = { status: false, message: 'api script is not found' })
  // if (!global.modules.userApiWindow) {
  //   global.lx_event.userApi.status(status = { status: false, message: 'user api runtime is not defined' })
  //   throw new Error('user api window is not defined')
  // }

  // // const path = require('path')
  // // // eslint-disable-next-line no-undef
  // // userApi.script = require('fs').readFileSync(path.join(global.isDev ? __userApi : __dirname, 'renderer/test-api.js')).toString()
  // console.log('load api', userApi.name)
  // mainSend(global.modules.userApiWindow, USER_API_RENDERER_EVENT_NAME.init, { userApi })
}

exports.cancelRequest = requestKey => {
  if (!requestQueue.has(requestKey)) return
  const request = requestQueue.get(requestKey)
  request[1](new Error('Cancel request'))
  requestQueue.delete(requestKey)
  clearTimeout(timeouts[requestKey])
  delete timeouts[requestKey]
}

exports.request = ({ requestKey, data }) => new Promise((resolve, reject) => {
  if (!userApi) return reject(new Error('user api is not load'))

  // const requestKey = `request__${Math.random().toString().substring(2)}`

  timeouts[requestKey] = setTimeout(() => {
    exports.cancelRequest(requestKey)
  }, 20000)

  requestQueue.set(requestKey, [resolve, reject, data])
  mainSend(global.modules.userApiWindow, USER_API_RENDERER_EVENT_NAME.request, { requestKey, data })
})

exports.getStatus = () => status
