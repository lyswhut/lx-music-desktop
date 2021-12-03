import { createStore } from 'vuex'
// import { createPersistedState, createSharedMutations } from 'vuex-electron'

import defaultState from './state'
import mutations from './mutations'
import modules from './modules'
import getters from './getters'
import actions from './actions'

const isDev = process.env.NODE_ENV === 'development'

const store = createStore({
  strict: isDev,
  state: defaultState,
  modules,
  mutations,
  getters,
  actions,
  // plugins: [createPersistedState(), createSharedMutations()],
})

if (module.hot) {
  module.hot.accept([
    './state',
    './mutations',
    './actions',
    './getters',
  ], () => {
    const newState = require('./state').default
    const newMutations = require('./mutations').default
    const newActions = require('./actions').default
    const newGetters = require('./getters').default

    store.hotUpdate({
      state: newState,
      mutations: newMutations,
      getters: newGetters,
      actions: newActions,
    })
  })
}

export default store
