const { mainOn } = require('../../common/ipc')


mainOn('progress', (event, params) => {
  // console.log(params)
  global.mainWindow && global.mainWindow.setProgressBar(params.status, {
    mode: params.mode || 'normal',
  })
})

