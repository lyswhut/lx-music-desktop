import { autoUpdater } from 'electron-updater'
import { log, isWin } from '@common/utils'
import { mainOn } from '@common/mainIpc'
import { isExistWindow, sendEvent } from './index'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'

autoUpdater.logger = log
autoUpdater.autoDownload = false
// autoUpdater.forceDevUpdateConfig = true
// autoUpdater.autoDownload = false

// let isFirstCheckedUpdate = true

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

function sendStatusToWindow(text: string) {
  log.info(text)
  // ipcMain.send('message', text)
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

interface WaitEvent {
  type: string
  info: any
}

// let waitEvent: WaitEvent[] = []
const handleSendEvent = (action: WaitEvent) => {
  if (isExistWindow()) {
    setTimeout(() => { // 延迟发送事件，过早发送可能渲染进程还没启动完成
      sendEvent(action.type, action.info)
    }, 1000)
  }
}

export default () => {
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...')
  })
  autoUpdater.on('update-available', info => {
    sendStatusToWindow('Update available.')
    handleSendEvent({ type: WIN_MAIN_RENDERER_EVENT_NAME.update_available, info })
  })
  autoUpdater.on('update-not-available', info => {
    sendStatusToWindow('Update not available.')
    handleSendEvent({ type: WIN_MAIN_RENDERER_EVENT_NAME.update_not_available, info })
  })
  autoUpdater.on('error', err => {
    sendStatusToWindow('Error in auto-updater.')
    handleSendEvent({ type: WIN_MAIN_RENDERER_EVENT_NAME.update_error, info: err.message })
  })
  autoUpdater.on('download-progress', progressObj => {
    let log_message = `Download speed: ${progressObj.bytesPerSecond}`
    log_message = `${log_message} - Downloaded ${progressObj.percent}%`
    log_message = `${log_message} (progressObj.transferred/${progressObj.total})`
    sendStatusToWindow(log_message)
    handleSendEvent({ type: WIN_MAIN_RENDERER_EVENT_NAME.update_progress, info: progressObj })
  })
  autoUpdater.on('update-downloaded', info => {
    sendStatusToWindow('Update downloaded.')
    handleSendEvent({ type: WIN_MAIN_RENDERER_EVENT_NAME.update_downloaded, info })
  })

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.update_check, () => {
    console.log('check')
    checkUpdate()
  })

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.update_download_update, () => {
    if (!autoUpdater.isUpdaterActive()) return
    void autoUpdater.downloadUpdate()
  })

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.quit_update, () => {
    global.lx.isSkipTrayQuit = true

    setTimeout(() => {
      autoUpdater.quitAndInstall(true, true)
    }, 1000)
  })
}

const checkUpdate = () => {
  // if (!isFirstCheckedUpdate) {
  //   if (waitEvent.length) {
  //     waitEvent.forEach((event, index) => {
  //       setTimeout(() => { // 延迟发送事件，过早发送可能渲染进程还没启动完成
  //         sendEvent(event.type, event.info)
  //       }, 2000 * (index + 1))
  //     })
  //     waitEvent = []
  //   }
  //   return
  // }
  // isFirstCheckedUpdate = false

  // 由于集合安装包中不包含win arm版，这将会导致arm版更新失败
  if (isWin && process.arch.includes('arm')) {
    handleSendEvent({ type: WIN_MAIN_RENDERER_EVENT_NAME.update_error, info: 'failed' })
  } else {
    autoUpdater.autoDownload = global.lx.appSetting['common.tryAutoUpdate']
    void autoUpdater.checkForUpdates()
  }
}
