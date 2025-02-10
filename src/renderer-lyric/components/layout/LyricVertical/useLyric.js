import { ref, onMounted, onBeforeUnmount, watch, nextTick } from '@common/utils/vueTools'
import { scrollXRTo } from '@common/utils/renderer'
import { lyric } from '@lyric/store/lyric'
import { isPlay, setting } from '@lyric/store/state'
import { setWindowBounds, setWindowResizeable } from '@lyric/utils/ipc'
import { isWin } from '@common/utils'

const getOffsetTop = (contentWidth, lineWidth) => {
  switch (setting['desktopLyric.scrollAlign']) {
    case 'top': return contentWidth - lineWidth - 2
    default: return contentWidth * 0.5 - lineWidth / 2
  }
}

export default (isComputeWidth) => {
  const dom_lyric = ref(null)
  const dom_lyric_text = ref(null)
  const isMsDown = ref(false)
  let isStopScroll = false

  const winEvent = {
    isMsDown: false,
    msDownX: 0,
    msDownY: 0,
    windowW: 0,
    windowH: 0,
  }

  let msDownX = 0
  let msDownScrollX = 0
  let timeout = null
  let cancelScrollFn
  let dom_lines
  let line_widths
  let isSetedLines = false
  let prevActiveLine = 0


  const handleScrollLrc = (duration = 300) => {
    if (!dom_lines?.length || !dom_lyric.value) return
    if (isStopScroll) return
    let dom_p = dom_lines[lyric.line]

    if (dom_p) {
      let offset = 0
      if (isComputeWidth.value) {
        let prevLineWidth = line_widths[prevActiveLine] ?? 0
        offset = prevActiveLine < lyric.line ? ((dom_lines[prevActiveLine]?.clientWidth ?? 0) - prevLineWidth) : 0
        // console.log(prevActiveLine, dom_lines[prevActiveLine]?.clientHeight ?? 0, prevLineWidth, offset)
      }
      cancelScrollFn = scrollXRTo(dom_lyric.value, dom_p ? (dom_p.offsetLeft + offset - getOffsetTop(dom_lyric.value.clientWidth, dom_p.clientWidth)) : 0, duration)
    } else {
      cancelScrollFn = scrollXRTo(dom_lyric.value, 0, duration)
    }
  }
  const clearLyricScrollTimeout = () => {
    if (!timeout) return
    clearTimeout(timeout)
    timeout = null
  }
  const startLyricScrollTimeout = () => {
    clearLyricScrollTimeout()
    timeout = setTimeout(() => {
      timeout = null
      isStopScroll = false
      if (!isPlay.value) return
      handleScrollLrc()
    }, 3000)
  }

  const handleLyricDown = (target, x, y) => {
    if (target.classList.contains('font-lrc') ||
        target.parentNode.classList.contains('font-lrc') ||
        target.classList.contains('extended') ||
        target.parentNode.classList.contains('extended')
    ) {
      if (delayScrollTimeout) {
        clearTimeout(delayScrollTimeout)
        delayScrollTimeout = null
      }
      isMsDown.value = true
      msDownX = x
      msDownScrollX = dom_lyric.value.scrollLeft
    } else {
      winEvent.isMsDown = true
      winEvent.msDownX = x
      winEvent.msDownY = y
      winEvent.windowW = window.innerWidth
      winEvent.windowH = window.innerHeight
      // https://github.com/lyswhut/lx-music-desktop/issues/2244
      if (isWin) setWindowResizeable(false)
    }
  }
  const handleLyricMouseDown = event => {
    handleLyricDown(event.target, event.clientX, event.clientY)
  }
  const handleLyricTouchStart = event => {
    if (event.changedTouches.length) {
      const touch = event.changedTouches[0]
      handleLyricDown(event.target, touch.clientX, touch.clientY)
    }
  }
  const handleMouseMsUp = () => {
    isMsDown.value = false
    winEvent.isMsDown = false
    if (isWin) setWindowResizeable(true)
  }

  const handleMove = (x, y) => {
    if (isMsDown.value) {
      isStopScroll ||= true
      if (cancelScrollFn) {
        cancelScrollFn()
        cancelScrollFn = null
      }
      dom_lyric.value.scrollLeft = msDownScrollX + msDownX - x
      startLyricScrollTimeout()
    } else if (winEvent.isMsDown) {
      // https://github.com/lyswhut/lx-music-desktop/issues/2244
      if (isWin) {
        setWindowBounds({
          x: x - winEvent.msDownX,
          y: y - winEvent.msDownY,
          w: winEvent.windowW,
          h: winEvent.windowH,
        })
      } else {
        setWindowBounds({
          x: x - winEvent.msDownX,
          y: y - winEvent.msDownY,
          w: window.innerWidth,
          h: window.innerHeight,
        })
      }
    }
  }
  const handleMouseMsMove = event => {
    handleMove(event.clientX, event.clientY)
  }
  const handleTouchMove = (e) => {
    if (e.changedTouches.length) {
      const touch = e.changedTouches[0]
      handleMove(touch.clientX, touch.clientY)
    }
  }

  const handleWheel = (event) => {
    console.log(event.deltaY)
    if (cancelScrollFn) {
      cancelScrollFn()
      cancelScrollFn = null
    }
    dom_lyric.value.scrollLeft = dom_lyric.value.scrollLeft - event.deltaY
    startLyricScrollTimeout()
  }

  const setLyric = (lines) => {
    const dom_line_content = document.createDocumentFragment()
    for (const line of lines) {
      dom_line_content.appendChild(line.dom_line)
    }
    dom_lyric_text.value.textContent = ''
    dom_lyric_text.value.appendChild(dom_line_content)
    nextTick(() => {
      dom_lines = dom_lyric.value.querySelectorAll('.line-content')
      line_widths = Array.from(dom_lines).map(l => l.clientWidth)
      handleScrollLrc()
    })
  }

  const initLrc = (lines, oLines) => {
    prevActiveLine = 0
    isSetedLines = true
    if (oLines) {
      if (lines.length) {
        setLyric(lines)
      } else {
        cancelScrollFn = scrollXRTo(dom_lyric.value, 0, 300, () => {
          if (lyric.lines !== lines) return
          setLyric(lines)
        }, 50)
      }
    } else {
      setLyric(lines)
    }
  }

  let delayScrollTimeout
  const scrollLine = (line, oldLine) => {
    setImmediate(() => {
      prevActiveLine = line
    })
    if (line < 0) return
    if (line == 0 && isSetedLines) return isSetedLines = false
    isSetedLines &&= false
    if (oldLine == null || line - oldLine != 1) return handleScrollLrc()

    if (setting['desktopLyric.isDelayScroll']) {
      delayScrollTimeout = setTimeout(() => {
        delayScrollTimeout = null
        handleScrollLrc(600)
      }, 600)
    } else {
      handleScrollLrc()
    }
  }

  watch(() => lyric.lines, initLrc)
  watch(() => lyric.line, scrollLine)

  onMounted(() => {
    document.addEventListener('mousemove', handleMouseMsMove)
    document.addEventListener('mouseup', handleMouseMsUp)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleMouseMsUp)

    initLrc(lyric.lines, null)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', handleMouseMsMove)
    document.removeEventListener('mouseup', handleMouseMsUp)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleMouseMsUp)
  })

  return {
    dom_lyric,
    dom_lyric_text,
    isMsDown,
    handleLyricMouseDown,
    handleLyricTouchStart,
    handleWheel,
  }
}
