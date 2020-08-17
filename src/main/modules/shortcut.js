const { globalShortcut, app } = require('electron')
app.on('ready', function() {
  globalShortcut.register('CommandOrControl+Alt+P', function() {
    global.mainWindow.webContents.send('player:togglePlay')
  })
  globalShortcut.register('CommandOrControl+Alt+Right', function() {
    global.mainWindow.webContents.send('player:next')
  })
})

app.on('will-quit', function() {
  globalShortcut.unregisterAll()
})
