import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const close_btn_color_ref = ref(null)
  let tools: PickrTools | null

  const initCloseBtnColor = (color: string, changed: (color: string) => void, reset: () => void) => {
    if (!close_btn_color_ref.value) return
    tools = pickrTools.create(close_btn_color_ref.value, color, [
      'rgba(59, 194, 178, 1)',
      'rgba(133, 196, 59, 1)',
      'rgba(250, 180, 160, 1)',
      'rgba(104.51, 72.55, 107.98, 1)',
    ], changed, reset)
  }
  const destroyCloseBtnColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setCloseBtnColor = (color: string) => {
    tools?.setColor(color)
  }

  return {
    close_btn_color_ref,
    initCloseBtnColor,
    destroyCloseBtnColor,
    setCloseBtnColor,
  }
}
