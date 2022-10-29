import initRendererEvent, { handleKeyDown, hotKeyConfigUpdate } from './rendererEvent'

import { APP_EVENT_NAMES } from '@common/constants'
import { createWindow, minimize, toggleHide, toggleMinimize } from './main'
import initUpdate from './autoUpdate'
import { HOTKEY_COMMON } from '@common/hotKey'
import { quitApp } from '@main/app'

export default () => {
  initRendererEvent()
  initUpdate()

  global.lx.event_app.on('hot_key_down', ({ type, key }) => {
    let info = global.lx.hotKey.config.global.keys[key]
    if (info?.type != APP_EVENT_NAMES.winMainName) return
    switch (info.action) {
      case HOTKEY_COMMON.close.action:
        quitApp()
        break
      case HOTKEY_COMMON.hide_toggle.action:
        toggleHide()
        break
      case HOTKEY_COMMON.min.action:
        minimize()
        break
      case HOTKEY_COMMON.min_toggle.action:
        toggleMinimize()
        break
      default:
        handleKeyDown(type, key)
        break
    }
  })
  global.lx.event_app.on('hot_key_config_update', (config) => {
    hotKeyConfigUpdate(config)
  })

  global.lx.event_app.on('app_inited', () => {
    createWindow()
  })
}

export * from './main'
export * from './rendererEvent'

