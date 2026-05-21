import { createApp } from 'vue'

import App from './App.vue'
import { patchState } from './store/state'
import { onTaskbarLyricState, requestTaskbarLyricRefresh } from './utils/ipc'

onTaskbarLyricState((taskbarLyricState) => {
  patchState(taskbarLyricState)
})

requestTaskbarLyricRefresh()

createApp(App).mount('#root')
