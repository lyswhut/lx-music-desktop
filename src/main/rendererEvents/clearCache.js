const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainHandle(ipcMainWindowNames.clear_cache, async(event, options) => {
  if (!global.modals.mainWindow) throw new Error('mainWindow is undefined')
  return global.modals.mainWindow.webContents.session.clearCache()
})


