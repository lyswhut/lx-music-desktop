const { app } = require('electron')
const { mainOn } = require('../../common/ipc')

mainOn('min', event => {
  if (global.mainWindow) {
    global.mainWindow.minimize()
  }
})
mainOn('max', event => {
  if (global.mainWindow) {
    global.mainWindow.maximize()
  }
})
mainOn('close', (event, isForce) => {
  if (isForce) return app.exit(0)
  global.isTrafficLightClose = true
  if (global.mainWindow) global.mainWindow.close()
})
