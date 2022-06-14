const { common: COMMON_EVENT_NAME, winLyric: WIN_LYRIC_EVENT_NAME, hotKey: HOT_KEY_EVENT_NAME, mainWindow: MAIN_WINDOW_EVENT_NAME } = require('../../events/_name')
const { mainSend, NAMES: { winLyric: ipcWinLyricNames } } = require('../../../common/ipc')
const { desktop_lyric } = require('../../../common/hotKey')
const { getLyricWindowBounds } = require('./utils')

let isLock = null
let isEnable = null
let isAlwaysOnTop = null
let isAlwaysOnTopLoop = null
let isLockScreen = null

const alwaysOnTopTools = {
  timeout: null,
  alwaysOnTop: false,
  setAlwaysOnTop(flag, isLoop) {
    this.alwaysOnTop = flag
    this.clearLoop()
    global.modules.lyricWindow.setAlwaysOnTop(flag, 'screen-saver')
    console.log(isLoop)
    if (flag && isLoop) this.startLoop()
  },
  startLoop() {
    if (!this.alwaysOnTop) return
    this.timeout = setInterval(() => {
      if (!global.modules.lyricWindow) return this.clearLoop()
      global.modules.lyricWindow.setAlwaysOnTop(true, 'screen-saver')
    }, 1000)
  },
  clearLoop() {
    if (!this.timeout) return
    clearInterval(this.timeout)
    this.timeout = null
  },
}


const setLrcConfig = () => {
  let desktopLyric = global.appSetting.desktopLyric
  if (global.modules.lyricWindow) {
    mainSend(global.modules.lyricWindow, ipcWinLyricNames.set_lyric_config, {
      config: desktopLyric,
      languageId: global.appSetting.langId,
      isShowLyricTranslation: global.appSetting.player.isShowLyricTranslation,
      isShowLyricRoma: global.appSetting.player.isShowLyricRoma,
      isPlayLxlrc: global.appSetting.player.isPlayLxlrc,
    })
    if (isLock != desktopLyric.isLock) {
      isLock = desktopLyric.isLock
      if (desktopLyric.isLock) {
        global.modules.lyricWindow.setIgnoreMouseEvents(true, { forward: true })
      } else {
        global.modules.lyricWindow.setIgnoreMouseEvents(false, { forward: true })
      }
    }
    if (isAlwaysOnTop != desktopLyric.isAlwaysOnTop) {
      isAlwaysOnTop = desktopLyric.isAlwaysOnTop
      alwaysOnTopTools.setAlwaysOnTop(desktopLyric.isAlwaysOnTop, desktopLyric.isAlwaysOnTopLoop)
    }
    if (isAlwaysOnTopLoop != desktopLyric.isAlwaysOnTopLoop) {
      isAlwaysOnTopLoop = desktopLyric.isAlwaysOnTopLoop
      if (isAlwaysOnTopLoop) {
        alwaysOnTopTools.startLoop()
      } else {
        alwaysOnTopTools.clearLoop()
      }
    }
    if (isLockScreen != desktopLyric.isLockScreen) {
      isLockScreen = desktopLyric.isLockScreen
      if (desktopLyric.isLockScreen) {
        global.modules.lyricWindow.setBounds(getLyricWindowBounds(global.modules.lyricWindow.getBounds(), {
          x: null,
          y: null,
          w: desktopLyric.width,
          h: desktopLyric.height,
        }))
      }
    }
  }
  if (isEnable != desktopLyric.enable) {
    isEnable = desktopLyric.enable
    if (desktopLyric.enable) {
      global.lx_event.winLyric.create()
    } else {
      alwaysOnTopTools.clearLoop()
      global.lx_event.winLyric.close()
    }
  }
}
global.lx_event.common.on(COMMON_EVENT_NAME.configStatus, name => {
  if (WIN_LYRIC_EVENT_NAME.name === name) return
  setLrcConfig()
})

global.lx_event.mainWindow.on(MAIN_WINDOW_EVENT_NAME.setLyricInfo, info => {
  if (!global.modules.lyricWindow) return
  mainSend(global.modules.lyricWindow, ipcWinLyricNames.set_lyric_info, info)
})

global.lx_event.hotKey.on(HOT_KEY_EVENT_NAME.keyDown, ({ type, key }) => {
  let info = global.appHotKey.config.global.keys[key]
  if (!info || info.type != WIN_LYRIC_EVENT_NAME.name) return
  let desktopLyricSetting = JSON.parse(JSON.stringify(global.appSetting.desktopLyric))
  let settingKey
  switch (info.action) {
    case desktop_lyric.toggle_visible.action:
      settingKey = 'enable'
      break
    case desktop_lyric.toggle_lock.action:
      settingKey = 'isLock'
      break
    case desktop_lyric.toggle_always_top.action:
      settingKey = 'isAlwaysOnTop'
      break
  }
  desktopLyricSetting[settingKey] = !desktopLyricSetting[settingKey]

  global.lx_core.setAppConfig({ desktopLyric: desktopLyricSetting }, null)
})
