import { type App, ref } from 'vue'
import { messages } from './index'
import type { Messages, Message } from './index'

type TranslateValues = Record<string, string | number | boolean>

type Langs = keyof Messages

export declare interface I18n {
  locale: Langs
  fallbackLocale: Langs
  availableLocales: Langs[]
  messages: Messages
  message: Message
  setLanguage: (locale: Langs) => void
  fillMessage: (message: string, val: TranslateValues) => string
  getMessage: (key: keyof Message, val?: TranslateValues) => string
  t: (key: keyof Message, val?: TranslateValues) => string
}

const locale = ref<Langs>('zh-cn')

let i18n: I18n


const trackReactivityValues = (): any => {
  return locale.value
}

const i18nPlugin = {
  install: (app: App) => {
    // inject a globally available $translate() method
    app.config.globalProperties.$t = (key: keyof Message, val?: TranslateValues): string => {
      // retrieve a nested property in `options`
      // using `key` as the path
      // return key.split('.').reduce((o, i) => {
      //   if (o) return o[i]
      // }, options)
      trackReactivityValues()
      return i18n.getMessage(key, val)
    }
  },
}

const useI18n = () => {
  return (key: keyof Message, val?: TranslateValues): string => {
    trackReactivityValues()
    return i18n.getMessage(key, val)
  }
}

const setLanguage = (lang: Langs) => {
  i18n.setLanguage(lang)
}

const createI18n = (): I18n => {
  return i18n = {
    locale: locale.value,
    fallbackLocale: 'zh-cn',
    availableLocales: Object.keys(messages) as Langs[],
    messages,
    message: messages[locale.value],
    setLanguage(_locale: Langs) {
      this.locale = _locale
      this.message = messages[_locale]
      locale.value = _locale
    },
    fillMessage(message: string, vals: TranslateValues): string {
      for (const [key, val] of Object.entries(vals)) {
        message = message.replaceAll(`{${key}}`, String(val))
      }
      return message
    },
    getMessage(key: keyof Message, val?: TranslateValues): string {
      let targetMessage = this.message[key] ?? this.messages[this.fallbackLocale][key] ?? key
      return val ? this.fillMessage(targetMessage, val) : targetMessage
    },
    t(key: keyof Message, val?: TranslateValues): string {
      trackReactivityValues()
      return this.getMessage(key, val)
    },
  }
}


export {
  i18nPlugin,
  setLanguage,
  useI18n,
  createI18n,
}
