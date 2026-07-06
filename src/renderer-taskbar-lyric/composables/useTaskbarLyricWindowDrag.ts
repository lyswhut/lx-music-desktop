import { ref } from 'vue'
import { state } from '../store/state'
import {
  requestTaskbarLyricMenu,
  requestTaskbarLyricShowMainInterface,
  sendTaskbarLyricDragEnd,
  sendTaskbarLyricDragMove,
} from '../utils/ipc'

export const useTaskbarLyricWindowDrag = () => {
  const isDragging = ref(false)
  const isHovering = ref(false)

  let pointerId: number | null = null
  let dragTarget: HTMLElement | null = null
  let startScreenX = 0
  let startOffsetX = 0

  const detachDragListeners = () => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerEnd)
    window.removeEventListener('pointercancel', handlePointerEnd)
    window.removeEventListener('blur', handleWindowBlur)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging.value || event.pointerId !== pointerId) return
    if ((event.buttons & 1) !== 1) {
      stopDragging()
      return
    }

    const offsetX = startOffsetX + (event.screenX - startScreenX)
    sendTaskbarLyricDragMove(offsetX)
  }

  const stopDragging = (event?: PointerEvent) => {
    if (!isDragging.value) return
    if (event && pointerId != null && event.pointerId !== pointerId) return
    isDragging.value = false
    if (pointerId != null && dragTarget?.hasPointerCapture(pointerId)) {
      dragTarget.releasePointerCapture(pointerId)
    }
    pointerId = null
    dragTarget = null
    sendTaskbarLyricDragEnd()
    detachDragListeners()
  }

  const handlePointerEnd = (event: PointerEvent) => {
    stopDragging(event)
  }

  const handleVisibilityChange = () => {
    if (document.hidden) stopDragging()
  }

  const handleWindowBlur = () => {
    stopDragging()
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    stopDragging()
    event.preventDefault()
    isDragging.value = true
    pointerId = event.pointerId
    dragTarget = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
    dragTarget?.setPointerCapture(pointerId)
    startScreenX = event.screenX
    startOffsetX = state.offsetX
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)
    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  const handlePointerEnter = () => {
    isHovering.value = true
  }

  const handlePointerLeave = () => {
    isHovering.value = false
  }

  const handleContextMenu = () => {
    stopDragging()
    requestTaskbarLyricMenu()
  }

  const handleDoubleClick = () => {
    stopDragging()
    requestTaskbarLyricShowMainInterface()
  }

  return {
    isDragging,
    isHovering,
    handlePointerDown,
    handlePointerEnter,
    handlePointerLeave,
    handleContextMenu,
    handleDoubleClick,
    stopDragging,
  }
}
