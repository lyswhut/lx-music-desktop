import { ref } from '@common/utils/vueTools'
import { pickrTools, type PickrTools } from '@renderer/utils/pickrTools'

export default () => {
  const primary_color_ref = ref(null)
  let tools: PickrTools | null

  const initMainColor = (color: string, changed: (color: string) => void) => {
    if (!primary_color_ref.value) return
    tools = pickrTools.create(primary_color_ref.value, color, [
      'rgba(77, 175, 124, 1)',
      'rgba(52, 152, 219, 1)',
      'rgba(77, 131, 175, 1)',
      'rgba(245, 171, 53, 1)',
      'rgba(214, 69, 65, 1)',
      'rgba(241, 130, 141, 1)',
      'rgba(155, 89, 182, 1)',
      'rgba(108, 122, 137, 1)',
      'rgba(51, 110, 123, 1)',
      'rgba(79, 98, 208, 1)',
      'rgba(150, 150, 150, 1)',
      'rgba(74, 55, 82, 1)',
      'rgba(87, 144, 167, 1)',
      'rgba(192, 57, 43, 1)',
      'rgba(113.52, 107.21, 166.13, 1)',
    ], changed, () => {})
  }
  const destroyMainColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }

  return {
    primary_color_ref,
    initMainColor,
    destroyMainColor,
  }
}
