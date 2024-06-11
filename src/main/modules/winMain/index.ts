import initRendererEvent, { handleKeyDown, hotKeyConfigUpdate } from './rendererEvent'

import { APP_EVENT_NAMES } from '@common/constants'
import { createWindow, minimize, setProgressBar, setProxy, setThumbarButtons, toggleHide, toggleMinimize } from './main'
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

  const keys = (['status', 'collect'] as const) satisfies Array<keyof LX.Player.Status>
  const taskBarButtonFlags: LX.TaskBarButtonFlags = {
    empty: true,
    collect: false,
    play: false,
    next: true,
    prev: true,
  }
  const progressStatus = {
    progress: -1,
    status: 'none' as Electron.ProgressBarOptions['mode'],
  }
  let showProgress = global.lx.appSetting['player.isShowTaskProgess']
  global.lx.event_app.on('player_status', (status) => {
    if (status.status) {
      switch (status.status) {
        case 'paused':
          taskBarButtonFlags.play = false
          taskBarButtonFlags.empty &&= false
          progressStatus.status = 'paused'
          break
        case 'error':
          taskBarButtonFlags.play = false
          taskBarButtonFlags.empty &&= false
          progressStatus.status = 'error'
          break
        case 'playing':
          taskBarButtonFlags.play = true
          taskBarButtonFlags.empty &&= false
          progressStatus.status = 'normal'
          break
        case 'stoped':
          taskBarButtonFlags.play &&= false
          taskBarButtonFlags.empty = true
          progressStatus.status = 'none'
          progressStatus.progress = 0
          break
      }
      if (showProgress) {
        setProgressBar(progressStatus.progress, {
          mode: progressStatus.status,
        })
      }
    }
    if (keys.some(k => status[k] != null)) {
      if (status.collect != null) taskBarButtonFlags.collect = status.collect
      setThumbarButtons(taskBarButtonFlags)
    }
    if (showProgress && status.progress != null) {
      const progress = global.lx.player_status.duration ? status.progress / global.lx.player_status.duration : 0
      if (progress.toFixed(2) != progressStatus.progress.toFixed(2)) {
        progressStatus.progress = progress < 0.01 ? 0.01 : progress
        setProgressBar(progressStatus.progress, {
          mode: progressStatus.status,
        })
      }
    }
  })
  global.lx.event_app.on('updated_config', (keys, setting) => {
    if (keys.includes('player.isShowTaskProgess')) {
      showProgress = setting['player.isShowTaskProgess']!
      if (showProgress) {
        setProgressBar(progressStatus.progress, {
          mode: progressStatus.status,
        })
      } else {
        setProgressBar(-1, { mode: 'none' })
      }
    }
    if (keys.includes('network.proxy.enable') || (global.lx.appSetting['network.proxy.enable'] && keys.some(k => k.includes('network.proxy.')))) {
      setProxy()
    }
  })
}

export * from './main'
export * from './rendererEvent'

