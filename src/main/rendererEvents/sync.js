const { mainSend, NAMES: { mainWindow: ipcMainWindowNames }, mainOn, mainHandle } = require('@common/ipc')
const { eventNames, modules, startServer, stopServer, getStatus, generateCode } = require('../modules/sync')


mainOn(ipcMainWindowNames.sync_action_list, (event, { action, data }) => {
  modules.list.sendListAction(action, data)
})

mainHandle(ipcMainWindowNames.sync_enable, (event, { enable, port }) => {
  return enable ? startServer(port) : stopServer()
})

mainHandle(ipcMainWindowNames.sync_get_status, () => {
  return getStatus()
})

mainHandle(ipcMainWindowNames.sync_generate_code, () => {
  return generateCode()
})

mainOn(ipcMainWindowNames.sync_list, (event, { action, data }) => {
  global.lx_event.sync.sync_handle_list({ action, data })
})

global.lx_event.sync.on(eventNames.sync_action_list, ({ action, data }) => {
  mainSend(global.modules.mainWindow, ipcMainWindowNames.sync_action_list, { action, data })
})
global.lx_event.sync.on(eventNames.status, status => {
  mainSend(global.modules.mainWindow, ipcMainWindowNames.sync_status, status)
})
global.lx_event.sync.on(eventNames.sync_list, ({ action, data }) => {
  mainSend(global.modules.mainWindow, ipcMainWindowNames.sync_list, { action, data })
})
