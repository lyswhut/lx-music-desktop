// const { app } = require('electron')
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
mainOn('close', (event, arg) => {
  if (global.mainWindow) {
    console.log('close', arg)
    if (arg && arg.min) {
      global.mainWindow.hide()
      global.mainWindow.setSkipTaskbar(true)
      return
    }
    // global.mainWindowdow.destroy()
    // app.quit()
    global.mainWindow.close()
  }
})
