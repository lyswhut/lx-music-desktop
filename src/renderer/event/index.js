import Vue from 'vue'
import keyBind from '../utils/keyBind'
import { rendererOn, rendererSend, NAMES } from '../../common/ipc'
import { base as baseName } from './names'

const eventHub = window.eventHub = new Vue()

eventHub.$on(baseName.bindKey, () => {
  keyBind.bindKey((key, type, event, keys) => {
    // console.log(`key_${key}_${type}`)
    eventHub.$emit(`key_${key}_${type}`, { event, keys, key })
  })
})
eventHub.$on(baseName.unbindKey, keyBind.unbindKey)

eventHub.$on(baseName.min, () => rendererSend(NAMES.mainWindow.min))
eventHub.$on(baseName.max, () => rendererSend(NAMES.mainWindow.max))
eventHub.$on(baseName.close, () => rendererSend(NAMES.mainWindow.close))

rendererOn(NAMES.mainWindow.focus, () => {
  keyBind.clearDownKeys()
  eventHub.$emit(baseName.focus)
})
