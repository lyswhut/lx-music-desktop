const { mainOn } = require('../../common/icp')

module.exports = win => {
  mainOn('progress', (event, params) => {
    // console.log(params)
    win.setProgressBar(params.status, {
      mode: params.mode || 'normal',
    })
  })
}

