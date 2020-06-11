const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')


mainOn(ipcMainWindowNames.restart_window, (event, name) => {
  console.log(name)
  switch (name) {
    case 'main':
    default:

      break
  }
})

