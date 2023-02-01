import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const aside_font_color_ref = ref(null)
  let tools: PickrTools | null

  const initAsideFontColor = (color: string, changed: (color: string) => void, reset: () => void) => {
    if (!aside_font_color_ref.value) return
    tools = pickrTools.create(aside_font_color_ref.value, color, null, changed, reset)
  }
  const destroyAsideFontColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setAsideFontColor = (color: string) => {
    tools?.setColor(color)
  }

  return {
    aside_font_color_ref,
    initAsideFontColor,
    destroyAsideFontColor,
    setAsideFontColor,
  }
}
