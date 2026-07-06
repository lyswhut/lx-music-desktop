import { createApp } from 'vue'

import App from './App.vue'
import { patchState } from './store/state'
import { onTaskbarLyricState, requestTaskbarLyricRefresh } from './utils/ipc'

const removeTaskbarLyricStateListener = onTaskbarLyricState((taskbarLyricState) => {
  patchState(taskbarLyricState)
})

requestTaskbarLyricRefresh()

createApp(App).mount('#root')

window.addEventListener('beforeunload', () => {
  removeTaskbarLyricStateListener()
})
