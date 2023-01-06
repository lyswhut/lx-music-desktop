import { computed, ref } from '@common/utils/vueTools'
import { setting } from '@lyric/store/state'

let mouseCheckTools: {
  x: number
  y: number
  preX: number
  preY: number
  timeout: NodeJS.Timeout | null
  handleCheck: (setShow: () => void) => void
  handleMove: (x: number, y: number, setShow: () => void) => void
  startTimeout: (setShow: () => void) => void
  stopTimeout: () => void
} = {
  x: 0,
  y: 0,
  preX: 0,
  preY: 0,
  timeout: null,
  handleCheck(setShow: () => void) {
    let xDiff = Math.abs(this.x - this.preX)
    let yDiff = Math.abs(this.y - this.preY)
    if (xDiff > 8) {
      if (this.x > this.preX) {
        if (this.x + xDiff * 1.25 > window.innerWidth - 16) {
          setShow()
          return
        }
      } else {
        if (this.x - xDiff * 1.25 < 8) {
          setShow()
          return
        }
      }
    }
    if (yDiff > 8) {
      if (this.y > this.preY) {
        if (this.y + yDiff * 1.25 > window.innerHeight - 16) {
          setShow()
        }
      } else {
        if (this.y - yDiff * 1.25 < 8) {
          setShow()
        }
      }
    }

    // setShow(false)
  },
  handleMove(x: number, y: number, setShow: () => void) {
    // console.log(x, y, this.x, this.y)
    this.preX = this.x
    this.preY = this.y
    this.x = x
    this.y = y
    this.startTimeout(setShow)
  },
  startTimeout(setShow: () => void) {
    this.stopTimeout()
    this.timeout = setTimeout(this.handleCheck.bind(this), 200, setShow)
  },
  stopTimeout() {
    if (!this.timeout) return
    clearTimeout(this.timeout)
    this.timeout = null
  },
}

export default () => {
  const isMouseEnter = ref(false)

  const isHoverHide = computed(() => {
    return setting['desktopLyric.isLock'] && setting['desktopLyric.isHoverHide']
  })

  const handleMouseMoveMain = (event: MouseEvent) => {
    if (!isHoverHide.value) return
    handleMouseEnter()
    mouseCheckTools.handleMove(event.clientX, event.clientY, () => {
      handleMouseLeave()
    })
  }
  const handleMouseEnter = () => {
    if (!isHoverHide.value || isMouseEnter.value) return
    isMouseEnter.value = true
  }
  const handleMouseLeave = () => {
    if (!isHoverHide.value) return
    isMouseEnter.value = false
    mouseCheckTools.stopTimeout()
  }

  return {
    isMouseEnter,
    isHoverHide,
    handleMouseMoveMain,
  }
}
