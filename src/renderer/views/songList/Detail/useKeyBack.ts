import { onBeforeUnmount, onMounted } from '@common/utils/vueTools'

export default (handleBack: () => void) => {
  const handle_key_backspace_down = (event: LX.KeyDownEevent) => {
    if (event.event && (event.event.repeat || (event.event.target as HTMLElement).classList.contains('key-bind'))) return
    handleBack()
  }
  onMounted(() => {
    window.key_event.on('key_backspace_down', handle_key_backspace_down)
  })

  onBeforeUnmount(() => {
    window.key_event.off('key_backspace_down', handle_key_backspace_down)
  })
}
