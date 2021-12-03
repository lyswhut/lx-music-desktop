import { createApp } from 'vue'

import i18n from './plugins/i18n'

import mountComponents from './components'

import App from './App'

import '../common/error'


const app = createApp(App)
app.use(i18n)
mountComponents(app)
app.mount('#root')
