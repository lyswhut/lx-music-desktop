const { common: COMMON_EVENT_NAME, mainWindow: MAIN_WINDOW_EVENT_NAME } = require('./events/_name')
const { mainSend, NAMES: { mainWindow: ipcMainWindowNames } } = require('./../common/ipc')


global.lx_event.common.on(COMMON_EVENT_NAME.config, name => {
  if (MAIN_WINDOW_EVENT_NAME.name === name) return
  if (global.modals.mainWindow) mainSend(global.modals.mainWindow, ipcMainWindowNames.set_config, global.appSetting)
})

