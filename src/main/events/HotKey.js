const { EventEmitter } = require('events')
const { hotKey: HOT_KEY_EVENT_NAME } = require('./_name')
const { saveAppHotKeyConfig } = require('../utils')

class HotKey extends EventEmitter {
  init() {
    this.emit(HOT_KEY_EVENT_NAME.init)
  }

  saveConfig(config, source) {
    if (config) saveAppHotKeyConfig(config)
    this.emit(HOT_KEY_EVENT_NAME.config, config, source)
  }

  keyDown(info) {
    this.emit(HOT_KEY_EVENT_NAME.keyDown, info)
  }
}

module.exports = HotKey

