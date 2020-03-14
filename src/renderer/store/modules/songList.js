import music from '../../utils/music'
const sortList = {}
const sources = []
const cache = new Map()
for (const source of music.sources) {
  const songList = music[source.id].songList
  if (!songList) continue
  sortList[source.id] = songList.sortList
  sources.push(source)
}

// state
const state = {
  tags: {},
  list: {
    list: [],
    total: 0,
    page: 1,
    limit: 30,
    key: null,
  },
  listDetail: {
    list: [],
    desc: null,
    total: 0,
    page: 1,
    limit: 30,
    key: null,
    info: {},
  },
  selectListInfo: {},
  isVisibleListDetail: false,
}

sources.forEach(source => {
  state.tags[source.id] = null
})


// getters
const getters = {
  sourceInfo(state, getters, rootState, { sourceNames }) {
    return { sources: sources.map(item => ({ id: item.id, name: sourceNames[item.id] })), sortList }
  },
  tags: state => state.tags,
  isVisibleListDetail: state => state.isVisibleListDetail,
  selectListInfo: state => state.selectListInfo,
  listData(state) {
    return state.list
  },
  listDetail(state) {
    return state.listDetail
  },
}

// actions
const actions = {
  getTags({ state, rootState, commit }) {
    let source = rootState.setting.songList.source
    return music[source].songList.getTags().then(result => commit('setTags', { tags: result, source }))
  },
  getList({ state, rootState, commit }, page) {
    let source = rootState.setting.songList.source
    let tabId = rootState.setting.songList.tagInfo.id
    let sortId = rootState.setting.songList.sortId
    // console.log(sortId)
    let key = `slist__${source}__${sortId}__${tabId}__${page}`
    if (state.list.list.length && state.list.key == key) return
    if (cache.has(key)) return Promise.resolve(cache.get(key)).then(result => commit('setList', { result, key, page }))
    commit('clearList')
    return music[source].songList.getList(sortId, tabId, page).then(result => commit('setList', { result, key, page }))
  },
  getListDetail({ state, rootState, commit }, { id, page }) {
    let source = rootState.setting.songList.source
    let key = `sdetail__${source}__${id}__${page}`
    if (state.listDetail.list.length && state.listDetail.key == key) return Promise.resolve()
    commit('clearListDetail')
    return (
      cache.has(key)
        ? Promise.resolve(cache.get(key))
        : music[source].songList.getListDetail(id, page)
    ).then(result => commit('setListDetail', { result, key, page }))
  },
/*   getListDetailAll({ state, rootState }, id) {
    let source = rootState.setting.songList.source
    let key = `sdetail__${source}__${id}__all`
    if (cache.has(key)) return Promise.resolve(cache.get(key))
    music[source].songList.getListDetail(id, 1).then(result => {
      let data = { list: result.list, id }
      if (result.total <= result.limit) {
        data = { list: result.list, id }
        cache.set(key, data)
        return data
      }

      let maxPage = Math.ceil(result.total / result.limit)
      const loadDetail = (loadPage = 1) => {
        let task = []
        let loadNum = 0
        while (loadPage <= maxPage && loadNum < 3) {
          task.push(music[source].songList.getListDetail(id, ++loadPage))
          loadNum++
        }
        return loadPage == maxPage
          ? Promise.all(task)
          : Promise.all(task).then(result => loadDetail(loadPage).then(result2 => [...result, ...result2]))
      }
      return loadDetail().then(result2 => {
        console.log(result2)
      })
    })
  }, */
}

// mitations
const mutations = {
  setTags(state, { tags, source }) {
    state.tags[source] = tags
  },
  clearList(state) {
    state.list.list = []
    state.list.total = 0
  },
  setList(state, { result, key, page }) {
    state.list.list = result.list
    state.list.total = result.total
    state.list.limit = result.limit
    state.list.page = page
    state.list.key = key
    cache.set(key, result)
  },
  setListDetail(state, { result, key, page }) {
    state.listDetail.list = result.list
    state.listDetail.total = result.total
    state.listDetail.limit = result.limit
    state.listDetail.page = page
    state.listDetail.key = key
    state.listDetail.info = result.info || {}
    cache.set(key, result)
  },
  setVisibleListDetail(state, bool) {
    if (!bool) state.listDetail.list = []
    state.isVisibleListDetail = bool
  },
  setSelectListInfo(state, info) {
    state.selectListInfo = info
  },
  clearListDetail(state) {
    state.listDetail = {
      list: [],
      desc: null,
      total: 0,
      page: 1,
      limit: 30,
      key: null,
      info: {},
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
