const { app } = require('electron')
const { mainOn, mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainOn(ipcMainWindowNames.min, event => {
  if (global.modules.mainWindow) {
    global.modules.mainWindow.minimize()
  }
})
mainOn(ipcMainWindowNames.max, event => {
  if (global.modules.mainWindow) {
    global.modules.mainWindow.maximize()
  }
})
mainOn(ipcMainWindowNames.close, (event, isForce) => {
  if (isForce) return app.exit(0)
  global.isTrafficLightClose = true
  if (global.modules.mainWindow) global.modules.mainWindow.close()
})
mainHandle(ipcMainWindowNames.fullscreen, async(event, isFullscreen) => {
  if (!global.modules.mainWindow) return false
  await global.modules.mainWindow.setFullScreen(isFullscreen)
  return isFullscreen
})
