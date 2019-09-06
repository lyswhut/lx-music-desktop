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
  // win.webContents.send('message', text)
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


module.exports = win => {
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...')
  })
  autoUpdater.on('update-available', info => {
    sendStatusToWindow('Update available.')
    win.webContents.send('update-available', info)
  })
  autoUpdater.on('update-not-available', info => {
    sendStatusToWindow('Update not available.')
    setTimeout(() => { // 延迟发送事件，过早发送可能渲染进程还启动完成
      win.webContents.send('update-not-available')
    }, 5000)
  })
  autoUpdater.on('error', () => {
    sendStatusToWindow('Error in auto-updater.')
    setTimeout(() => { // 延迟发送事件，过早发送可能渲染进程还启动完成
      win.webContents.send('update-error')
    }, 6000)
  })
  autoUpdater.on('download-progress', progressObj => {
    sendStatusToWindow('Download progress...')
  })
  autoUpdater.on('update-downloaded', info => {
    sendStatusToWindow('Update downloaded.')
    setTimeout(() => { // 延迟发送事件，过早发送可能渲染进程还启动完成
      win.webContents.send('update-downloaded')
    }, 2000)
  })
  mainOn('quit-update', () => {
    setTimeout(() => {
      autoUpdater.quitAndInstall(true, true)
    }, 1000)
  })

  autoUpdater.checkForUpdates()
}

