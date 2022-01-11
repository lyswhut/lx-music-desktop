const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainOn(ipcMainWindowNames.open_dev_tools, event => {
  if (global.modules.mainWindow) {
    if (global.modules.mainWindow.isDevToolsOpened()) {
      global.modules.mainWindow.webContents.closeDevTools()
    } else {
      global.modules.mainWindow.webContents.openDevTools({
        mode: 'undocked',
      })
    }
  }
})
