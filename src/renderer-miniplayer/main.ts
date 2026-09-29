import { createApp } from 'vue'

import App from './App.vue'

import '@root/common/error'

window.ELECTRON_DISABLE_SECURITY_WARNINGS = process.env.ELECTRON_DISABLE_SECURITY_WARNINGS

const app = createApp(App)
app.mount('#root')
