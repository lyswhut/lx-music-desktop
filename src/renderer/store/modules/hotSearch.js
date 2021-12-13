import music from '../../utils/music'
const sources = []
const sourceList = {}
for (const source of music.sources) {
  const hotSearch = music[source.id].hotSearch
  if (!hotSearch) continue
  sources.push(source)
  sourceList[source.id] = []
}

sources.push({
  id: 'all',
  name: '聚合搜索',
})

// state
const state = {
  list: {
    ...sourceList,
    all: [],
  },
  currentSource: null,
}

// getters
const getters = {
  sources(state, getters, rootState, { sourceNames }) {
    return sources.map(item => ({ id: item.id, name: sourceNames[item.id] }))
  },
  list: state => state.list,
}

// actions
const actions = {
  getList({ state, commit }, source) {
    if (source == 'all') {
      let task = []
      for (const source of sources) {
        if (source.id == 'all') continue
        task.push(
          state.list[source.id].length
            ? Promise.resolve({ source: source.id, list: state.list[source.id] })
            : music[source.id].hotSearch.getList().catch(() => ({ source: source.id, list: [] })),
        )
      }
      Promise.all(task).then(results => commit('setLists', results))
    } else {
      if (!music[source].hotSearch) {
        commit('setList', { source, data: null })
        return Promise.resolve()
      }
      return music[source].hotSearch.getList()
        .then(data => commit('setList', { source, data }))
    }
  },
}

// mitations
const mutations = {
  setList(state, { source, data }) {
    state.list[source] = data ? data.list.slice(0, 20) : []
  },
  setLists(state, lists) {
    let list = new Map()
    for (const source of lists) {
      if (!state.list[source.source].length) state.list[source.source] = source.list.slice(0, 20)
      const sourceList = source.list.slice(0, 10)
      for (let item of sourceList) {
        item = item.trim()
        list.set(item, (list.has(item) ? list.get(item) : 0) + 1)
      }
    }
    list = Array.from(list)
    list.sort((a, b) => a[0].charCodeAt(0) - b[0].charCodeAt(0))
    list.sort((a, b) => b[1] - a[1])
    list = list.map(item => item[0])
    state.list.all = list
  },
  clearList(state, source) {
    state.list[source] = []
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
