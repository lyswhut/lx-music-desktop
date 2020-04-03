module.exports = mainWindow => {
  mainWindow.on('close', event => {
    if (global.appSetting.tray.isToTray) {
      event.preventDefault()
      mainWindow.hide()
      return
    }
    mainWindow.setProgressBar(-1)
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
