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
    aboveLyrics = [],
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
    this.aboveLyrics = aboveLyrics
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
    this.extendedFontsList = [] // 各逐字扩展行的 fonts（与主歌词同索引同步驱动）

    this.lineContent = document.createElement('div')
    this.lineContent.time = this.time
    this.lineContent.className = this.lineContentClassName

    // 上方歌词（如音译）：渲染在主歌词之前，每行后加 <br>
    for (const lrc of this.aboveLyrics) {
      this.lineContent.appendChild(this._createExtendedLine(lrc))
      this.lineContent.appendChild(document.createElement('br'))
    }

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

    // 下方扩展歌词（翻译/AI谐音等）：渲染在主歌词之后，每行前加 <br>
    for (const lrc of this.extendedLyrics) {
      this.lineContent.appendChild(document.createElement('br'))
      this.lineContent.appendChild(this._createExtendedLine(lrc))
    }
    this._parseLyric()
  }

  /**
   * 构造一条扩展歌词行（上方音译 / 下方翻译等）。含逐字标记时建 span+动画并加入
   * extendedFontsList（跟随主歌词同索引同步驱动），否则渲染为纯文本。返回外层容器 div。
   */
  _createExtendedLine(lrc) {
    const extendedLrcContent = document.createElement('div')
    extendedLrcContent.style = 'position:relative;display:inline-block;'
    extendedLrcContent.className = this.extendedLrcClassName

    const lineContent = document.createElement('div')
    lineContent.className = this.fontLrcClassName
    const extFonts = this._parseExtendedFont(lrc, lineContent)
    if (extFonts) this.extendedFontsList.push(extFonts)
    else lineContent.textContent = lrc.replace(timeRxpAll, '')
    extendedLrcContent.appendChild(lineContent)
    return extendedLrcContent
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
        num: this.fonts.length,
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

  /**
   * 解析逐字扩展行（如酷狗逐字音译）。仅当主歌词为逐字模式且该行含 <off,dur> 标记时建 span+动画；
   * 否则返回 null（调用方回退为纯文本）。返回的 fonts 与主歌词同索引，由 _handleExtendedFonts 同步驱动。
   * 可读性（描边）由 CSS filter: drop-shadow 提供——逐字 span 用透明裁切填充，
   * text-shadow 对透明文字无效，drop-shadow 作用于实际渲染像素故有效，无需额外 shadow 副本 DOM。
   */
  _parseExtendedFont(lrc, container) {
    if (!timeRxp.test(this.lyric) || !timeRxp.test(lrc)) return null
    const chunks = lrc.split(fontSplitRxp)
    const fonts = []
    for (const chunk of chunks) {
      if (!timeRxp.test(chunk)) return null // 含非逐字片段，整行降级纯文本
      const text = chunk.replace(timeRxp, '')
      const time = parseInt(RegExp.$2)
      const startTime = parseInt(RegExp.$1)
      const dom = document.createElement('span')
      dom.textContent = text
      const animation = createAnimation(dom, time / this._rate, this.isVertical)
      container.appendChild(dom)
      fonts.push({ text, startTime, time, dom, animation })
    }
    return fonts.length ? fonts : null
  }

  // 对各逐字扩展行的同索引 font 设置背景填充比例（cancel 动画后置位）
  _setExtendedFontsBg(num, value) {
    for (const fonts of this.extendedFontsList) {
      const font = fonts[num]
      if (font) {
        font.animation.cancel()
        font.dom.style.backgroundSize = value
      }
    }
  }

  // 对所有逐字扩展行的所有 font 设置背景填充比例（用于 finish/reset 整体置位）
  _setAllExtendedFontsBg(value) {
    for (const fonts of this.extendedFontsList) {
      for (const font of fonts) {
        font.animation.cancel()
        font.dom.style.backgroundSize = value
      }
    }
  }

  // 对单个 font 应用播放/填充状态（主歌词与扩展行共用）
  _applyFontState(font, currentTime, toFinishe) {
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
    this._applyFontState(font, currentTime, toFinishe)
    // 主歌词 font 带 num，联动各逐字扩展行同索引的字（音译等）
    if (font.num != null) {
      for (const fonts of this.extendedFontsList) {
        const extFont = fonts[font.num]
        if (extFont) this._applyFontState(extFont, currentTime, toFinishe)
      }
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
      this._setExtendedFontsBg(i, '0 100%')
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
    this._setAllExtendedFontsBg('100% 100%')
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
    this._setAllExtendedFontsBg('0 100%')
    this.curFontNum = 0
  }
}

