import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const font_color_ref = ref(null)
  let tools: PickrTools | null

  const initFontColor = (color: string, changed: (color: string) => void) => {
    if (!font_color_ref.value) return
    tools = pickrTools.create(font_color_ref.value, color, [
      'rgba(33, 33, 33, 1)',
      'rgba(229, 229, 229, 1)',
    ], changed, () => {})
  }
  const destroyFontColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }

  return {
    font_color_ref,
    initFontColor,
    destroyFontColor,
  }
}
