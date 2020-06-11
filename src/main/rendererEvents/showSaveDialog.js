const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { dialog } = require('electron')

mainHandle(ipcMainWindowNames.show_save_dialog, async(event, options) => {
  if (!global.modals.mainWindow) throw new Error('mainWindow is undefined')
  return dialog.showSaveDialog(global.modals.mainWindow, options)
})

