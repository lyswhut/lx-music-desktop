import { APP_EVENT_NAMES } from '@common/constants'
import initRendererEvent, { sendMainWindowInitedEvent } from './rendererEvent'
import { setLrcConfig } from './config'
import { HOTKEY_DESKTOP_LYRIC } from '@common/hotKey'
import { closeWindow, createWindow, isExistWindow } from './main'
// import main from './main'
// import { Event, EVENT_NAMES } from './event'


export default () => {
  initRendererEvent()
  // global.lx.event_app.winLyric = new Event()
  // global.app_event.winMain.

  global.lx.event_app.on('main_window_inited', () => {
    if (global.lx.appSetting['desktopLyric.enable']) {
      if (isExistWindow()) sendMainWindowInitedEvent()
      else createWindow()
    }
  })
  global.lx.event_app.on('updated_config', (keys, setting) => {
    setLrcConfig(keys, setting)
  })
  global.lx.event_app.on('main_window_close', () => {
    closeWindow()
  })


  // global.lx_event.mainWindow.on(MAIN_WINDOW_EVENT_NAME.setLyricInfo, info => {
  //   if (!global.modules.lyricWindow) return
  //   mainSend(global.modules.lyricWindow, ipcWinLyricNames.set_lyric_info, info)
  // })

  global.lx.event_app.on('hot_key_down', ({ type, key }) => {
    let info = global.lx.hotKey.config.global.keys[key]
    if (!info || info.type != APP_EVENT_NAMES.winLyricName) return
    let newSetting: Partial<LX.AppSetting> = {}
    let settingKey: keyof LX.AppSetting
    switch (info.action) {
      case HOTKEY_DESKTOP_LYRIC.toggle_visible.action:
        settingKey = 'desktopLyric.enable'
        break
      case HOTKEY_DESKTOP_LYRIC.toggle_lock.action:
        settingKey = 'desktopLyric.isLock'
        break
      case HOTKEY_DESKTOP_LYRIC.toggle_always_top.action:
        settingKey = 'desktopLyric.isAlwaysOnTop'
        break
      default: return
    }
    newSetting[settingKey] = !global.lx.appSetting[settingKey]

    global.lx.event_app.update_config(newSetting)
  })
}
export * from './main'
export * from './rendererEvent'

// export {
//   EVENT_NAMES,
// }
