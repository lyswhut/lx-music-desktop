const { mainHandle } = require('../../common/ipc')
const { dialog } = require('electron')

mainHandle('showSaveDialog', async(event, options) => {
  if (!global.mainWindow) throw new Error('mainwindow is undefined')
  return dialog.showSaveDialog(global.mainWindow, options)
})

