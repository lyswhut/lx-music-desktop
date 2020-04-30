const { isMac } = require('../../common/utils')
global.isQuitting = false
global.isTrafficLightClose = false // 是否点击软件上的关闭按钮关闭

module.exports = mainWindow => {
  mainWindow.on('close', event => {
    if (global.isQuitting || !global.appSetting.tray.isToTray || (isMac && !global.isTrafficLightClose)) {
      mainWindow.setProgressBar(-1)
      return
    }

    if (global.isTrafficLightClose) global.isTrafficLightClose = false
    event.preventDefault()
    mainWindow.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = global.mainWindow = null
  })

  // mainWindow.on('restore', () => {
  //   mainWindow.webContents.send('restore')
  // })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}
