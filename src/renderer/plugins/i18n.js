/**
 * Vue i18n
 *
 * @library
 *
 * http://kazupon.github.io/vue-i18n/en/
 */

// Lib imports
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import messages from '@renderer/lang'

Vue.use(VueI18n)

const i18n = window.i18n = new VueI18n({
  locale: 'zh-cn',
  fallbackLocale: 'zh-cn',
  messages,
})

export default i18n
