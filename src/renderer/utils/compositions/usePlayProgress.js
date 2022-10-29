import { ref, onBeforeUnmount, toRef } from '@common/utils/vueTools'
import { playProgress } from '@renderer/store/player/playProgress'

export default () => {
  const isActiveTransition = ref(false)
  const progress = toRef(playProgress, 'progress')
  const nowPlayTimeStr = toRef(playProgress, 'nowPlayTimeStr')
  const maxPlayTimeStr = toRef(playProgress, 'maxPlayTimeStr')

  const handleTransitionEnd = () => {
    isActiveTransition.value = false
  }
  const handleActiveTransition = () => {
    isActiveTransition.value = true
  }

  window.app_event.on('activePlayProgressTransition', handleActiveTransition)

  onBeforeUnmount(() => {
    window.app_event.off('activePlayProgressTransition', handleActiveTransition)
  })

  return {
    nowPlayTimeStr,
    maxPlayTimeStr,
    progress,
    isActiveTransition,
    handleTransitionEnd,
  }
}
