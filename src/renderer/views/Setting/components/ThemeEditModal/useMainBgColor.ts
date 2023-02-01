import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const main_bg_color_ref = ref(null)
  let tools: PickrTools | null

  const initMainBgColor = (color: string, changed: (color: string) => void, reset: () => void) => {
    if (!main_bg_color_ref.value) return
    tools = pickrTools.create(main_bg_color_ref.value, color, [
      'rgba(255, 255, 255, 1)',
      'rgba(19, 19, 19, 0.9)',
      'rgba(255, 255, 255, 0.9)',
      'rgba(255, 255, 255, 0.8)',
      'rgba(25.82, 23.65, 46.6, 0.54)',
    ], changed, reset)
  }
  const destroyMainBgColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setMainBgColor = (color: string) => {
    tools?.setColor(color)
  }

  return {
    main_bg_color_ref,
    initMainBgColor,
    destroyMainBgColor,
    setMainBgColor,
  }
}
