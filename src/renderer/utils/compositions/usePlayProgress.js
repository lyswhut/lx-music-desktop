import { ref, onBeforeUnmount, toRef } from '@renderer/utils/vueTools'
import { player as eventPlayerNames } from '@renderer/event/names'
import { playProgress } from '@renderer/core/share/playProgress'

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

  window.eventHub.on(eventPlayerNames.activeTransition, handleActiveTransition)

  onBeforeUnmount(() => {
    window.eventHub.off(eventPlayerNames.activeTransition, handleActiveTransition)
  })

  return {
    nowPlayTimeStr,
    maxPlayTimeStr,
    progress,
    isActiveTransition,
    handleTransitionEnd,
  }
}
