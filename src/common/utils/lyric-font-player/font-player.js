import { getNow, TimeoutTools } from './utils'

// const fontFormateRxp = /(?=<\d+,\d+>).*?/g
const fontSplitRxp = /(?=<\d+,\d+>).*?/g
const timeRxpAll = /<(\d+),(\d+)>/g
const timeRxp = /<(\d+),(\d+)>/


// Create animation
const createAnimation = (dom, duration, isVertical) => new window.Animation(new window.KeyframeEffect(dom, isVertical
  ? [
      { backgroundSize: '100% 0' },
      { backgroundSize: '100% 100%' },
    ]
  : [
      { backgroundSize: '0 100%' },
      { backgroundSize: '100% 100%' },
    ], {
  duration,
  easing: 'linear',
},
), document.timeline)


// https://jsfiddle.net/ceqpnbky/
// https://jsfiddle.net/ceqpnbky/1/

export default class FontPlayer {
  constructor({
    time = 0,
    rate = 1,
    lyric = '',
    lineContentClassName = 'line-content',
    lineClassName = 'line',
    shadowClassName = 'shadow',
    fontModeClassName = 'font-mode',
    lineModeClassName = 'line-mode',
    fontLrcClassName = 'font-lrc',
    extendedLrcClassName = 'extended',
    shadowContent = false,
    extendedLyrics = [],
    isVertical = false,
  }) {
    this.time = time
    this.lyric = lyric

    this._rate = rate

    this.isVertical = isVertical

    this.lineContentClassName = lineContentClassName
    this.lineClassName = lineClassName

    this.shadowContent = shadowContent
    this.shadowClassName = shadowClassName

    this.extendedLyrics = extendedLyrics
    this.fontModeClassName = fontModeClassName
    this.fontLrcClassName = fontLrcClassName
    this.extendedLrcClassName = extendedLrcClassName
    this.lineModeClassName = lineModeClassName


    this.isPlay = false
    this.curFontNum = 0
    this.maxFontNum = 0
    this._performanceTime = 0
    this._startTime = 0

    this.lineContent = null

    this.timeoutTools = new TimeoutTools(50)
    this.waitPlayTimeout = new TimeoutTools(50)

    this._init()
  }

  _init() {
    if (this.lyric == null) this.lyric = ''

    this.isLineMode = false

    this.lineContent = document.createElement('div')
    this.lineContent.time = this.time
    this.lineContent.className = this.lineContentClassName

    this.line = document.createElement('div')
    this.line.style = 'position:relative;display:inline-block;'
    this.line.className = this.lineClassName
    this.lineContent.appendChild(this.line)

    this.lrcContent = document.createElement('div')
    this.lrcContent.className = this.fontLrcClassName
    // if (this.shadowContent) {
    //   this.lrcShadowContent = document.createElement('div')
    //   this.lrcShadowContent.style = 'position:absolute;top:0;left:0;width:100%;z-index:-1;'
    //   this.lrcShadowContent.className = this.shadowClassName
    //   this.line.appendChild(this.lrcShadowContent)
    // }
    this.line.appendChild(this.lrcContent)

    for (const lrc of this.extendedLyrics) {
      const extendedLrcContent = document.createElement('div')
      extendedLrcContent.style = 'position:relative;display:inline-block;'
      extendedLrcContent.className = this.extendedLrcClassName
      this.lineContent.appendChild(document.createElement('br'))
      this.lineContent.appendChild(extendedLrcContent)


      // if (this.shadowContent) {
      //   const extendedLrcShadowContent = document.createElement('div')
      //   extendedLrcShadowContent.style = 'position:absolute;top:0;left:0;width:100%;z-index:-1;'
      //   extendedLrcShadowContent.className = this.shadowClassName
      //   extendedLrcShadowContent.textContent = lrc
      //   extendedLrcContent.appendChild(extendedLrcShadowContent)
      // }

      const lineContent = document.createElement('div')
      lineContent.className = this.fontLrcClassName
      lineContent.textContent = lrc.replace(timeRxpAll, '')
      extendedLrcContent.appendChild(lineContent)
    }
    this._parseLyric()
  }

