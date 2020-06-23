const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { dialog } = require('electron')

mainHandle(ipcMainWindowNames.select_dir, async(event, options) => {
  if (!global.modules.mainWindow) throw new Error('mainWindow is undefined')
  return dialog.showOpenDialog(global.modules.mainWindow, options)
})

