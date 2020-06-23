const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')


mainOn(ipcMainWindowNames.progress, (event, params) => {
  // console.log(params)
  global.modules.mainWindow && global.modules.mainWindow.setProgressBar(params.status, {
    mode: params.mode || 'normal',
  })
})

