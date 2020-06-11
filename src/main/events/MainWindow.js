const { EventEmitter } = require('events')
const { mainWindow: MAIN_WINDOW_EVENT_NAME } = require('./_name')

class MainWindow extends EventEmitter {
  setLyricInfo(info) {
    this.emit(MAIN_WINDOW_EVENT_NAME.setLyricInfo, info)
  }
}

module.exports = MainWindow
