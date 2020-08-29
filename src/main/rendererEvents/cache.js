const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainHandle(ipcMainWindowNames.clear_cache, async(event, options) => {
  if (!global.modules.mainWindow) throw new Error('mainWindow is undefined')
  return global.modules.mainWindow.webContents.session.clearCache()
})

mainHandle(ipcMainWindowNames.get_cache_size, async(event, options) => {
  if (!global.modules.mainWindow) throw new Error('mainWindow is undefined')
  return global.modules.mainWindow.webContents.session.getCacheSize()
})
