import music from '../../utils/music'
const sources = [{
  id: 'all',
  name: '聚合搜索',
}]
const sourceList = {
  all: {
    page: 1,
    allPage: 0,
    limit: 30,
    total: 0,
    list: [],
  },
}
const sourceMaxPage = {}
for (const source of music.sources) {
  const musicSearch = music[source.id].musicSearch
  if (!musicSearch) continue
  sources.push(source)
  sourceList[source.id] = {
    page: 1,
    allPage: 0,
    limit: 30,
    total: 0,
    list: [],
  }
  sourceMaxPage[source.id] = 0
}

// state
const state = {
  sourceList,
  list: [],
  text: '',
  page: 1,
  limit: 30,
  allPage: 1,
  total: 0,
  sourceMaxPage,
}

// getters
const getters = {
  sources: () => sources,
  sourceList: state => state.sourceList || [],
  searchText: state => state.text,
  allList: state => ({ list: state.list, allPage: state.allPage, total: state.total, limit: state.limit, sourceMaxPage: state.sourceMaxPage }),
}

// actions
const actions = {
  search({ commit, rootState }, { text, page, limit }) {
    if (rootState.setting.search.searchSource == 'all') {
      let task = []
      for (const source of sources) task.push(music[source.id].musicSearch.search(text, page, limit))
      Promise.all(task).then((...results) => {
        commit('setLists', { results, text, page })
      })
    } else {
      return music[rootState.setting.search.searchSource].musicSearch.search(text, page, limit)
        .then(data => commit('setList', { list: data.list, allPage: data.allPage, total: data.total, text, page }))
    }
  },
}

// mitations
const mutations = {
  setList(state, datas) {
    state.list = datas.list
    state.total = datas.total
    state.allPage = datas.allPage
    state.page = datas.page
    state.text = datas.text
  },
  setLists(state, { results, text, page }) {
    let pages = []
    let total = 0
    let limit = 0
    for (const source of results) {
      state[source.source].list = source.list
      state[source.source].total = source.total
      state[source.source].allPage = source.allPage
      state[source.source].page = page
      pages.push(source.allPage)
      total += source.total
      limit += source.limit
    }
    state.allPage = Math.max(...pages)
    state.total = total
    state.limit = limit
    state.text = text
  },
  clearList(state) {
    for (const source of state.list) {
      source.list.length = 0
      source.list.page = 0
      source.list.allPage = 0
      source.list.total = 0
    }
    state.text = ''
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
