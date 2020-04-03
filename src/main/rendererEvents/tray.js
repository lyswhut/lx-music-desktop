// const { app } = require('electron')
const { mainOn } = require('../../common/ipc')

mainOn('changeTray', (event, params) => {
  switch (params.action) {
    case 'create':
      global.lx_event.tray.create()
      break
    case 'destroy':
      global.lx_event.tray.destroy()
      break

    default:
      break
  }
})

