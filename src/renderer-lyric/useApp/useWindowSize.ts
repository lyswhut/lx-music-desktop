import { setting } from '@lyric/store/state'
import { onBeforeUnmount, onMounted } from '@common/utils/vueTools'
import { setWindowBounds } from '@lyric/utils/ipc'

type Origin = 'left'
| 'top'
| 'right'
| 'bottom'
| 'top-left'
| 'top-right'
| 'bottom-left'
| 'bottom-right'

export default () => {
  const resize: {
    origin: Origin | null
    msDownX: number
    msDownY: number
  } = {
    origin: null,
    msDownX: 0,
    msDownY: 0,
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!resize.origin || setting['desktopLyric.isLock']) return
    // if (!event.target.classList.contains('resize-' + resize.origin)) return
    // console.log(event.target)
    let bounds: LX.DesktopLyric.NewBounds = {
      w: 0,
      h: 0,
      x: 0,
      y: 0,
    }
    let temp
    switch (resize.origin) {
      case 'left':
        temp = clientX - resize.msDownX
        bounds.w = -temp
        bounds.x = temp
        break
      case 'right':
        bounds.w = clientX - resize.msDownX
        resize.msDownX += bounds.w
        break
      case 'top':
        temp = clientY - resize.msDownY
        bounds.y = temp
        bounds.h = -temp
        break
      case 'bottom':
        bounds.h = clientY - resize.msDownY
        resize.msDownY += bounds.h
        break
      case 'top-left':
        temp = clientX - resize.msDownX
        bounds.w = -temp
        bounds.x = temp
        temp = clientY - resize.msDownY
        bounds.y = temp
        bounds.h = -temp
        break
      case 'top-right':
        temp = clientY - resize.msDownY
        bounds.y = temp
        bounds.h = -temp
        bounds.w = clientX - resize.msDownX
        resize.msDownX += bounds.w
        break
      case 'bottom-left':
        temp = clientX - resize.msDownX
        bounds.w = -temp
        bounds.x = temp
        bounds.h = clientY - resize.msDownY
        resize.msDownY += bounds.h
        break
      case 'bottom-right':
        bounds.w = clientX - resize.msDownX
        resize.msDownX += bounds.w
        bounds.h = clientY - resize.msDownY
        resize.msDownY += bounds.h
        break
    }
    // console.log(bounds)
    bounds.w = window.innerWidth + bounds.w
    bounds.h = window.innerHeight + bounds.h
    setWindowBounds(bounds)
  }

  const handleDown = (origin: Origin, clientX: number, clientY: number) => {
    handleMouseUp()
    resize.origin = origin
    resize.msDownX = clientX
    resize.msDownY = clientY
  }
  const handleMouseUp = () => {
    resize.origin = null
  }

  const handleMouseDown = (origin: Origin, event: MouseEvent) => {
    handleDown(origin, event.clientX, event.clientY)
  }
  const handleTouchDown = (origin: Origin, event: TouchEvent) => {
    if (event.changedTouches.length) {
      const touch = event.changedTouches[0]
      handleDown(origin, touch.clientX, touch.clientY)
    }
  }

  const handleMouseMove = (event: MouseEvent) => {
    handleMove(event.clientX, event.clientY)
  }
  const handleTouchMove = (event: TouchEvent) => {
    if (event.changedTouches.length) {
      const touch = event.changedTouches[0]
      handleMove(touch.clientX, touch.clientY)
    }
  }


  onMounted(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleMouseUp)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleMouseUp)
  })

  return {
    handleMouseDown,
    handleTouchDown,
  }
}
