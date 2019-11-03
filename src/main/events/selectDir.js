const { mainHandle } = require('../../common/ipc')
const { dialog } = require('electron')

mainHandle('selectDir', async(event, options) => {
  if (!global.mainWindow) throw new Error('mainwindow is undefined')
  return dialog.showOpenDialog(global.mainWindow, options)
})

