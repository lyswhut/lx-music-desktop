const { mainHandle } = require('../../common/ipc')

mainHandle('clearCache', async(event, options) => {
  if (!global.mainWindow) throw new Error('mainwindow is undefined')
  return global.mainWindow.webContents.session.clearCache()
})


