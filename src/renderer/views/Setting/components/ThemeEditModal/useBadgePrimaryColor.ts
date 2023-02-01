import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const badge_primary_color_ref = ref(null)
  let tools: PickrTools | null

  const initBadgePrimaryColor = (color: string, changed: (color: string) => void, reset: () => void) => {
    if (!badge_primary_color_ref.value) return
    tools = pickrTools.create(badge_primary_color_ref.value, color, null, changed, reset)
  }
  const destroyBadgePrimaryColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setBadgePrimaryColor = (color: string) => {
    tools?.setColor(color)
  }

  return {
    badge_primary_color_ref,
    initBadgePrimaryColor,
    destroyBadgePrimaryColor,
    setBadgePrimaryColor,
  }
}
