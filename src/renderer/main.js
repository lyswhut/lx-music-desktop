import '../common/error'
import { createApp } from 'vue'
// import { sync } from 'vuex-router-sync'

import './event'

// Components
import mountComponents from './components'

// Plugins
import initPlugins from './plugins'
import i18n from './plugins/i18n'

import App from './App'
import router from './route'
import store from './store'


import { getSetting } from './utils'
import { langList } from '@/lang'
import { rendererSend, NAMES } from '../common/ipc'

// sync(store, router)

window.ELECTRON_DISABLE_SECURITY_WARNINGS = process.env.ELECTRON_DISABLE_SECURITY_WARNINGS


getSetting().then(({ setting, version }) => {
  global.appSetting = setting
  // Set language automatically
  if (!window.i18n.availableLocales.includes(setting.langId)) {
    let langId = null
    let locale = window.navigator.language.toLocaleLowerCase()
    if (window.i18n.availableLocales.includes(locale)) {
      langId = locale
    } else {
      for (const lang of langList) {
        if (lang.alternate == locale) {
          langId = lang.locale
          break
        }
      }
      if (langId == null) langId = 'en-us'
    }
    setting.langId = langId
    rendererSend(NAMES.mainWindow.set_app_setting, setting)
    console.log('Set lang', setting.langId)
  }
  window.i18n.locale = setting.langId
  store.commit('setSetting', setting)
  store.commit('setSettingVersion', version)

  const app = createApp(App)
  app.use(router)
    .use(store)
    .use(i18n)
  initPlugins(app)
  mountComponents(app)
  app.mount('#root')
})

