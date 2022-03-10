const { nativeTheme } = require('electron')

const { NAMES: { mainWindow: ipcMainWindowNames }, mainSend } = require('@common/ipc')

nativeTheme.addListener('updated', (event) => {
  // console.log(event.sender.shouldUseDarkColors)
  if (!global.modules.mainWindow) return
  mainSend(global.modules.mainWindow, ipcMainWindowNames.system_theme_change, event.sender.shouldUseDarkColors)
  // console.log(nativeTheme.themeSource)
})

