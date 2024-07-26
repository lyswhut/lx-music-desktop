import { ref, onMounted, onBeforeUnmount, watch, nextTick } from '@common/utils/vueTools'
import { throttle, formatPlayTime2 } from '@common/utils/common'
import { scrollTo } from '@common/utils/renderer'
import { play } from '@renderer/core/player/action'
import { appSetting } from '@renderer/store/setting'
// import { player as eventPlayerNames } from '@renderer/event/names'

export default ({ isPlay, lyric, playProgress, isShowLyricProgressSetting, offset }) => {
  const dom_lyric = ref(null)
  const dom_lyric_text = ref(null)
  const dom_skip_line = ref(null)
  const isMsDown = ref(false)
  const isStopScroll = ref(false)
  const timeStr = ref('--/--')

  let msDownY = 0
  let msDownScrollY = 0
  let timeout = null
  let cancelScrollFn
  let dom_lines
  let isSetedLines = false
  let point = {
    x: null,
    y: null,
  }
  let time = -1
  let dom_pre_line = null
  let isSkipMouseEnter = false

  const handleSkipPlay = () => {
    if (time == -1) return
    handleSkipMouseLeave()
    isStopScroll.value = false
    window.app_event.setProgress(time)
    if (!isPlay.value) play()
  }
  const handleSkipMouseEnter = () => {
    isSkipMouseEnter = true
    clearLyricScrollTimeout()
  }
  const handleSkipMouseLeave = () => {
    isSkipMouseEnter = false
    startLyricScrollTimeout()
  }

  const throttleSetTime = throttle(() => {
    if (!dom_skip_line.value) return
    const rect = dom_skip_line.value.getBoundingClientRect()
    point.x = rect.x
    point.y = rect.y
    let dom = document.elementFromPoint(point.x, point.y)
    if (dom_pre_line === dom) return
    if (dom.tagName == 'SPAN') {
      dom = dom.parentNode.parentNode
    } else if (dom.classList.contains('line')) {
      dom = dom.parentNode
    }
    if (dom.time == null) {
      if (lyric.lines.length) {
        time = dom.classList.contains('pre') ? 0 : lyric.lines[lyric.lines.length - 1].time ?? 0
        time = Math.max(time - lyric.offset - lyric.tempOffset, 0)
        time /= 1000
        if (time > playProgress.maxPlayTime) time = playProgress.maxPlayTime
        timeStr.value = formatPlayTime2(time)
      } else {
        time = -1
        timeStr.value = '--:--'
      }
    } else {
      time = dom.time
      time = Math.max(time - lyric.offset - lyric.tempOffset, 0)
      time /= 1000
      if (time > playProgress.maxPlayTime) time = playProgress.maxPlayTime
      timeStr.value = formatPlayTime2(time)
    }
    dom_pre_line = dom
  })
  const setTime = () => {
    if (isShowLyricProgressSetting.value) throttleSetTime()
  }

  const handleScrollLrc = (duration = 300) => {
    if (!dom_lines?.length || !dom_lyric.value) return
    if (isSkipMouseEnter) return
    if (isStopScroll.value) return
    let dom_p = dom_lines[lyric.line]
    cancelScrollFn = scrollTo(dom_lyric.value, dom_p ? (dom_p.offsetTop - dom_lyric.value.clientHeight * 0.38) : 0, duration)
  }
  const clearLyricScrollTimeout = () => {
    if (!timeout) return
    clearTimeout(timeout)
    timeout = null
  }
  const startLyricScrollTimeout = () => {
    clearLyricScrollTimeout()
    if (isSkipMouseEnter) return
    timeout = setTimeout(() => {
      timeout = null
      isStopScroll.value = false
      if (!isPlay.value) return
      handleScrollLrc()
    }, 3000)
  }
  const handleLyricDown = (y) => {
    // console.log(event)
    if (delayScrollTimeout) {
      clearTimeout(delayScrollTimeout)
      delayScrollTimeout = null
    }
    isMsDown.value = true
    msDownY = y
    msDownScrollY = dom_lyric.value.scrollTop
  }
  const handleLyricMouseDown = event => {
    handleLyricDown(event.clientY)
  }
  const handleLyricTouchStart = event => {
    if (event.changedTouches.length) {
      const touch = event.changedTouches[0]
      handleLyricDown(touch.clientY)
    }
  }
  const handleMouseMsUp = event => {
    isMsDown.value = false
  }
  const handleMove = (y) => {
    if (isMsDown.value) {
      isStopScroll.value ||= true
      if (cancelScrollFn) {
        cancelScrollFn()
        cancelScrollFn = null
      }
      dom_lyric.value.scrollTop = msDownScrollY + msDownY - y
      startLyricScrollTimeout()
      setTime()
    }
  }
  const handleMouseMsMove = event => {
    handleMove(event.clientY)
  }
  const handleTouchMove = (e) => {
    if (e.changedTouches.length) {
      const touch = e.changedTouches[0]
      handleMove(touch.clientY)
    }
  }

  const handleWheel = (event) => {
    console.log(event.deltaY)
    isStopScroll.value ||= true
    if (cancelScrollFn) {
      cancelScrollFn()
      cancelScrollFn = null
    }
    dom_lyric.value.scrollTop = dom_lyric.value.scrollTop + event.deltaY
    startLyricScrollTimeout()
    setTime()
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
      handleScrollLrc()
    })
  }

  const initLrc = (lines, oLines) => {
    isSetedLines = true
    if (oLines) {
      if (lines.length) {
        setLyric(lines)
      } else {
        cancelScrollFn = scrollTo(dom_lyric.value, 0, 300, () => {
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
    if (line < 0) return
    if (line == 0 && isSetedLines) return isSetedLines = false
    isSetedLines &&= false
    if (oldLine == null || line - oldLine != 1) return handleScrollLrc()

    if (appSetting['playDetail.isDelayScroll']) {
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
    dom_skip_line,
    isStopScroll,
    isMsDown,
    timeStr,
    handleLyricMouseDown,
    handleLyricTouchStart,
    handleWheel,
    handleSkipPlay,
    handleSkipMouseEnter,
    handleSkipMouseLeave,
    handleScrollLrc,
  }
}
