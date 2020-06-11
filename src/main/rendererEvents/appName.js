const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { app } = require('electron')
const { name: defaultName } = require('../../../package.json')


mainOn(ipcMainWindowNames.set_app_name, (event, params) => {
  if (params == null) {
    app.setName(defaultName)
  } else {
    app.setName(params.name)
  }
})

