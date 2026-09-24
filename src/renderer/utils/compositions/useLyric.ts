import { ref, onMounted, onBeforeUnmount, watch, nextTick, type Ref } from '@common/utils/vueTools'
import { throttle, formatPlayTime2 } from '@common/utils/common'
import { scrollTo } from '@common/utils/renderer'
import { play } from '@renderer/core/player/action'
import { appSetting } from '@renderer/store/setting'
// import { player as eventPlayerNames } from '@renderer/event/names'

interface LyricLine {
  time?: number
  dom_line: Node
}

interface LyricState {
  lines: LyricLine[]
  line: number
  offset: number
  tempOffset: number
}

interface PlayProgressState {
  maxPlayTime: number
}

interface UseLyricOptions {
  isPlay: Ref<boolean>
  lyric: LyricState
  playProgress: PlayProgressState
  isShowLyricProgressSetting: Ref<boolean>
  offset?: any
}

export default ({ isPlay, lyric, playProgress, isShowLyricProgressSetting, offset }: UseLyricOptions) => {
  const dom_lyric = ref<HTMLElement | null>(null)
  const dom_lyric_text = ref<HTMLElement | null>(null)
  const dom_skip_line = ref<HTMLElement | null>(null)
  const isMsDown = ref(false)
  const isStopScroll = ref(false)
  const timeStr = ref('--/--')

  let msDownY = 0
  let msDownScrollY = 0
  let timeout: ReturnType<typeof setTimeout> | null = null
  let cancelScrollFn: (() => void) | null
  let dom_lines: any
  let isSetedLines = false
  const point: { x: number, y: number } = {
    x: 0,
    y: 0,
  }
  let time = -1
  let dom_pre_line: any = null
  let isSkipMouseEnter = false

  const handleSkipPlay = (): void => {
    if (time == -1) return
    handleSkipMouseLeave()
    isStopScroll.value = false
    window.app_event.setProgress(time)
    if (!isPlay.value) play()
  }
  const handleSkipMouseEnter = (): void => {
    isSkipMouseEnter = true
    clearLyricScrollTimeout()
  }
  const handleSkipMouseLeave = (): void => {
    isSkipMouseEnter = false
    startLyricScrollTimeout()
  }

  const throttleSetTime = throttle((): void => {
    if (!dom_skip_line.value) return
    const rect = dom_skip_line.value.getBoundingClientRect()
    point.x = rect.x
    point.y = rect.y
    let dom: any = document.elementFromPoint(point.x, point.y)
    if (!dom) return
    if (dom_pre_line === dom) return
    if (dom.tagName == 'SPAN') {
      dom = dom.parentNode.parentNode
    } else if (dom.classList.contains('line')) {
      dom = dom.parentNode
    }
    if (dom.time == null) {
      if (lyric.lines.length) {
        time = dom.classList.contains('pre') ? 0 : (lyric.lines[lyric.lines.length - 1].time ?? 0)
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
  const setTime = (): void => {
    if (isShowLyricProgressSetting.value) throttleSetTime()
  }

  const handleScrollLrc = (duration: number = 300): void => {
    if (!dom_lines?.length || !dom_lyric.value) return
    if (isSkipMouseEnter) return
    if (isStopScroll.value) return
    const dom_p = dom_lines[lyric.line]
    cancelScrollFn = scrollTo(
      dom_lyric.value,
      dom_p ? dom_p.offsetTop - dom_lyric.value.clientHeight * 0.38 : 0,
      duration,
    )
  }
  const clearLyricScrollTimeout = (): void => {
    if (!timeout) return
    clearTimeout(timeout)
    timeout = null
  }
  const startLyricScrollTimeout = (): void => {
    clearLyricScrollTimeout()
    if (isSkipMouseEnter) return
    timeout = setTimeout(() => {
      timeout = null
      isStopScroll.value = false
      if (!isPlay.value) return
      handleScrollLrc()
    }, 3000)
  }
  const handleLyricDown = (y: number): void => {
    // console.log(event)
    if (delayScrollTimeout) {
      clearTimeout(delayScrollTimeout)
      delayScrollTimeout = null
    }
    isMsDown.value = true
    msDownY = y
    msDownScrollY = dom_lyric.value!.scrollTop
  }
  const handleLyricMouseDown = (event: MouseEvent): void => {
    handleLyricDown(event.clientY)
  }
  const handleLyricTouchStart = (event: TouchEvent): void => {
    if (event.changedTouches.length) {
      const touch = event.changedTouches[0]
      handleLyricDown(touch.clientY)
    }
  }
  const handleMouseMsUp = (_event: Event): void => {
    isMsDown.value = false
  }
  const handleMove = (y: number): void => {
    if (isMsDown.value) {
      isStopScroll.value ||= true
      if (cancelScrollFn) {
        cancelScrollFn()
        cancelScrollFn = null
      }
      dom_lyric.value!.scrollTop = msDownScrollY + msDownY - y
      startLyricScrollTimeout()
      setTime()
    }
  }
  const handleMouseMsMove = (event: MouseEvent): void => {
    handleMove(event.clientY)
  }
  const handleTouchMove = (e: TouchEvent): void => {
    if (e.changedTouches.length) {
      const touch = e.changedTouches[0]
      handleMove(touch.clientY)
    }
  }

  const handleWheel = (event: WheelEvent): void => {
    console.log(event.deltaY)
    isStopScroll.value ||= true
    if (cancelScrollFn) {
      cancelScrollFn()
      cancelScrollFn = null
    }
    dom_lyric.value!.scrollTop = dom_lyric.value!.scrollTop + event.deltaY
    startLyricScrollTimeout()
    setTime()
  }

  const setLyric = (lines: LyricLine[]): void => {
    const dom_line_content = document.createDocumentFragment()
    for (const line of lines) {
      dom_line_content.appendChild(line.dom_line)
    }
    dom_lyric_text.value!.textContent = ''
    dom_lyric_text.value!.appendChild(dom_line_content)
    void nextTick(() => {
      dom_lines = dom_lyric.value!.querySelectorAll('.line-content')
      handleScrollLrc()
    })
  }

  const initLrc = (lines: LyricLine[], oLines: LyricLine[] | null | undefined): void => {
    isSetedLines = true
    if (oLines) {
      if (lines.length) {
        setLyric(lines)
      } else {
        if (!dom_lyric.value) return
        cancelScrollFn = scrollTo(
          dom_lyric.value,
          0,
          300,
          () => {
            if (lyric.lines !== lines) return
            setLyric(lines)
          },
          50,
        )
      }
    } else {
      setLyric(lines)
    }
  }

  let delayScrollTimeout: ReturnType<typeof setTimeout> | null = null
  const scrollLine = (line: number, oldLine: number | undefined): void => {
    if (line < 0) return
    if (line == 0 && isSetedLines) {
      isSetedLines = false
      return
    }
    isSetedLines &&= false
    if (oldLine == null || line - oldLine != 1) { handleScrollLrc(); return }

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
