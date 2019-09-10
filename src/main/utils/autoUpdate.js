const { log } = require('../../common/utils')
const { autoUpdater } = require('electron-updater')
const { mainOn } = require('../../common/icp')

autoUpdater.logger = log
// autoUpdater.autoDownload = false
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')


// -------------------------------------------------------------------
// Open a window that displays the version
//
// THIS SECTION IS NOT REQUIRED
//
// This isn't required for auto-updates to work, but it's easier
// for the app to show a window than to have to click "About" to see
// that updates are working.
// -------------------------------------------------------------------
// let win

function sendStatusToWindow(text) {
  log.info(text)
  // global.mainWindow.webContents.send('message', text)
}


// -------------------------------------------------------------------
// Auto updates
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
// -------------------------------------------------------------------
// autoUpdater.on('checking-for-update', () => {
// })
// autoUpdater.on('update-available', (ev, info) => {
// })
// autoUpdater.on('update-not-available', (ev, info) => {
// })
// autoUpdater.on('error', (ev, err) => {
// })
// autoUpdater.on('download-progress', (ev, progressObj) => {
// })
// autoUpdater.on('update-downloaded', (ev, info) => {
//   // Wait 5 seconds, then quit and install
//   // In your application, you don't need to wait 5 seconds.
//   // You could call autoUpdater.quitAndInstall(); immediately
//   // setTimeout(function() {
//   // autoUpdater.quitAndInstall()
//   // }, 5000)

// })

let waitEvent = []
const handleSendEvent = action => {
  if (global.mainWindow) {
    setTimeout(() => { // 延迟发送事件，过早发送可能渲染进程还没启动完成
      global.mainWindow.webContents.send(action.type, action.info)
    }, 2000)
  } else {
    waitEvent.push(action)
  }
}

module.exports = isFirstCheckedUpdate => {
  if (!isFirstCheckedUpdate) {
    waitEvent.forEach((event, index) => {
      setTimeout(() => { // 延迟发送事件，过早发送可能渲染进程还没启动完成
        global.mainWindow.webContents.send(event.type, event.info)
      }, 2000 * (index + 1))
    })
    return
  }
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...')
  })
  autoUpdater.on('update-available', info => {
    sendStatusToWindow('Update available.')
    handleSendEvent({ type: 'update-available', info })
  })
  autoUpdater.on('update-not-available', info => {
    sendStatusToWindow('Update not available.')
    handleSendEvent({ type: 'update-not-available' })
  })
  autoUpdater.on('error', () => {
    sendStatusToWindow('Error in auto-updater.')
    handleSendEvent({ type: 'update-error' })
  })
  autoUpdater.on('download-progress', progressObj => {
    sendStatusToWindow('Download progress...')
  })
  autoUpdater.on('update-downloaded', info => {
    sendStatusToWindow('Update downloaded.')
    handleSendEvent({ type: 'update-downloaded' })
  })
  mainOn('quit-update', () => {
    setTimeout(() => {
      autoUpdater.quitAndInstall(true, true)
    }, 1000)
  })

  autoUpdater.checkForUpdates()
}

