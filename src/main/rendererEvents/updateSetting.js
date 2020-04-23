const { mainOn } = require('../../common/ipc')


mainOn('updateAppSetting', (event, setting) => {
  if (!setting) return
  global.appSetting = setting
})
