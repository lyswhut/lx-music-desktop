const { EventEmitter } = require('events')
const { tray: TRAY_EVENT_NAME } = require('./_name')

class Tray extends EventEmitter {
  create() {
    this.emit(TRAY_EVENT_NAME.create)
  }

  destroy() {
    this.emit(TRAY_EVENT_NAME.destroy)
  }
}

module.exports = Tray
