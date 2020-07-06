const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { dialog } = require('electron')


mainOn(ipcMainWindowNames.show_dialog, (event, { type, message, detail }) => {
  if (!global.modules.mainWindow) throw new Error('mainWindow is undefined')
  dialog.showMessageBoxSync(global.modules.mainWindow, {
    type,
    message,
    detail,
  })
})
