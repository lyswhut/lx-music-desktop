import music from '../../utils/music'
import { markRawList } from '@renderer/utils/vueTools'

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

// https://blog.csdn.net/xcxy2015/article/details/77164126#comments
const similar = (a, b) => {
  if (!a || !b) return 0
  if (a.length > b.length) { // 保证 a <= b
    let t = b
    b = a
    a = t
  }
  let al = a.length
  let bl = b.length
  let mp = [] // 一个表
  let i, j, ai, lt, tmp // ai：字符串a的第i个字符。 lt：左上角的值。 tmp：暂存新的值。
  for (i = 0; i <= bl; i++) mp[i] = i
  for (i = 1; i <= al; i++) {
    ai = a.charAt(i - 1)
    lt = mp[0]
    mp[0] = mp[0] + 1
    for (j = 1; j <= bl; j++) {
      tmp = Math.min(mp[j] + 1, mp[j - 1] + 1, lt + (ai == b.charAt(j - 1) ? 0 : 1))
      lt = mp[j]
      mp[j] = tmp
    }
  }
  return 1 - (mp[bl] / bl)
}

const sortInsert = (arr, data) => {
  let key = data.num
  let left = 0
  let right = arr.length - 1

  while (left <= right) {
    let middle = parseInt((left + right) / 2)
    if (key == arr[middle]) {
      left = middle
      break
    } else if (key < arr[middle].num) {
      right = middle - 1
    } else {
      left = middle + 1
    }
  }
  while (left > 0) {
    if (arr[left - 1].num != key) break
    left--
  }

  arr.splice(left, 0, data)
}

const handleSortList = (list, keyword) => {
  let arr = []
  for (const item of list) {
    sortInsert(arr, {
      num: similar(keyword, `${item.name} ${item.singer}`),
      data: item,
    })
  }
  return arr.map(item => item.data).reverse()
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
  historyList: [],
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
        task.push(music[source.id].musicSearch.search(text, page).catch(error => {
          console.log(error)
          return {
            allPage: 1,
            limit: 30,
            list: [],
            source: source.id,
            total: 0,
          }
        }))
      }
      return Promise.all(task).then(results => commit('setLists', { results, page }))
    } else {
      return music[rootState.setting.search.searchSource].musicSearch.search(text, page, limit).catch(error => {
        console.log(error)
        return {
          allPage: 1,
          limit: 30,
          list: [],
          source: rootState.setting.search.searchSource,
          total: 0,
        }
      }).then(data => commit('setList', { page, ...data }))
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
    source.list = markRawList(datas.list)
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
      list.push(...markRawList(source.list))
      pages.push(source.allPage)
      total += source.total
      // limit = Math.max(source.limit, limit)
    }
    state.allPage = Math.max(...pages)
    state.total = total
    state.limit = limit
    state.page = page
    state.list = handleSortList(list, state.text)
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
  setHistory(state, list) {
    state.historyList = list
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
