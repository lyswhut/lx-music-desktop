const { mainOn } = require('../../common/ipc')
const { app } = require('electron')
const { name: defaultName } = require('../../../package.json')


mainOn('appName', (event, params) => {
  if (params == null) {
    app.setName(defaultName)
  } else {
    app.setName(params.name)
  }
})

