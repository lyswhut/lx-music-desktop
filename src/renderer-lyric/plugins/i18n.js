/**
 * Vue i18n
 *
 * @library
 *
 * http://kazupon.github.io/vue-i18n/en/
 */

// Lib imports
import { createI18n } from 'vue-i18n'
import { messages } from '@/lang'


const i18n = createI18n({
  locale: 'zh-cn',
  fallbackLocale: 'zh-cn',
  messages,
})

window.i18n = i18n.global

export default i18n
