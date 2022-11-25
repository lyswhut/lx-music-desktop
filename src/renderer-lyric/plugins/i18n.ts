import type { I18n } from '@/lang'
import { createI18n, i18nPlugin, useI18n } from '@/lang'

window.i18n = createI18n()

export {
  i18nPlugin,
  useI18n,
}

export type { I18n }
