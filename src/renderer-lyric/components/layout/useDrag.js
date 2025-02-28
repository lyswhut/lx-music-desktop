import { onMounted, onBeforeUnmount } from '@common/utils/vueTools'
import { setWindowBounds, setWindowResizeable } from '@lyric/utils/ipc'
import { isWin } from '@common/utils'

export default () => {
  const winEvent = {
    isMsDown: false,
    msDownX: 0,
    msDownY: 0,
    windowW: 0,
    windowH: 0,
  }

  const handleLyricDown = (target, x, y) => {
    winEvent.isMsDown = true
    winEvent.msDownX = x
    winEvent.msDownY = y
    winEvent.windowW = window.innerWidth
    winEvent.windowH = window.innerHeight
    // https://github.com/lyswhut/lx-music-desktop/issues/2244
    if (isWin) setWindowResizeable(false)
  }
  const handleLyricMouseDown = event => {
    console.log(event.target, event.currentTarget)
    if (event.target !== event.currentTarget) return
    handleLyricDown(event.target, event.clientX, event.clientY)
  }
  const handleLyricTouchStart = event => {
    if (event.changedTouches.length) {
      const touch = event.changedTouches[0]
      if (touch.target !== touch.currentTarget) return
      handleLyricDown(event.target, touch.clientX, touch.clientY)
    }
  }
  const handleMouseMsUp = () => {
    winEvent.isMsDown = false
    if (isWin) setWindowResizeable(true)
  }

  const handleMove = (x, y) => {
    if (!winEvent.isMsDown) return
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
  const handleMouseMsMove = event => {
    handleMove(event.clientX, event.clientY)
  }
  const handleTouchMove = (e) => {
    if (e.changedTouches.length) {
      const touch = e.changedTouches[0]
      handleMove(touch.clientX, touch.clientY)
    }
  }

  onMounted(() => {
    document.addEventListener('mousemove', handleMouseMsMove)
    document.addEventListener('mouseup', handleMouseMsUp)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleMouseMsUp)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', handleMouseMsMove)
    document.removeEventListener('mouseup', handleMouseMsUp)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleMouseMsUp)
  })

  return {
    handleLyricMouseDown,
    handleLyricTouchStart,
  }
}
