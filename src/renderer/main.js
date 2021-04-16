import Vue from 'vue'
import { sync } from 'vuex-router-sync'

import './event'

// Components
import './components'

// Plugins
import './plugins'
import i18n from './plugins/i18n'

import App from './App'
import router from './route'
import store from './store'

import '../common/error'

import { getSetting } from './utils'
import languageList from '@renderer/lang/languages.json'
import { rendererSend, NAMES } from '../common/ipc'

sync(store, router)

Vue.config.productionTip = false
Vue.config.devtools = process.env.NODE_ENV === 'development'

getSetting().then(({ setting, version }) => {
  // Set language automatically
  if (!window.i18n.availableLocales.includes(setting.langId)) {
    let langId = null
    let locale = window.navigator.language.toLocaleLowerCase()
    if (window.i18n.availableLocales.includes(locale)) {
      langId = locale
    } else {
      for (const lang of languageList) {
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

  new Vue({
    router,
    store,
    i18n,
    el: '#root',
    render: h => h(App),
  })

  // window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = app.constructor
})

