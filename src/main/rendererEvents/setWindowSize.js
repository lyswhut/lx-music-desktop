const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainOn(ipcMainWindowNames.set_window_size, (event, options) => {
  if (!global.modals.mainWindow) return
  global.modals.mainWindow.setBounds(options)
})

