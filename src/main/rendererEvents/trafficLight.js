const { app } = require('electron')
const { mainOn, mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { isLinux } = require('@common/utils')

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
  if (isLinux) { // linux 需要先设置为可调整窗口大小才能全屏
    if (isFullscreen) {
      await global.modules.mainWindow.setResizable(isFullscreen)
      await global.modules.mainWindow.setFullScreen(isFullscreen)
    } else {
      await global.modules.mainWindow.setFullScreen(isFullscreen)
      await global.modules.mainWindow.setResizable(isFullscreen)
    }
  } else {
    await global.modules.mainWindow.setFullScreen(isFullscreen)
  }
  return isFullscreen
})
