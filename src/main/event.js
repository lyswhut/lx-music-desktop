const { common: COMMON_EVENT_NAME, mainWindow: MAIN_WINDOW_EVENT_NAME } = require('./events/_name')
const { mainSend, NAMES: { mainWindow: ipcMainWindowNames } } = require('./../common/ipc')
const { getAppHotKeyConfig } = require('./utils')

global.lx_event.common.on(COMMON_EVENT_NAME.configStatus, name => {
  if (MAIN_WINDOW_EVENT_NAME.name === name) return
  if (global.modules.mainWindow) mainSend(global.modules.mainWindow, ipcMainWindowNames.set_config, global.appSetting)
})

global.lx_event.common.on(COMMON_EVENT_NAME.initHotKey, () => {
  global.appHotKey.config = getAppHotKeyConfig()
})

global.lx_event.mainWindow.on(MAIN_WINDOW_EVENT_NAME.quit, () => {
  global.isTrafficLightClose = false
  global.isQuitting = true
  global.modules.mainWindow.close()
})
global.lx_event.mainWindow.on(MAIN_WINDOW_EVENT_NAME.toggle_minimize, () => {
  if (global.modules.mainWindow.isMinimized()) {
    if (!global.modules.mainWindow.isVisible()) {
      global.modules.mainWindow.show()
    }
    global.modules.mainWindow.restore()
    global.modules.mainWindow.focus()
  } else {
    global.modules.mainWindow.minimize()
  }
})
global.lx_event.mainWindow.on(MAIN_WINDOW_EVENT_NAME.toggle_hide, () => {
  global.modules.mainWindow.isVisible()
    ? global.modules.mainWindow.hide()
    : global.modules.mainWindow.show()
})
