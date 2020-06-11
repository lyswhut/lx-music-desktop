const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainHandle(ipcMainWindowNames.get_env_params, async(event, options) => {
  return global.envParams.cmdParams
})

