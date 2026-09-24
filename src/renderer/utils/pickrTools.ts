import { throttle } from '@common/utils/common'
import Pickr from '@simonwep/pickr'
import '@simonwep/pickr/dist/themes/classic.min.css'

export interface PickrTools {
  pickr: Pickr | null
  create: (dom: HTMLElement, color: string, swatches: string[] | null, change: (color: string) => void, reset?: () => void) => PickrTools
  destroy: () => void
  setColor: (color: string) => void
}

export const pickrTools: PickrTools = {
  pickr: null,
  create(dom, color, swatches, change, reset) {
    const pickrTools: PickrTools = Object.create(this)

    pickrTools.pickr = Pickr.create({
      el: dom,
      default: color,
      theme: 'classic', // or 'monolith', or 'nano'
      defaultRepresentation: 'RGBA',
      autoReposition: false,
      closeWithKey: '',
      appClass: 'color-picker',
      comparison: false,
      useAsButton: true,

      swatches,

      components: {

        // Main components
        preview: true,
        opacity: true,
        hue: true,

        // Input / output Options
        interaction: {
          hex: true,
          rgba: true,
          input: true,
          cancel: true,
          // save: true,
        },
      },

      i18n: {
        // Strings visible in the UI
        'ui:dialog': ' ',
        'btn:toggle': window.i18n.t('theme_edit_modal__pick_color'),
        'btn:swatch': ' ',
        'btn:last-color': window.i18n.t('theme_edit_modal__pick_last_color'),
        'btn:save': window.i18n.t('theme_edit_modal__pick_save'),
        'btn:cancel': window.i18n.t('theme_edit_modal__pick_cancel'),

        // Strings used for aria-labels
        'aria:btn:save': ' ',
        'aria:btn:cancel': ' ',
        'aria:input': ' ',
        'aria:palette': ' ',
        'aria:hue': '',
        'aria:opacity': ' ',
      },
    })

    // pickr 1.10.x 起 default 配置色不再生效：其初始化回放的是内部 _color（恒为初始黑色），
    // 且该回放被推迟到选择器可见时的 rAF 中。创建后立即显式补设一次，
    // 否则预览色块与输入框默认显示为黑色，直到手动重置。change 仅由用户交互触发，
    // 此处调用不会产生设置回写。
    pickrTools.pickr.setColor(color)

    let swatchselectColor: any

    const throttleChange = throttle((color: any, source: string) => {
      if (source == 'swatch' && swatchselectColor !== color) return
      change(color.toRGBA().toString())
    })
    pickrTools.pickr.on('swatchselect', (color: any) => {
      swatchselectColor = color
    }).on('change', throttleChange).on('cancel', () => {
      console.log('cancel')
      change(color)
      reset?.()
    })

    return pickrTools
  },
  destroy() {
    if (!this.pickr) return
    this.pickr.destroyAndRemove()
    this.pickr = null
  },
  setColor(color) {
    this.pickr?.setColor(color)
  },
}
