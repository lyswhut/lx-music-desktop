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
mainOn('close', event => {
  if (global.mainWindow) {
    // global.mainWindowdow.destroy()
    // console.log('close')
    // app.quit()
    global.mainWindow.close()
  }
})
