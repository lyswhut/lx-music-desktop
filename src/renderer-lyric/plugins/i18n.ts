import type { I18n } from '@root/lang'
import { createI18n, i18nPlugin, useI18n } from '@root/lang'

window.i18n = createI18n()

export {
  i18nPlugin,
  useI18n,
}

export type { I18n }
