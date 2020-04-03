module.exports = mainWindow => {
  mainWindow.on('close', () => {
    mainWindow.setProgressBar(-1)
  })

  mainWindow.on('closed', () => {
    mainWindow = global.mainWindow = null
  })

  // mainWindow.on('restore', () => {
  //   mainWindow.webContents.send('restore')
  // })
}
