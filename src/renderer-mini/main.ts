import { createApp } from 'vue'
import App from './App.vue'
import { init as initMainWindowChannel } from './core/mainWindowChannel'

window.ELECTRON_DISABLE_SECURITY_WARNINGS = process.env.ELECTRON_DISABLE_SECURITY_WARNINGS

initMainWindowChannel()

const app = createApp(App)
app.mount('#root')