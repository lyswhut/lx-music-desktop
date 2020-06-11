const { mainWindow: MAIN_WINDOW_EVENT_NAME } = require('../events/_name')
const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainOn(ipcMainWindowNames.set_app_setting, (event, config) => {
  if (!config) return
  global.lx_event.common.setAppConfig(config, MAIN_WINDOW_EVENT_NAME.name)
})
