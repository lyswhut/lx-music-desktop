import { createApp } from 'vue'

import { i18nPlugin } from './plugins/i18n'

import mountComponents from './components'

import App from './App.vue'

import '@root/common/error'
import { getSetting, onMainWindowInited, onSettingChanged, sendConnectMainWindowEvent } from './utils/ipc'
import { initSetting, mergeSetting } from './store/action'
import { init as initMainWindowChannel } from './core/mainWindowChannel'

window.ELECTRON_DISABLE_SECURITY_WARNINGS = process.env.ELECTRON_DISABLE_SECURITY_WARNINGS

void getSetting().then((setting) => {
  // window.lx.appSetting = setting
  // Set language automatically
  const languageId = setting['common.langId']
  if (window.i18n.locale !== languageId && languageId != null) window.i18n.setLanguage(languageId)

  // store.commit('setSetting', setting)
  initSetting(setting)

  onSettingChanged(({ params: setting }) => {
    // console.log('onSettingChanged', setting)
    mergeSetting(setting)
  })
  onMainWindowInited(() => {
    sendConnectMainWindowEvent()
  })
  initMainWindowChannel()

  const app = createApp(App)
  app.use(i18nPlugin)
  mountComponents(app)
  app.mount('#root')
})
