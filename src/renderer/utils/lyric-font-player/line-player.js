const { getNow, TimeoutTools } = require('./utils')

const timeExp = /^\[([\d:.]*)\]{1}/g
const tagRegMap = {
  title: 'ti',
  artist: 'ar',
  album: 'al',
  offset: 'offset',
  by: 'by',
}

const timeoutTools = new TimeoutTools()

module.exports = class LinePlayer {
  constructor({ lyric = '', translationLyric = '', offset = 0, onPlay = function() { }, onSetLyric = function() { } } = {}) {
    this.lyric = lyric
    this.translationLyric = translationLyric
    this.tags = {}
    this.lines = null
    this.translationLines = null
    this.onPlay = onPlay
    this.onSetLyric = onSetLyric
    this.isPlay = false
    this.curLineNum = 0
    this.maxLine = 0
    this.offset = offset
    this._performanceTime = 0
    this._startTime = 0
    this._init()
  }

  _init() {
    if (this.lyric == null) this.lyric = ''
    if (this.translationLyric == null) this.translationLyric = ''
    this._initTag()
    this._initLines()
    this.onSetLyric(this.lines)
  }

  _initTag() {
    this.tags = {}
    for (let tag in tagRegMap) {
      const matches = this.lyric.match(new RegExp(`\\[${tagRegMap[tag]}:([^\\]]*)]`, 'i'))
      this.tags[tag] = (matches && matches[1]) || ''
    }
    if (this.tags.offset) {
      let offset = parseInt(this.tags.offset)
      this.tags.offset = Number.isNaN(offset) ? 0 : offset
    } else {
      this.tags.offset = 0
    }
  }

  _initLines() {
    this.lines = []
    this.translationLines = []
    const lines = this.lyric.split(/\r\n|\r|\n/)
    const linesMap = {}
    // const translationLines = this.translationLyric.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      let result = timeExp.exec(line)
      if (result) {
        const text = line.replace(timeExp, '').trim()
        if (text) {
          const timeStr = RegExp.$1
          const timeArr = timeStr.split(':')
          if (timeArr.length < 3) timeArr.unshift(0)
          if (timeArr[2].indexOf('.') > -1) {
            timeArr.push(...timeArr[2].split('.'))
            timeArr.splice(2, 1)
          }
          linesMap[timeStr] = {
            time: parseInt(timeArr[0]) * 60 * 60 * 1000 + parseInt(timeArr[1]) * 60 * 1000 + parseInt(timeArr[2]) * 1000 + parseInt(timeArr[3] || 0),
            text,
          }
        }
      }
    }

    const translationLines = this.translationLyric.split('\n')
    for (let i = 0; i < translationLines.length; i++) {
      const line = translationLines[i].trim()
      let result = timeExp.exec(line)
      if (result) {
        const text = line.replace(timeExp, '').trim()
        if (text) {
          const timeStr = RegExp.$1
          const targetLine = linesMap[timeStr]
          if (targetLine) targetLine.translation = text
        }
      }
    }
    this.lines = Object.values(linesMap)
    this.lines.sort((a, b) => {
      return a.time - b.time
    })
    this.maxLine = this.lines.length - 1
  }

  _currentTime() {
    return getNow() - this._performanceTime + this._startTime
  }

  _findCurLineNum(curTime, startIndex = 0) {
    if (curTime <= 0) return 0
    const length = this.lines.length
    for (let index = startIndex; index < length; index++) if (curTime <= this.lines[index].time) return index === 0 ? 0 : index - 1
    return length - 1
  }

  _handleMaxLine() {
    this.onPlay(this.curLineNum, this.lines[this.curLineNum].text, this._currentTime())
    this.pause()
  }

  _refresh() {
    this.curLineNum++
    // console.log('curLineNum time', this.lines[this.curLineNum].time)
    if (this.curLineNum >= this.maxLine) return this._handleMaxLine()

    let curLine = this.lines[this.curLineNum]

    const currentTime = this._currentTime()
    const driftTime = currentTime - curLine.time

    if (driftTime >= 0 || this.curLineNum === 0) {
      let nextLine = this.lines[this.curLineNum + 1]
      this.delay = nextLine.time - curLine.time - driftTime

      if (this.delay > 0) {
        if (this.isPlay) {
          timeoutTools.start(() => {
            if (!this.isPlay) return
            this._refresh()
          }, this.delay)
        }
        this.onPlay(this.curLineNum, curLine.text, currentTime)
        return
      } else {
        let newCurLineNum = this._findCurLineNum(currentTime, this.curLineNum + 1)
        if (newCurLineNum > this.curLineNum) this.curLineNum = newCurLineNum - 1
        this._refresh()
        return
      }
    }

    this.curLineNum = this._findCurLineNum(currentTime, this.curLineNum) - 1
    this._refresh()
  }

  play(curTime = 0) {
    if (!this.lines.length) return
    this.pause()
    this.isPlay = true

    this._performanceTime = getNow() - parseInt(this.tags.offset + this.offset)
    this._startTime = curTime

    this.curLineNum = this._findCurLineNum(this._currentTime()) - 1

    this._refresh()
  }

  pause() {
    if (!this.isPlay) return
    this.isPlay = false
    timeoutTools.clear()
    if (this.curLineNum === this.maxLine) return
    const currentTime = this._currentTime()
    const curLineNum = this._findCurLineNum(currentTime)
    if (this.curLineNum !== curLineNum) {
      this.curLineNum = curLineNum
      this.onPlay(curLineNum, this.lines[curLineNum].text, currentTime)
    }
  }

  setLyric(lyric, translationLyric) {
    // console.log(translationLyric)
    if (this.isPlay) this.pause()
    this.lyric = lyric
    this.translationLyric = translationLyric
    this._init()
  }
}
