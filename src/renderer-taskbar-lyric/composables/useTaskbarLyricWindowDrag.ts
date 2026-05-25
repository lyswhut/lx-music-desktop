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

  let startClientX = 0
  let startOffsetX = 0

  const detachDragListeners = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopDragging)
    window.removeEventListener('blur', stopDragging)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.value) return
    const offsetX = startOffsetX + (event.clientX - startClientX)
    sendTaskbarLyricDragMove(offsetX)
  }

  const stopDragging = () => {
    if (!isDragging.value) return
    isDragging.value = false
    sendTaskbarLyricDragEnd()
    detachDragListeners()
  }

  const handleVisibilityChange = () => {
    if (document.hidden) stopDragging()
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    stopDragging()
    event.preventDefault()
    isDragging.value = true
    startClientX = event.clientX
    startOffsetX = state.offsetX
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopDragging)
    window.addEventListener('blur', stopDragging)
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
