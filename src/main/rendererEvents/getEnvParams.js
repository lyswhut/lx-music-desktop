const { mainHandle, mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainHandle(ipcMainWindowNames.get_env_params, async(event, options) => {
  return global.envParams
})

mainOn(ipcMainWindowNames.clear_env_params_deeplink, () => {
  global.envParams.deeplink = null
})
