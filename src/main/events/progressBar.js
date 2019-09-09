const { mainOn } = require('../../common/icp')


mainOn('progress', (event, params) => {
  // console.log(params)
  global.mainWindow && global.mainWindow.setProgressBar(params.status, {
    mode: params.mode || 'normal',
  })
})

