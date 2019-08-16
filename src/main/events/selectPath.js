const { mainOn } = require('../../common/icp')
const { dialog } = require('electron')

module.exports = win => {
  mainOn('selectPath', (event, params) => {
    let path = dialog.showOpenDialog(win, params.options)
    if (path === undefined) return
    event.sender.send(params.eventName, path)
  })
}

