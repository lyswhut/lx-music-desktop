import music from '../../utils/music'
const sources = []
const sourceList = {}
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

sources.push({
  id: 'all',
  name: '聚合搜索',
})

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
  allList: state => ({ list: state.list, allPage: state.allPage, page: state.page, total: state.total, limit: state.limit, sourceMaxPage: state.sourceMaxPage }),
}

// actions
const actions = {
  search({ commit, rootState }, { text, page, limit }) {
    if (rootState.setting.search.searchSource == 'all') {
      let task = []
      for (const source of sources) {
        if (source.id == 'all') continue
        task.push(music[source.id].musicSearch.search(text, page))
      }
      Promise.all(task).then(results => commit('setLists', { results, text, page }))
    } else {
      return music[rootState.setting.search.searchSource].musicSearch.search(text, page, limit)
        .then(data => commit('setList', { text, page, ...data }))
    }
  },
}

// mitations
const mutations = {
  setList(state, datas) {
    let source = state.sourceList[datas.source]
    source.list = datas.list
    source.total = datas.total
    source.allPage = datas.allPage
    source.page = datas.page
    source.limit = datas.limit
    state.text = datas.text
  },
  setLists(state, { results, text, page }) {
    let pages = []
    let total = 0
    let limit = 0
    let list = []
    for (const source of results) {
      state.sourceMaxPage[source.source] = source.allPage
      if (source.allPage < page) continue
      list.push(...source.list)
      pages.push(source.allPage)
      total += source.total
      limit += source.limit
    }
    list.sort((a, b) => b.name.charCodeAt(0) - a.name.charCodeAt(0))
    state.allPage = Math.max(...pages)
    state.total = total
    state.limit = limit
    state.page = page
    state.text = text
    state.list = list
  },
  clearList(state) {
    for (const source of Object.keys(state.sourceList)) {
      state.sourceList[source].list.length = 0
      state.sourceList[source].page = 0
      state.sourceList[source].allPage = 0
      state.sourceList[source].total = 0
      state.sourceMaxPage[source] = 0
    }
    state.list.length = 0
    state.page = 0
    state.allPage = 0
    state.total = 0
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
