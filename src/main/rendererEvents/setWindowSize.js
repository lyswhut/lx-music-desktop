const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainOn(ipcMainWindowNames.set_window_size, (event, options) => {
  if (!global.modules.mainWindow) return
  global.modules.mainWindow.setBounds(options)
})

