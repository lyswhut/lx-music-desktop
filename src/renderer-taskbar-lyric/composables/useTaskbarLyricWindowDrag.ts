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
  let startScreenX = 0
  let startOffsetX = 0

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging.value || event.pointerId !== pointerId) return
    const offsetX = startOffsetX + (event.screenX - startScreenX)
    sendTaskbarLyricDragMove(offsetX)
  }

  const stopDragging = (event?: PointerEvent) => {
    if (!isDragging.value) return
    if (event && pointerId != null && event.pointerId !== pointerId) return
    isDragging.value = false
    pointerId = null
    sendTaskbarLyricDragEnd()
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', stopDragging)
    window.removeEventListener('pointercancel', stopDragging)
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    isDragging.value = true
    pointerId = event.pointerId
    startScreenX = event.screenX
    startOffsetX = state.offsetX
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
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
