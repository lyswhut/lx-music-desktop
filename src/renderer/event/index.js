import Vue from 'vue'
import keyBind from '../utils/keyBind'
import { rendererOn, rendererSend, NAMES, rendererInvoke } from '../../common/ipc'
import { base as baseName } from './names'
import { common as hotKeyNamesCommon } from '../../common/hotKey'

const eventHub = window.eventHub = new Vue()

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

eventHub.$on(baseName.bindKey, () => {
  keyBind.bindKey((key, type, event, keys) => {
    // console.log(`key_${key}_${type}`)
    eventHub.$emit(baseName.key_down, { event, keys, key, type })
    // console.log(event, key)
    if (!window.isEditingHotKey && appHotKeyConfig.local.enable && appHotKeyConfig.local.keys[key]) {
      if (type == 'up') return
      eventHub.$emit(appHotKeyConfig.local.keys[key].action)
      return
    }
    eventHub.$emit(`key_${key}_${type}`, { event, keys, key, type })
  })
  registerCommonEvents()
})
eventHub.$on(baseName.unbindKey, () => {
  keyBind.unbindKey()
  unregisterCommonEvents()
})
const registerQuit = () => rendererSend(NAMES.mainWindow.quit)
const registerMin = () => rendererSend(NAMES.mainWindow.min)
const registerMinToggle = () => rendererSend(NAMES.mainWindow.min_toggle)
const registerHideToggle = () => rendererSend(NAMES.mainWindow.hide_toggle)

eventHub.$on(baseName.min, registerMin)
eventHub.$on(baseName.max, () => rendererSend(NAMES.mainWindow.max))
eventHub.$on(baseName.close, () => rendererSend(NAMES.mainWindow.close))

const registerCommonEvents = () => {
  eventHub.$on(hotKeyNamesCommon.close.action, registerQuit)
  eventHub.$on(hotKeyNamesCommon.min.action, registerMin)
  eventHub.$on(hotKeyNamesCommon.min_toggle.action, registerMinToggle)
  eventHub.$on(hotKeyNamesCommon.hide_toggle.action, registerHideToggle)
}
const unregisterCommonEvents = () => {
  eventHub.$off(hotKeyNamesCommon.close.action, registerQuit)
  eventHub.$off(hotKeyNamesCommon.min.action, registerMin)
  eventHub.$off(hotKeyNamesCommon.min_toggle.action, registerMinToggle)
  eventHub.$off(hotKeyNamesCommon.hide_toggle.action, registerHideToggle)
}

rendererOn(NAMES.mainWindow.focus, () => {
  keyBind.clearDownKeys()
  eventHub.$emit(baseName.focus)
})
rendererOn(NAMES.mainWindow.key_down, (event, { type, key }) => {
  // console.log(appHotKeyConfig.global.keys[key])
  if (appHotKeyConfig.global.keys[key]) {
    window.eventHub.$emit(appHotKeyConfig.global.keys[key].action)
  }
})
rendererOn(NAMES.mainWindow.set_hot_key_config, (event, config) => {
  // console.log(config)
  // this.setDesktopLyricConfig(config)
  // console.log('set_config', JSON.stringify(this.setting) === JSON.stringify(config))
  for (const type of Object.keys(config)) {
    window.appHotKeyConfig[type] = config[type]
  }
  window.eventHub.$emit(baseName.set_hot_key_config, config)
})
