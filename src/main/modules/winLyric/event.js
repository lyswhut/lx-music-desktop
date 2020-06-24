const { common: COMMON_EVENT_NAME, winLyric: WIN_LYRIC_EVENT_NAME, hotKey: HOT_KEY_EVENT_NAME, mainWindow: MAIN_WINDOW_EVENT_NAME } = require('../../events/_name')
const { mainSend, NAMES: { winLyric: ipcWinLyricNames } } = require('../../../common/ipc')
const { desktop_lyric } = require('../../../common/hotKey')

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
  if (global.modules.lyricWindow) {
    mainSend(global.modules.lyricWindow, ipcWinLyricNames.set_lyric_config, {
      config: desktopLyric,
      languageId: global.appSetting.langId,
    })
    if (isForceSet || isLock != desktopLyric.isLock) {
      isLock = desktopLyric.isLock
      if (desktopLyric.isLock) {
        global.modules.lyricWindow.setIgnoreMouseEvents(true, { forward: false })
      } else {
        global.modules.lyricWindow.setIgnoreMouseEvents(false)
      }
    }
    if (isForceSet || isAlwaysOnTop != desktopLyric.isAlwaysOnTop) {
      isAlwaysOnTop = desktopLyric.isAlwaysOnTop
      global.modules.lyricWindow.setAlwaysOnTop(desktopLyric.isAlwaysOnTop, 'screen-saver')
    }
  }
}
global.lx_event.common.on(COMMON_EVENT_NAME.config, name => {
  if (WIN_LYRIC_EVENT_NAME.name === name) return
  setLrcConfig(false)
})
global.lx_event.winLyric.on(WIN_LYRIC_EVENT_NAME.inited, () => setLrcConfig(true))

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

  global.lx_event.common.setAppConfig({ desktopLyric: desktopLyricSetting }, null)
})
