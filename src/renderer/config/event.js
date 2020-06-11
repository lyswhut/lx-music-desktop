import Vue from 'vue'
import keyBind from '../utils/keyBind'
import { rendererOn, NAMES } from '../../common/ipc'

const eventHub = window.eventHub = new Vue()

eventHub.$on('bindKey', () => {
  keyBind.bindKey((key, type, event, keys) => {
    // console.log(`key_${key}_${type}`)
    eventHub.$emit(`key_${key}_${type}`, { event, keys, key })
  })
})
eventHub.$on('unbindKey', keyBind.unbindKey)

rendererOn(NAMES.mainWindow.focus, () => {
  keyBind.clearDownKeys()
  eventHub.$emit('focus')
})
