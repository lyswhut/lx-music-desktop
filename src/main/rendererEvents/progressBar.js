const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')


mainOn(ipcMainWindowNames.progress, (event, params) => {
  // console.log(params)
  global.modals.mainWindow && global.modals.mainWindow.setProgressBar(params.status, {
    mode: params.mode || 'normal',
  })
})

