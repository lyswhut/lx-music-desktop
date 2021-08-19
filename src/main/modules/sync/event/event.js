const { EventEmitter } = require('events')
const SYNC_EVENT_NAME = require('./name')

class Sync extends EventEmitter {
  status(status) {
    this.emit(SYNC_EVENT_NAME.status, status)
  }

  sync_list(data) {
    this.emit(SYNC_EVENT_NAME.sync_list, data)
  }

  sync_handle_list(data) {
    this.emit(SYNC_EVENT_NAME.sync_handle_list, data)
  }

  action_list(data) {
    this.emit(SYNC_EVENT_NAME.sync_action_list, data)
  }
}

module.exports = Sync

