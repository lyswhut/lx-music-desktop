import { ref, onBeforeUnmount, onMounted } from '@common/utils/vueTools'

export default () => {
  const dom_lrc_select_content = ref()
  const handle_key_mod_a_down = ({ event }) => {
    if (event.target.tagName == 'INPUT' || !dom_lrc_select_content.value || document.activeElement != dom_lrc_select_content.value) return
    event.preventDefault()
    if (event.repeat) return

    let selection = window.getSelection()
    let range = document.createRange()
    range.selectNodeContents(dom_lrc_select_content.value)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  onMounted(() => {
    window.key_event.on('key_mod+a_down', handle_key_mod_a_down)
  })
  onBeforeUnmount(() => {
    window.key_event.off('key_mod+a_down', handle_key_mod_a_down)
  })

  return dom_lrc_select_content
}
