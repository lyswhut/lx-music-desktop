const { EventEmitter } = require('events')
const { common: COMMON_EVENT_NAME } = require('./_name')
const { updateSetting } = require('../utils')

class Common extends EventEmitter {
  initSetting() {
    this.emit(COMMON_EVENT_NAME.initConfig)
    this.emit(COMMON_EVENT_NAME.config, null)
  }

  setAppConfig(config, name) {
    if (config) updateSetting(config)
    this.emit(COMMON_EVENT_NAME.config, name)
  }
}

module.exports = Common

