const { mainOn } = require('../../common/ipc')

mainOn('setWindowSize', (event, options) => {
  if (!global.mainWindow) return
  global.mainWindow.setBounds(options)
})

