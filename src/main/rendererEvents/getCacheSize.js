const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainHandle(ipcMainWindowNames.get_cache_size, async(event, options) => {
  if (!global.modals.mainWindow) throw new Error('mainWindow is undefined')
  return global.modals.mainWindow.webContents.session.getCacheSize()
})

