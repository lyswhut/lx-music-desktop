import music from '../../utils/music'
const sourceList = {}
const sources = []
const cache = new Map()
for (const source of music.sources) {
  const leaderboard = music[source.id].leaderboard
  if (!leaderboard || !leaderboard.getBoards) continue
  sourceList[source.id] = []
  sources.push(source)
}

// state
const state = {
  boards: sourceList,
  list: [],
  total: 0,
  page: 1,
  limit: 30,
  key: null,
}

// getters
const getters = {
  sources(state, getters, rootState, { sourceNames }) {
    return sources.map(item => ({ id: item.id, name: sourceNames[item.id] }))
  },
  boards(state) {
    return state.boards
  },
  list(state) {
    return state.list
  },
  info(state) {
    return {
      total: state.total,
      limit: state.limit,
      page: state.page,
    }
  },
}

// actions
const actions = {
  getBoardsList({ state, rootState, commit }) {
    // if (state.boards.length)
    let source = rootState.setting.leaderboard.source
    // let tabId = rootState.setting.leaderboard.tabId
    // let key = `${source}${tabId}${page}`
    // if (state.list.length && state.key == key) return true
    // commit('clearList')
    if (state.boards[source].length) return
    return music[source].leaderboard.getBoards().then(result => commit('setBoardsList', { boards: result, source }))
  },
  getList({ state, rootState, commit }, page) {
    // let source = rootState.setting.leaderboard.source
    let tabId = rootState.setting.leaderboard.tabId
    let [source, bangId] = tabId.split('__')
    let key = `${source}${tabId}${page}`
    if (state.list.length && state.key == key) return Promise.resolve()
    commit('clearList')
    // return (
    //   cache.has(key)
    //     ? Promise.resolve(cache.get(key))
    //     : music[source].leaderboard.getList(bangId, page)
    // ).then(result => commit('setList', { result, key }))
    return music[source].leaderboard.getList(bangId, page).then(result => commit('setList', { result, key }))
  },
  getListAll({ state, rootState }, id) {
    // console.log(source, id)
    let [source, bangId] = id.split('__')
    const loadData = (id, page) => {
      let key = `${source}${id}${page}`
      return cache.has(key)
        ? Promise.resolve(cache.get(key))
        : music[source].leaderboard.getList(bangId, page).then(result => {
          cache.set(key, result)
          return result
        })
    }
    return loadData(id, 1).then(result => {
      if (result.total <= result.limit) return result.list

      let maxPage = Math.ceil(result.total / result.limit)
      const load = (loadPage = 2) => {
        return loadPage == maxPage
          ? loadData(id, loadPage).then(result => result.list)
          : loadData(id, loadPage).then(result1 => load(++loadPage).then(result2 => [...result1.list, ...result2]))
      }
      return load().then(result2 => [...result.list, ...result2])
    })
  },
}

// mitations
const mutations = {
  setBoardsList(state, { boards, source }) {
    state.boards[source] = boards.list
  },
  setList(state, { result, key }) {
    state.list = result.list
    state.total = result.total
    state.limit = result.limit
    state.page = result.page
    state.key = key
    cache.set(key, result)
  },
  clearList(state) {
    state.list = []
    state.total = 0
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
