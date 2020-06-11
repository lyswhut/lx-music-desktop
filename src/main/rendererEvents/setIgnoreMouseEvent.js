const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

mainOn(ipcMainWindowNames.set_ignore_mouse_events, (event, isIgnored) => {
  if (!global.modals.mainWindow) return
  isIgnored
    ? global.modals.mainWindow.setIgnoreMouseEvents(true, { forward: true })
    : global.modals.mainWindow.setIgnoreMouseEvents(false)
})
