const { EventEmitter } = require('events')
const { mainWindow: MAIN_WINDOW_EVENT_NAME } = require('./_name')

class MainWindow extends EventEmitter {
  setLyricInfo(info) {
    this.emit(MAIN_WINDOW_EVENT_NAME.setLyricInfo, info)
  }

  quit() {
    this.emit(MAIN_WINDOW_EVENT_NAME.quit)
  }

  toggleMinimize() {
    this.emit(MAIN_WINDOW_EVENT_NAME.toggle_minimize)
  }

  toggleHide() {
    this.emit(MAIN_WINDOW_EVENT_NAME.toggle_hide)
  }

  readyToShow() {
    this.emit(MAIN_WINDOW_EVENT_NAME.ready_to_show)
  }

  show() {
    this.emit(MAIN_WINDOW_EVENT_NAME.show)
  }

  focus() {
    this.emit(MAIN_WINDOW_EVENT_NAME.focus)
  }

  blur() {
    this.emit(MAIN_WINDOW_EVENT_NAME.blur)
  }

  hide() {
    this.emit(MAIN_WINDOW_EVENT_NAME.hide)
  }
}

module.exports = MainWindow
