import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const hide_btn_color_ref = ref(null)
  let tools: PickrTools | null

  const initHideBtnColor = (color: string, changed: (color: string) => void, reset: () => void) => {
    if (!hide_btn_color_ref.value) return
    tools = pickrTools.create(hide_btn_color_ref.value, color, [
      'rgba(59, 194, 178, 1)',
      'rgba(133, 196, 59, 1)',
      'rgba(250, 180, 160, 1)',
      'rgba(77.46, 103.73, 151.81, 1)',
    ], changed, reset)
  }
  const destroyHideBtnColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setHideBtnColor = (color: string) => {
    tools?.setColor(color)
  }

  return {
    hide_btn_color_ref,
    initHideBtnColor,
    destroyHideBtnColor,
    setHideBtnColor,
  }
}
