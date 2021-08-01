const { EventEmitter } = require('events')
const { common: COMMON_EVENT_NAME } = require('./_name')

class Common extends EventEmitter {
  initSetting() {
    this.emit(COMMON_EVENT_NAME.initConfig)
    this.configStatus(null)
  }

  configStatus(name) {
    this.emit(COMMON_EVENT_NAME.configStatus, name)
  }

  saveMyList(data) {
    this.emit(COMMON_EVENT_NAME.saveMyList, data)
  }
}

module.exports = Common

