const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { dialog } = require('electron')

mainHandle(ipcMainWindowNames.select_dir, async(event, options) => {
  if (!global.modals.mainWindow) throw new Error('mainWindow is undefined')
  return dialog.showOpenDialog(global.modals.mainWindow, options)
})

