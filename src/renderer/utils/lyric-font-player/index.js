const LinePlayer = require('./line-player')
const FontPlayer = require('./font-player')

const fontTimeExp = /<(\d+),(\d+)>/g

module.exports = class Lyric {
  constructor({
    lyric = '',
    extendedLyrics = [],
    offset = 0,
    lineClassName = '',
    fontClassName = 'font',
    extendedLrcClassName = 'extended',
    activeLineClassName = 'active',
    lineModeClassName = 'line',
    shadowClassName = '',
    shadowContent = false,
    onPlay = function() { },
    onSetLyric = function() { },
  }) {
    this.lyric = lyric
    this.extendedLyrics = extendedLyrics
    this.offset = offset
    this.onPlay = onPlay
    this.onSetLyric = onSetLyric

    this.lineClassName = lineClassName
    this.fontClassName = fontClassName
    this.extendedLrcClassName = extendedLrcClassName
    this.activeLineClassName = activeLineClassName
    this.lineModeClassName = lineModeClassName
    this.shadowClassName = shadowClassName
    this.shadowContent = shadowContent

    this.playingLineNum = -1
    this.isLineMode = false

    this.linePlayer = new LinePlayer({
      offset: this.offset,
      onPlay: this._handleLinePlayerOnPlay,
      onSetLyric: this._handleLinePlayerOnSetLyric,
    })
  }

  _init() {
    this.playingLineNum = -1
    this.isLineMode = false

    this.linePlayer.setLyric(this.lyric, this.extendedLyrics)
  }

  _handleLinePlayerOnPlay = (num, text, curTime) => {
    if (this.isLineMode) {
      if (num < this.playingLineNum + 1) {
        for (let i = this.playingLineNum; i > num - 1; i--) {
          const font = this._lineFonts[i]
          font.reset()
          font.lineContent.classList.remove(this.activeLineClassName)
        }
      } else if (num > this.playingLineNum) {
        for (let i = Math.max(this.playingLineNum, 0); i < num; i++) {
          const font = this._lineFonts[i]
          font.reset()
          font.lineContent.classList.remove(this.activeLineClassName)
        }
      } else if (this.playingLineNum > -1) {
        const font = this._lineFonts[this.playingLineNum]
        font.reset()
        font.lineContent.classList.remove(this.activeLineClassName)
      }
    } else {
      if (num < this.playingLineNum + 1) {
        for (let i = this.playingLineNum; i > num - 1; i--) {
          const font = this._lineFonts[i]
          font.lineContent.classList.remove(this.activeLineClassName)
          font.reset()
        }
      } else if (num > this.playingLineNum) {
        for (let i = Math.max(this.playingLineNum, 0); i < num; i++) {
          const font = this._lineFonts[i]
          font.lineContent.classList.remove(this.activeLineClassName)
          font.finish()
        }
      } else if (this.playingLineNum > -1) {
        const font = this._lineFonts[this.playingLineNum]
        font.lineContent.classList.remove(this.activeLineClassName)
      }
    }
    this.playingLineNum = num
    const font = this._lineFonts[num]
    font.lineContent.classList.add(this.activeLineClassName)
    font.play(curTime - this._lines[num].time)
    this.onPlay(num, this._lines[num].text)
  }

  _handleLinePlayerOnSetLyric = (lyricLines, offset) => {
    // console.log(lyricLines)
    // this._lines = lyricsLines
    this.isLineMode = lyricLines.length && !/^<\d+,\d+>/.test(lyricLines[0].text)

    this._lineFonts = []
    if (this.isLineMode) {
      this._lines = lyricLines.map(line => {
        const fontPlayer = new FontPlayer({
          time: line.time,
          lyric: line.text,
          extendedLyrics: line.extendedLyrics,
          lineClassName: this.lineClassName,
          fontClassName: this.fontClassName,
          extendedLrcClassName: this.extendedLrcClassName,
          lineModeClassName: this.lineModeClassName,
          shadowClassName: this.shadowClassName,
          shadowContent: this.shadowContent,
        })

        this._lineFonts.push(fontPlayer)
        return {
          text: line.text,
          time: line.time,
          extendedLyrics: line.extendedLyrics,
          dom_line: fontPlayer.lineContent,
        }
      })
    } else {
      this._lines = lyricLines.map(line => {
        const fontPlayer = new FontPlayer({
          time: line.time,
          lyric: line.text,
          extendedLyrics: line.extendedLyrics,
          lineClassName: this.lineClassName,
          fontClassName: this.fontClassName,
          extendedLrcClassName: this.extendedLrcClassName,
          shadowClassName: this.shadowClassName,
          shadowContent: this.shadowContent,
        })

        this._lineFonts.push(fontPlayer)
        return {
          text: line.text.replace(fontTimeExp, ''),
          time: line.time,
          extendedLyrics: line.extendedLyrics,
          dom_line: fontPlayer.lineContent,
        }
      })
    }

    // 如果是逐行歌词，则添加 60ms 的偏移
    let newOffset = this.isLineMode ? this.offset + 60 : this.offset
    offset = offset - this.linePlayer.offset + newOffset
    this.linePlayer.offset = newOffset
    this.onSetLyric(this._lines, offset)
  }

  play(curTime) {
    if (!this.linePlayer) return
    this.linePlayer.play(curTime)
  }

  pause() {
    if (!this.linePlayer) return
    this.linePlayer.pause()
    if (this.playingLineNum > -1) this._lineFonts[this.playingLineNum].pause()
  }

  setLyric(lyric, extendedLyrics) {
    this.lyric = lyric
    this.extendedLyrics = extendedLyrics
    this._init()
  }
}
