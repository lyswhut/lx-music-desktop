const { mainSend, mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('@common/ipc')
const { getApiList, importApi, removeApi, setApi, getStatus, request, cancelRequest, eventNames } = require('../modules/userApi')

const handleStatusChange = status => {
  mainSend(global.modules.mainWindow, ipcMainWindowNames.user_api_status, status)
}

global.lx_event.userApi.on(eventNames.status, handleStatusChange)

mainHandle(ipcMainWindowNames.import_user_api, async(event, script) => {
  return importApi(script)
})

mainHandle(ipcMainWindowNames.remove_user_api, (event, apiIds) => {
  return removeApi(apiIds)
})

mainHandle(ipcMainWindowNames.set_user_api, (event, apiId) => {
  return setApi(apiId)
})

mainHandle(ipcMainWindowNames.get_user_api_list, event => {
  return getApiList()
})

mainHandle(ipcMainWindowNames.get_user_api_status, event => {
  return getStatus()
})

mainHandle(ipcMainWindowNames.request_user_api, (event, musicInfo) => {
  return request(musicInfo)
})
mainHandle(ipcMainWindowNames.request_user_api_cancel, (event, requestKey) => {
  return cancelRequest(requestKey)
})
