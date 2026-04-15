import { computed, ref, onBeforeUnmount } from '@common/utils/vueTools'
import { setting } from '@lyric/store/state'
import { sendMouseEnterLeave, onMouseEnterLeave } from '@lyric/utils/ipc'

export default () => {
  const isMouseEnter = ref(false)

  const isHoverHide = computed(() => {
    return setting['desktopLyric.isHoverHide'] && isMouseEnter.value
  })

  const handleMouseMove = () => {
    handleMouseEnter()
  }
  const handleMouseEnter = () => {
    if (isMouseEnter.value) return
    isMouseEnter.value = true
    sendMouseEnterLeave(true)
  }
  const handleMouseLeave = () => {
    if (!isMouseEnter.value) return
    isMouseEnter.value = false
    sendMouseEnterLeave(false)
  }

  const removeMouseEnterLeaveListener = onMouseEnterLeave(({ params: isEnter }) => {
    isMouseEnter.value = isEnter
  })
  document.body.addEventListener('mousemove', handleMouseMove)
  document.body.addEventListener('mouseenter', handleMouseEnter)
  document.body.addEventListener('mouseleave', handleMouseLeave)

  onBeforeUnmount(() => {
    removeMouseEnterLeaveListener()
    document.body.removeEventListener('mousemove', handleMouseMove)
    document.body.removeEventListener('mouseenter', handleMouseEnter)
    document.body.removeEventListener('mouseleave', handleMouseLeave)
  })

  return isHoverHide
}
