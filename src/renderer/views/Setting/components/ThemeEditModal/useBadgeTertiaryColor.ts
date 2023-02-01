import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const badge_tertiary_color_ref = ref(null)
  let tools: PickrTools | null

  const initBadgeTertiaryColor = (color: string, changed: (color: string) => void, reset: () => void) => {
    if (!badge_tertiary_color_ref.value) return
    tools = pickrTools.create(badge_tertiary_color_ref.value, color, [
      'rgba(231, 170, 54, 1)',
      'rgba(92, 191, 155, 1)',
      'rgba(54, 196, 231, 1)',
      'rgba(158, 212, 88, 1)',
      'rgba(223, 187, 107, 1)',
      'rgba(245, 182, 132, 1)',
      'rgba(229, 163, 159, 1)',
      'rgba(177, 155, 159, 1)',
      'rgba(99, 118, 162, 1)',
      'rgba(176, 128, 219, 1)',
      'rgba(175, 148, 121, 1)',
      'rgba(223, 187, 107, 1)',
      'rgba(49.11, 161.05, 135.64, 1)',
    ], changed, reset)
  }
  const destroyBadgeTertiaryColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setBadgeTertiaryColor = (color: string) => {
    tools?.setColor(color)
  }

  return {
    badge_tertiary_color_ref,
    initBadgeTertiaryColor,
    destroyBadgeTertiaryColor,
    setBadgeTertiaryColor,
  }
}
