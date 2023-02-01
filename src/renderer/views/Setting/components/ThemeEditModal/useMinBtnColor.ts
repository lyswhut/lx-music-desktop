import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const min_btn_color_ref = ref(null)
  let tools: PickrTools | null

  const initMinBtnColor = (color: string, changed: (color: string) => void, reset: () => void) => {
    if (!min_btn_color_ref.value) return
    tools = pickrTools.create(min_btn_color_ref.value, color, [
      'rgba(59, 194, 178, 1)',
      'rgba(133, 196, 59, 1)',
      'rgba(250, 180, 160, 1)',
      'rgba(116, 87, 152, 1)',
    ], changed, reset)
  }
  const destroyMinBtnColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setMinBtnColor = (color: string) => {
    tools?.setColor(color)
  }

  return {
    min_btn_color_ref,
    initMinBtnColor,
    destroyMinBtnColor,
    setMinBtnColor,
  }
}
