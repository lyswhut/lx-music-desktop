const { mainWindow: MAIN_WINDOW_EVENT_NAME } = require('../events/_name')
const { NAMES: { mainWindow: ipcMainWindowNames }, mainHandle } = require('../../common/ipc')


mainHandle(ipcMainWindowNames.set_app_setting, (event, config) => {
  if (!config) return
  global.lx_core.setAppConfig(config, MAIN_WINDOW_EVENT_NAME.name)
  return global.appSetting
})

mainHandle(ipcMainWindowNames.get_setting, async() => ({ setting: global.appSetting, version: global.appSettingVersion }))
