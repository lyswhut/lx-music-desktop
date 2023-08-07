import { mainOn } from '@common/mainIpc'

import USER_API_RENDERER_EVENT_NAME from './name'
import { createWindow, openDevTools, sendEvent } from '../main'
import { getUserApis } from '../utils'
import { sendShowUpdateAlert, sendStatusChange } from '@main/modules/winMain'

let userApi: LX.UserApi.UserApiInfo
let apiStatus: LX.UserApi.UserApiStatus = { status: true }
const requestQueue = new Map()
const timeouts = new Map<string, NodeJS.Timeout>()
interface InitParams {
  params: {
    status: boolean
    message: string
    data: LX.UserApi.UserApiInfo
  }
}
interface ResponseParams {
  params: {
    status: boolean
    message: string
    data: {
      requestKey: string
      result: any
    }
  }
}
interface UpdateInfoParams {
  params: {
    data: {
      log: string
      updateUrl: string
    }
  }
}

export const init = () => {
  const handleInit = ({ params: { status, message, data: apiInfo } }: InitParams) => {
    // console.log('inited')
    // if (!status) {
    //   console.log('init failed:', message)
    //   global.lx_event.userApi.status(status = { status: true, apiInfo: { ...userApi, sources: apiInfo.sources } })
    //   return
    // }
    apiStatus = status
      ? { status: true, apiInfo: { ...userApi, sources: apiInfo.sources } }
      : { status: false, apiInfo: userApi, message }
    sendStatusChange(apiStatus)
  }
  const handleResponse = ({ params: { status, data: { requestKey, result }, message } }: ResponseParams) => {
    const request = requestQueue.get(requestKey)
    if (!request) return
    requestQueue.delete(requestKey)
    clearRequestTimeout(requestKey)
    if (status) {
      request[0](result)
    } else {
      request[1](new Error(message))
    }
  }
  const handleOpenDevTools = () => {
    openDevTools()
  }
  const handleShowUpdateAlert = ({ params: { data } }: UpdateInfoParams) => {
    if (!userApi.allowShowUpdateAlert) return
    sendShowUpdateAlert({
      name: userApi.name,
      description: userApi.description,
      log: data.log,
      updateUrl: data.updateUrl,
    })
  }
  mainOn(USER_API_RENDERER_EVENT_NAME.init, handleInit)
  mainOn(USER_API_RENDERER_EVENT_NAME.response, handleResponse)
  mainOn(USER_API_RENDERER_EVENT_NAME.openDevTools, handleOpenDevTools)
  mainOn(USER_API_RENDERER_EVENT_NAME.showUpdateAlert, handleShowUpdateAlert)
}

export const clearRequestTimeout = (requestKey: string) => {
  const timeout = timeouts.get(requestKey)
  if (timeout) {
    clearTimeout(timeout)
    timeouts.delete(requestKey)
  }
}

export const loadApi = async(apiId: string) => {
  if (!apiId) {
    apiStatus = { status: false, message: 'api id is null' }
    sendStatusChange(apiStatus)
    return
  }
  const targetApi = getUserApis().find(api => api.id == apiId)
  if (!targetApi) throw new Error('api not found')
  userApi = targetApi
  console.log('load api', userApi.name)
  await createWindow(userApi)
  // if (!userApi) return global.lx_event.userApi.status(status = { status: false, message: 'api script is not found' })
  // if (!global.modules.userApiWindow) {
  //   global.lx_event.userApi.status(status = { status: false, message: 'user api runtime is not defined' })
  //   throw new Error('user api window is not defined')
  // }

  // // const path = require('path')
  // // // eslint-disable-next-line no-undef
  // // userApi.script = require('fs').readFileSync(join(process.env.NODE_ENV !== 'production' ? __userApi : __dirname, 'renderer/test-api.js')).toString()
  // console.log('load api', userApi.name)
  // mainSend(global.modules.userApiWindow, USER_API_RENDERER_EVENT_NAME.init, { userApi })
}

export const cancelRequest = (requestKey: string) => {
  if (!requestQueue.has(requestKey)) return
  const request = requestQueue.get(requestKey)
  request[1](new Error('Cancel request'))
  requestQueue.delete(requestKey)
  clearRequestTimeout(requestKey)
}

export const request = async({ requestKey, data }: LX.UserApi.UserApiRequestParams): Promise<any> => await new Promise((resolve, reject) => {
  if (!userApi) {
    reject(new Error('user api is not load'))
  }

  // const requestKey = `request__${Math.random().toString().substring(2)}`
  const timeout = timeouts.get(requestKey)
  if (timeout) {
    clearTimeout(timeout)
    timeouts.delete(requestKey)
    cancelRequest(requestKey)
  }

  timeouts.set(requestKey, setTimeout(() => {
    cancelRequest(requestKey)
  }, 20000))

  requestQueue.set(requestKey, [resolve, reject, data])
  sendRequest({ requestKey, data })
})

export const getStatus = (): LX.UserApi.UserApiStatus => apiStatus

export const setAllowShowUpdateAlert = (id: string, enable: boolean) => {
  if (!userApi || userApi.id != id) return
  userApi.allowShowUpdateAlert = enable
}

export const sendRequest = (reqData: { requestKey: string, data: any }) => {
  sendEvent(USER_API_RENDERER_EVENT_NAME.request, reqData)
}
