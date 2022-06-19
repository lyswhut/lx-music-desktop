import { onMounted, onBeforeUnmount, ref } from '@renderer/utils/vueTools'

export default name => {
  const keyDown = ref(false)
  const down = `key_${name}_down`
  const up = `key_${name}_up`

  const handle_key_down = event => {
    if (!keyDown.value) {
      // console.log(event)
      switch (event.event.target.tagName) {
        case 'INPUT':
        case 'SELECT':
        case 'TEXTAREA':
          return
        default: if (event.event.target.isContentEditable) return
      }

      keyDown.value = true
    }
  }

  const handle_key_up = () => {
    if (keyDown.value) keyDown.value = false
  }

  onMounted(() => {
    window.eventHub.on(down, handle_key_down)
    window.eventHub.on(up, handle_key_up)
  })

  onBeforeUnmount(() => {
    window.eventHub.off(down, handle_key_down)
    window.eventHub.off(up, handle_key_up)
  })

  return keyDown
}
