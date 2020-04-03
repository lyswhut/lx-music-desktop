const { mainOn } = require('../../common/ipc')

mainOn('setIgnoreMouseEvents', (event, isIgnored) => {
  if (!global.mainWindow) return
  isIgnored
    ? global.mainWindow.setIgnoreMouseEvents(true, { forward: true })
    : global.mainWindow.setIgnoreMouseEvents(false)
})
