import Vue from 'vue'
import bindkey from './bindkey'
import { rendererOn } from '../../common/ipc'

window.eventHub = new Vue()

bindkey()

rendererOn('focus', () => {
  window.eventHub.$emit('focus')
})
