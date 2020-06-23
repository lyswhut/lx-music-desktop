const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainOn(ipcMainWindowNames.set_ignore_mouse_events, (event, isIgnored) => {
  if (!global.modules.mainWindow) return
  isIgnored
    ? global.modules.mainWindow.setIgnoreMouseEvents(true, { forward: true })
    : global.modules.mainWindow.setIgnoreMouseEvents(false)
})
