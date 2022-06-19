import mitt from 'mitt'
import keyBind from '../utils/keyBind'
import { rendererOn, rendererSend, NAMES, rendererInvoke } from '../../common/ipc'
import { base as baseName, sync as syncName } from './names'
import { common as hotKeyNamesCommon } from '../../common/hotKey'
import { sync } from '@renderer/core/share'

const eventHub = window.eventHub = mitt()

window.isEditingHotKey = false
let appHotKeyConfig = {
  local: {},
  global: {},
}
rendererInvoke(NAMES.mainWindow.get_hot_key).then(({ local, global }) => {
  appHotKeyConfig = window.appHotKeyConfig = {
    local,
    global,
  }
})

eventHub.on(baseName.bindKey, () => {
  keyBind.bindKey((key, eventKey, type, event, keys, isEditing) => {
    // console.log(`key_${key}_${type}`)
    eventHub.emit(baseName.key_down, { event, keys, key, type })
    // console.log(event, key)
    // console.log(key, eventKey, type, event, keys)
    if (window.isEditingHotKey || (isEditing && type == 'down') || event?.lx_handled) return
    if (event && appHotKeyConfig.local.enable && appHotKeyConfig.local.keys[key] && (key != 'escape' || !event.target.classList.contains('ignore-esc'))) {
      // console.log(key, eventKey, type, keys, isEditing)
      event.preventDefault()
      if (type == 'up') return

      // 软件内快捷键的最小化触发时
      // 如果已启用托盘，则隐藏程序，否则最小化程序 https://github.com/lyswhut/lx-music-desktop/issues/603
      if (appHotKeyConfig.local.keys[key].action == hotKeyNamesCommon.min.action && global.appSetting.tray.isShow) {
        eventHub.emit(hotKeyNamesCommon.hide_toggle.action)
        return
      }

      eventHub.emit(appHotKeyConfig.local.keys[key].action)
      return
    }
    // console.log(`key_${key}_${type}`)
    eventHub.emit(`key_${key}_${type}`, { event, keys, key, eventKey, type })
    if (key != eventKey) eventHub.emit(`key_${eventKey}_${type}`, { event, keys, key, eventKey, type })
  })
  registerCommonEvents()
})
eventHub.on(baseName.unbindKey, () => {
  keyBind.unbindKey()
  unregisterCommonEvents()
})
const registerQuit = () => rendererSend(NAMES.mainWindow.quit)
const registerMin = () => rendererSend(NAMES.mainWindow.min)
const registerMinToggle = () => rendererSend(NAMES.mainWindow.min_toggle)
const registerHideToggle = () => rendererSend(NAMES.mainWindow.hide_toggle)

const setClearDownKeys = () => keyBind.clearDownKeys()

eventHub.on(baseName.min, registerMin)
eventHub.on(baseName.max, () => rendererSend(NAMES.mainWindow.max))
eventHub.on(baseName.close, () => rendererSend(NAMES.mainWindow.close))

eventHub.on(baseName.setClearDownKeys, setClearDownKeys)

const registerCommonEvents = () => {
  eventHub.on(hotKeyNamesCommon.close.action, registerQuit)
  eventHub.on(hotKeyNamesCommon.min.action, registerMin)
  eventHub.on(hotKeyNamesCommon.min_toggle.action, registerMinToggle)
  eventHub.on(hotKeyNamesCommon.hide_toggle.action, registerHideToggle)
}
const unregisterCommonEvents = () => {
  eventHub.off(hotKeyNamesCommon.close.action, registerQuit)
  eventHub.off(hotKeyNamesCommon.min.action, registerMin)
  eventHub.off(hotKeyNamesCommon.min_toggle.action, registerMinToggle)
  eventHub.off(hotKeyNamesCommon.hide_toggle.action, registerHideToggle)
}

rendererOn(NAMES.mainWindow.focus, () => {
  keyBind.clearDownKeys()
  eventHub.emit(baseName.focus)
})
rendererOn(NAMES.mainWindow.key_down, (event, { type, key }) => {
  // console.log(appHotKeyConfig.global.keys[key])
  if (appHotKeyConfig.global.keys[key]) {
    window.eventHub.emit(appHotKeyConfig.global.keys[key].action)
  }
})
rendererOn(NAMES.mainWindow.set_hot_key_config, (event, config) => {
  // console.log(config)
  // this.setDesktopLyricConfig(config)
  // console.log('set_config', JSON.stringify(this.setting) === JSON.stringify(config))
  for (const type of Object.keys(config)) {
    window.appHotKeyConfig[type] = config[type]
  }
  window.eventHub.emit(baseName.set_hot_key_config, config)
})

rendererOn(NAMES.mainWindow.sync_action_list, (event, { action, data }) => {
  window.eventHub.emit(syncName.handle_action_list, { action, data })
})
eventHub.on(syncName.send_action_list, ({ action, data }) => {
  if (!sync.enable) return
  rendererSend(NAMES.mainWindow.sync_action_list, { action, data })
})
rendererOn(NAMES.mainWindow.sync_list, (event, { action, data }) => {
  window.eventHub.emit(syncName.handle_sync_list, { action, data })
})
eventHub.on(syncName.send_sync_list, ({ action, data }) => {
  if (!sync.enable) return
  rendererSend(NAMES.mainWindow.sync_list, { action, data })
})
