import { onMounted, onBeforeUnmount, ref } from '@common/utils/vueTools'

export default (name: string) => {
  const keyDown = ref(false)
  const down = `key_${name}_down`
  const up = `key_${name}_up`

  const handle_key_down = (event: LX.KeyDownEevent) => {
    if (!keyDown.value) {
      // console.log(event)
      switch ((event.event?.target as HTMLElement).tagName) {
        case 'INPUT':
        case 'SELECT':
        case 'TEXTAREA':
          return
        default: if ((event.event?.target as HTMLElement).isContentEditable) return
      }

      keyDown.value = true
    }
  }

  const handle_key_up = () => {
    keyDown.value &&= false
  }

  onMounted(() => {
    window.key_event.on(down, handle_key_down)
    window.key_event.on(up, handle_key_up)
  })

  onBeforeUnmount(() => {
    window.key_event.off(down, handle_key_down)
    window.key_event.off(up, handle_key_up)
  })

  return keyDown
}