  _parseLyric() {
    const fonts = this.lyric.split(fontSplitRxp)
    // console.log(fonts)

    this.maxFontNum = fonts.length - 1
    this.fonts = []
    let text
    // let lineText = ''
    let lrcShadowContent
    for (const font of fonts) {
      if (!timeRxp.test(font)) return this._handleLineParse()
      text = font.replace(timeRxp, '')
      const time = parseInt(RegExp.$2)

      const dom = document.createElement('span')
      dom.textContent = text
      const animation = createAnimation(dom, time / this._rate, this.isVertical)
      this.lrcContent.appendChild(dom)
      // lineText += text

      if (this.shadowContent) {
        lrcShadowContent ??= document.createElement('div')
        const shadowDom = document.createElement('span')
        shadowDom.textContent = text
        lrcShadowContent.appendChild(shadowDom)
      }
      // dom.style = shadowDom.style = this.fontStyle
      // dom.className = shadowDom.className = this.fontClassName

      this.fonts.push({
        text,
        startTime: parseInt(RegExp.$1),
        time,
        dom,
        animation,
      })
    }

    if (this.shadowContent && lrcShadowContent) {
      lrcShadowContent.style = 'position:absolute;top:0;left:0;right:0;z-index:-1;'
      lrcShadowContent.className = this.shadowClassName
      this.line.appendChild(lrcShadowContent)
    }

    this.line.appendChild(this.lrcContent)
    this.fonts.at(-1)?.animation.addEventListener('finish', () => {
      this.lineContent.classList.add('played')
      this.isPlay = false
    })
    this.lineContent.classList.add(this.fontModeClassName)
    // if (this.shadowContent) this.lrcShadowContent.textContent = lineText
    // console.log(this.fonts)
  }

  _handleLineParse() {
    this.isLineMode = true
    this.lineContent.classList.add(this.lineModeClassName)
    this.lrcContent.textContent = this.lyric

    // if (this.shadowContent) this.lrcShadowContent.textContent = this.lyric
    this.fonts.push({
      text: this.lyric,
    })
  }

  _currentTime() {
    return (getNow() - this._performanceTime) * this._rate + this._startTime
  }

  _findcurFontNum(curTime, startIndex = 0) {
    const length = this.fonts.length
    for (let index = startIndex; index < length; index++) if (curTime < this.fonts[index].startTime) return index == 0 ? 0 : index - 1
    return length - 1
  }

  _handlePlayMaxFontNum() {
    let curFont = this.fonts[this.curFontNum]
    // console.log(curFont.text)
    const currentTime = this._currentTime()
    const driftTime = currentTime - curFont.startTime
    if (currentTime > curFont.startTime + curFont.time) {
      this._handlePlayFont(curFont, driftTime / this._rate, true)
      this.lineContent.classList.add('played')
      this.isPlay = false
      this.pause()
    } else {
      this._handlePlayFont(curFont, driftTime)
    }
  }

  _handlePlayFont(font, currentTime, toFinishe) {
    switch (font.animation.playState) {
      case 'finished':
        break
      case 'idle':
        font.dom.style.backgroundSize = '100% 100%'
        if (!toFinishe) font.animation.play()
        break
      default:
        if (toFinishe) {
          font.animation.cancel()
        } else {
          font.animation.currentTime = currentTime
          font.animation.play()
        }
        break
    }
  }

  _handlePlayLine(isPlayed) {
    this.isPlay = false
    if (isPlayed) {
      this.lineContent.classList.add('played')
    } else {
      this.lineContent.classList.remove('played')
    }
    // this.fonts[0].dom.style.backgroundSize = isPlayed ? '100% 100%' : '100% 0'
  }

  _handlePauseFont(font) {
    if (font.animation.playState == 'running') font.animation.pause()
  }

