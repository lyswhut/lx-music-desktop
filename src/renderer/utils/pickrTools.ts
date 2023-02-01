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
