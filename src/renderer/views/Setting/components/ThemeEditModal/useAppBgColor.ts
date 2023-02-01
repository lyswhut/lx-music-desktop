import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const app_bg_color_ref = ref(null)
  let tools: PickrTools | null

  const initAppBgColor = (color: string, changed: (color: string) => void, reset: () => void) => {
    if (!app_bg_color_ref.value) return
    tools = pickrTools.create(app_bg_color_ref.value, color, [
      'rgba(255, 255, 255, 0)',
      'rgba(255, 255, 255, 0.15)',
      'rgba(21.34, 18.92, 44.61, 0.81)',
    ], changed, reset)
  }
  const destroyAppBgColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setAppBgColor = (color: string) => {
    tools?.setColor(color)
  }

  return {
    app_bg_color_ref,
    initAppBgColor,
    destroyAppBgColor,
    setAppBgColor,
  }
}