  _refresh() {
    this.curFontNum++
    // console.log('curFontNum time', this.fonts[this.curFontNum].time)
    if (this.curFontNum >= this.maxFontNum) return this._handlePlayMaxFontNum()
    let curFont = this.fonts[this.curFontNum]
    // console.log(curFont, nextFont, this.curFontNum, this.maxFontNum)
    const currentTime = this._currentTime()
    // console.log(curFont.text)
    const driftTime = currentTime - curFont.startTime

    // console.log(currentTime, driftTime)

    if (driftTime >= 0 || this.curFontNum == 0) {
      let nextFont = this.fonts[this.curFontNum + 1]
      const delay = (nextFont.startTime - curFont.startTime - driftTime) / this._rate
      if (delay > 0) {
        if (this.isPlay) {
          this.timeoutTools.start(() => {
            if (!this.isPlay) return
            this._refresh()
          }, delay)
        }
        this._handlePlayFont(curFont, driftTime)
        return
      } else {
        let newCurLineNum = this._findcurFontNum(currentTime, this.curFontNum + 1)
        if (newCurLineNum > this.curFontNum) this.curFontNum = newCurLineNum - 1
        for (let i = 0; i <= this.curFontNum; i++) this._handlePlayFont(this.fonts[i], 0, true)
        this._refresh()
        return
      }
    } else if (this.curFontNum == 0) {
      this.curFontNum--
      if (this.isPlay) {
        this.waitPlayTimeout.start(() => {
          if (!this.isPlay) return
          this._refresh()
        }, -driftTime)
      }
      return
    }

    this.curFontNum = this._findcurFontNum(currentTime, this.curFontNum) - 1
    for (let i = 0; i <= this.curFontNum; i++) this._handlePlayFont(this.fonts[i], 0, true)
    // this.curFontNum--
    this._refresh()
  }

  play(curTime = 0) {
    // console.log('play', curTime)
    if (!this.fonts.length) return
    this.pause()

    if (this.isLineMode) return this._handlePlayLine(true)
    this.lineContent.classList.remove('played')
    this.isPlay = true
    this._performanceTime = getNow()
    this._startTime = curTime

    this.curFontNum = this._findcurFontNum(curTime)

    for (let i = this.curFontNum; i > -1; i--) {
      this._handlePlayFont(this.fonts[i], 0, true)
    }
    for (let i = this.curFontNum, len = this.fonts.length; i < len; i++) {
      let font = this.fonts[i]
      font.animation.cancel()
      font.dom.style.backgroundSize = '0 100%'
    }

    this.curFontNum--

    this._refresh()
  }

  pause() {
    if (!this.isPlay) return
    this.isPlay = false
    this.timeoutTools.clear()
    this.waitPlayTimeout.clear()
    this._handlePauseFont(this.fonts[this.curFontNum])
    if (this.curFontNum === this.maxLine) return
    const curFontNum = this._findcurFontNum(this._currentTime())
    if (this.curFontNum === curFontNum) return
    for (let i = 0; i < this.curFontNum; i++) this._handlePlayFont(this.fonts[i], 0, true)
  }

  finish() {
    this.pause()
    if (this.isLineMode) return this._handlePlayLine(true)
    this.lineContent.classList.add('played')

    for (const font of this.fonts) {
      font.animation.cancel()
      font.dom.style.backgroundSize = '100% 100%'
    }
    this.curFontNum = this.maxFontNum
  }

  setPlaybackRate(rate) {
    this._rate = rate
    if (!this.lines.length) return
    if (!this.isPlay) return
    this.play(this._currentTime())
  }

  reset() {
    this.pause()
    if (this.isLineMode) return this._handlePlayLine(false)
    this.lineContent.classList.remove('played')
    for (const font of this.fonts) {
      font.animation.cancel()
      font.dom.style.backgroundSize = '0 100%'
    }
    this.curFontNum = 0
  }
}

