const { app } = require('electron')
const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainOn(ipcMainWindowNames.min, event => {
  if (global.modals.mainWindow) {
    global.modals.mainWindow.minimize()
  }
})
mainOn(ipcMainWindowNames.max, event => {
  if (global.modals.mainWindow) {
    global.modals.mainWindow.maximize()
  }
})
mainOn(ipcMainWindowNames.close, (event, isForce) => {
  if (isForce) return app.exit(0)
  global.isTrafficLightClose = true
  if (global.modals.mainWindow) global.modals.mainWindow.close()
})
