import { computed, ref, onBeforeUnmount } from '@common/utils/vueTools'
import { rendererOn, rendererOff } from '@common/rendererIpc'
import { WIN_LYRIC_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { setting } from '@lyric/store/state'

export default () => {
  const isMouseEnter = ref(false)

  const isHoverHide = computed(() => {
    return setting['desktopLyric.isLock'] && setting['desktopLyric.isHoverHide']
  })

  const handleMouseEnterChange: LX.IpcRendererEventListenerParams<boolean> = ({ params: isEnter }) => {
    if (!isHoverHide.value) return
    isMouseEnter.value = isEnter
  }

  rendererOn<boolean>(WIN_LYRIC_RENDERER_EVENT_NAME.mouse_enter_change, handleMouseEnterChange)

  onBeforeUnmount(() => {
    rendererOff(WIN_LYRIC_RENDERER_EVENT_NAME.mouse_enter_change, handleMouseEnterChange)
  })

  return {
    isMouseEnter,
    isHoverHide,
  }
}
