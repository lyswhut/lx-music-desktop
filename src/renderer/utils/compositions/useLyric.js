import { ref, onMounted, onBeforeUnmount, watch, nextTick } from '@renderer/utils/vueTools'
import { scrollTo } from '@renderer/utils'

export default ({ isPlay, lyric }) => {
  const dom_lyric = ref(null)
  const dom_lyric_text = ref(null)
  const isMsDown = ref(false)

  let msDownY = 0
  let msDownScrollY = 0
  let isStopScroll = false
  let timeout = null
  let cancelScrollFn
  let dom_lines
  let isSetedLines = false

  const handleScrollLrc = (duration = 300) => {
    if (!dom_lines?.length || !dom_lyric.value) return
    if (cancelScrollFn) {
      cancelScrollFn()
      cancelScrollFn = null
    }
    if (isStopScroll) return
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
    timeout = setTimeout(() => {
      timeout = null
      isStopScroll = false
      if (!isPlay.value) return
      handleScrollLrc()
    }, 3000)
  }
  const handleLyricMouseDown = event => {
    // console.log(event)
    if (delayScrollTimeout) {
      clearTimeout(delayScrollTimeout)
      delayScrollTimeout = null
    }
    isMsDown.value = true
    msDownY = event.clientY
    msDownScrollY = dom_lyric.value.scrollTop
  }
  const handleMouseMsUp = event => {
    isMsDown.value = false
  }
  const handleMouseMsMove = event => {
    if (isMsDown.value) {
      if (!isStopScroll) isStopScroll = true
      if (cancelScrollFn) {
        cancelScrollFn()
        cancelScrollFn = null
      }
      dom_lyric.value.scrollTop = msDownScrollY + msDownY - event.clientY
      startLyricScrollTimeout()
    }
  }

  const handleWheel = (event) => {
    console.log(event.deltaY)
    if (!isStopScroll) isStopScroll = true
    if (cancelScrollFn) {
      cancelScrollFn()
      cancelScrollFn = null
    }
    dom_lyric.value.scrollTop = dom_lyric.value.scrollTop + event.deltaY
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
      dom_lines = dom_lyric.value.querySelectorAll('.lrc-content')
      handleScrollLrc()
    })
  }

  const initLrc = (lines, oLines) => {
    isSetedLines = true
    if (oLines) {
      if (lines.length) {
        setLyric(lines)
      } else {
        if (cancelScrollFn) {
          cancelScrollFn()
          cancelScrollFn = null
        }
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
    if (oldLine == null || line - oldLine != 1) return handleScrollLrc()

    delayScrollTimeout = setTimeout(() => {
      delayScrollTimeout = null
      handleScrollLrc(600)
    }, 600)
  }

  watch(() => lyric.lines, initLrc)
  watch(() => lyric.line, scrollLine)

  onMounted(() => {
    initLrc(lyric.lines, null)
    nextTick(() => {
      scrollLine(lyric.line)
    })
  })

  document.addEventListener('mousemove', handleMouseMsMove)
  document.addEventListener('mouseup', handleMouseMsUp)
  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', handleMouseMsMove)
    document.removeEventListener('mouseup', handleMouseMsUp)
  })

  return {
    dom_lyric,
    dom_lyric_text,
    isMsDown,
    handleLyricMouseDown,
    handleWheel,
  }
}
