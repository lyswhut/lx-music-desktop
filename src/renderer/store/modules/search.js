import Store from 'electron-store'
import music from '../../utils/music'

const electronStore_data = window.electronStore_data = new Store({
  name: 'data',
})
let historyList = electronStore_data.get('searchHistoryList')
if (historyList == null) {
  historyList = []
  electronStore_data.set('searchHistoryList', historyList)
}

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
  historyList,
}

// getters
const getters = {
  sources(state, getters, rootState, { sourceNames }) {
    return sources.map(item => ({ id: item.id, name: sourceNames[item.id] }))
  },
  sourceList: state => state.sourceList || [],
  searchText: state => state.text,
  historyList: state => state.historyList,
  allList: state => ({ list: state.list, allPage: state.allPage, page: state.page, total: state.total, limit: state.limit, sourceMaxPage: state.sourceMaxPage }),
}

// actions
const actions = {
  search({ commit, rootState }, { text, page, limit }) {
    commit('setText', text)
    commit('addHistory', text)
    if (rootState.setting.search.searchSource == 'all') {
      let task = []
      for (const source of sources) {
        if (source.id == 'all') continue
        task.push(music[source.id].musicSearch.search(text, page))
      }
      Promise.all(task).then(results => commit('setLists', { results, page }))
    } else {
      return music[rootState.setting.search.searchSource].musicSearch.search(text, page, limit)
        .then(data => commit('setList', { page, ...data }))
    }
  },
}

// mitations
const mutations = {
  setText(state, text) {
    state.text = text
  },
  setList(state, datas) {
    let source = state.sourceList[datas.source]
    source.list = datas.list
    source.total = datas.total
    source.allPage = datas.allPage
    source.page = datas.page
    source.limit = datas.limit
  },
  setLists(state, { results, page }) {
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
    list.sort((a, b) => a.name.charCodeAt(0) - b.name.charCodeAt(0))
    state.allPage = Math.max(...pages)
    state.total = total
    state.limit = limit
    state.page = page
    state.list = list
  },
  clearList(state) {
    for (const source of Object.keys(state.sourceList)) {
      state.sourceList[source].list = []
      state.sourceList[source].page = 0
      state.sourceList[source].allPage = 0
      state.sourceList[source].total = 0
      state.sourceMaxPage[source] = 0
    }
    state.list.length = []
    state.page = 0
    state.allPage = 0
    state.total = 0
    state.text = ''
  },
  addHistory(state, text) {
    let index = state.historyList.indexOf(text)
    if (index > -1) state.historyList.splice(index, 1)
    if (state.historyList.length >= 15) state.historyList = state.historyList.slice(0, 14)
    state.historyList.unshift(text)
  },
  removeHistory(state, index) {
    state.historyList.splice(index, 1)
  },
  clearHistory(state) {
    state.historyList = []
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
