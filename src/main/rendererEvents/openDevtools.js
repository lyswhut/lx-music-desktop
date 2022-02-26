const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { openDevTools } = require('@main/utils')

mainOn(ipcMainWindowNames.open_dev_tools, event => {
  if (global.modules.mainWindow) {
    if (global.modules.mainWindow.isDevToolsOpened()) {
      global.modules.mainWindow.webContents.closeDevTools()
    } else {
      openDevTools(global.modules.mainWindow.webContents)
    }
  }
})
