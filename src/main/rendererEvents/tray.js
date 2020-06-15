// const { app } = require('electron')
const { mainOn } = require('../../common/ipc')

mainOn('changeTray', (event, setting) => {
  global.appSetting.tray = setting
  if (setting.isToTray) {
    global.lx_event.tray.create()
  } else {
    global.lx_event.tray.destroy()
  }
})

