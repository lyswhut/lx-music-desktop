const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { dialog } = require('electron')


mainHandle(ipcMainWindowNames.show_dialog, async(event, { type, message, detail }) => {
  if (!global.modules.mainWindow) throw new Error('mainWindow is undefined')
  dialog.showMessageBoxSync(global.modules.mainWindow, {
    type,
    message,
    detail,
  })
})
