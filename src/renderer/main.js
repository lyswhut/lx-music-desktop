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

sync(store, router)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  i18n,
  el: '#root',
  render: h => h(App),
})
