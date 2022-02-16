const { EventEmitter } = require('events')
const USER_API_EVENT_NAME = require('./name')

class UserApi extends EventEmitter {
  status(info) {
    this.emit(USER_API_EVENT_NAME.status, info)
  }

  showUpdateAlert(info) {
    this.emit(USER_API_EVENT_NAME.showUpdateAlert, info)
  }
}

module.exports = UserApi

