const { mainOn, mainSend, NAMES: { mainWindow: ipcMainWindowNames } } = require('@common/ipc')


mainOn(ipcMainWindowNames.set_lyric_info, (event, info) => {
  if (info.info == null) {
    global.lx_event.mainWindow.setLyricInfo(info)
    return
  }
  mainSend(global.modules[info.info.modal], info.info.name, info)
})
