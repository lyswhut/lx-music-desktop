const { common: COMMON_EVENT_NAME, winLyric: WIN_LYRIC_EVENT_NAME, mainWindow: MAIN_WINDOW_EVENT_NAME } = require('../../events/_name')
const { mainSend, NAMES: { winLyric: ipcWinLyricNames } } = require('../../../common/ipc')

let isLock = null
let isEnable = null
let isAlwaysOnTop = null
const setLrcConfig = isForceSet => {
  let desktopLyric = global.appSetting.desktopLyric
  if (isEnable != desktopLyric.enable) {
    isEnable = desktopLyric.enable
    if (desktopLyric.enable) {
      global.lx_event.winLyric.create()
    } else {
      global.lx_event.winLyric.close()
    }
  }
  if (global.modals.lyricWindow) {
    mainSend(global.modals.lyricWindow, ipcWinLyricNames.set_lyric_config, desktopLyric)
    if (isForceSet || isLock != desktopLyric.isLock) {
      isLock = desktopLyric.isLock
      if (desktopLyric.isLock) {
        global.modals.lyricWindow.setIgnoreMouseEvents(true, { forward: false })
      } else {
        global.modals.lyricWindow.setIgnoreMouseEvents(false)
      }
    }
    if (isForceSet || isAlwaysOnTop != desktopLyric.isAlwaysOnTop) {
      isAlwaysOnTop = desktopLyric.isAlwaysOnTop
      global.modals.lyricWindow.setAlwaysOnTop(desktopLyric.isAlwaysOnTop, 'screen-saver')
    }
  }
}
global.lx_event.common.on(COMMON_EVENT_NAME.config, name => {
  if (WIN_LYRIC_EVENT_NAME.name === name) return
  setLrcConfig(false)
})
global.lx_event.winLyric.on(WIN_LYRIC_EVENT_NAME.inited, () => setLrcConfig(true))

global.lx_event.mainWindow.on(MAIN_WINDOW_EVENT_NAME.setLyricInfo, info => {
  if (!global.modals.lyricWindow) return
  mainSend(global.modals.lyricWindow, ipcWinLyricNames.set_lyric_info, info)
})
