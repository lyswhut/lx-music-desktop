import Vue from 'vue'

import i18n from './plugins/i18n'

import './components'

import App from './App'

import '../common/error'

Vue.config.productionTip = false

new Vue({
  i18n,
  el: '#root',
  render: h => h(App),
})
