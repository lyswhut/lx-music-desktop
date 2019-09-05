const { mainOn } = require('../../common/icp')

module.exports = win => {
  mainOn('min', event => {
    if (win) {
      win.minimize()
    }
  })
  // mainOn('max', event => {
  //   if (win) {
  //     win.maximize()
  //   }
  // })
  mainOn('close', event => {
    if (win) {
      // window.destroy()
      win.close()
    }
  })
}
