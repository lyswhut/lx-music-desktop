const { EventEmitter } = require('events')
const TASKBAR_EVENT_NAME = require('./name')

class TaskBar extends EventEmitter {
  thumbarButtonClick(type) {
    this.emit(TASKBAR_EVENT_NAME.thumbarButtonClick, type)
  }
}

module.exports = TaskBar

