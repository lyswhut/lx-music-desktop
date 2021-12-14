const { isWin } = require('../../common/utils')
const { mainSend, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
global.isQuitting = false
global.isTrafficLightClose = false // 是否点击软件上的关闭按钮关闭

module.exports = mainWindow => {
  mainWindow.on('close', event => {
    if (global.isQuitting || !global.appSetting.tray.isShow || (!isWin && !global.isTrafficLightClose)) {
      mainWindow.setProgressBar(-1)
      global.lx_event.winLyric.close()
      return
    }

    if (global.isTrafficLightClose) global.isTrafficLightClose = false
    event.preventDefault()
    mainWindow.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = global.modules.mainWindow = null
  })

  // mainWindow.on('restore', () => {
  //   mainWindow.webContents.send('restore')
  // })
  mainWindow.on('focus', () => {
    mainSend(mainWindow, ipcMainWindowNames.focus)
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    global.lx_event.mainWindow.readyToShow()
  })

  mainWindow.on('show', () => {
    global.lx_event.mainWindow.show()
  })
  mainWindow.on('hide', () => {
    global.lx_event.mainWindow.hide()
  })
}
