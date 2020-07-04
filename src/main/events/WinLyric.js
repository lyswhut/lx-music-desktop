const { EventEmitter } = require('events')
const { winLyric: WIN_LYRIC_EVENT_NAME } = require('./_name')
// const { updateSetting } = require('../utils')

class WinLyric extends EventEmitter {
  create() {
    this.emit(WIN_LYRIC_EVENT_NAME.create)
  }

  close() {
    this.emit(WIN_LYRIC_EVENT_NAME.close)
  }
}

module.exports = WinLyric
