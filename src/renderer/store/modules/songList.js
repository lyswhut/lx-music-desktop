import music from '../../utils/music'
const sortList = {}
const sources = []
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
  sourceInfo: () => ({ sources, sortList }),
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
    let key = `${source}${sortId}${tabId}${page}`
    if (state.list.list.length && state.list.key == key) return true
    return music[source].songList.getList(sortId, tabId, page).then(result => commit('setList', { result, key, page }))
  },
  getListDetail({ state, rootState, commit }, { id, page }) {
    let source = rootState.setting.songList.source
    let key = `${source}${id}${page}`
    if (state.listDetail.list.length && state.listDetail.key == key) return true
    return music[source].songList.getListDetail(id, page).then(result => commit('setListDetail', { result, key, page }))
  },
}

// mitations
const mutations = {
  setTags(state, { tags, source }) {
    state.tags[source] = tags
  },
  setList(state, { result, key, page }) {
    state.list.list = result.list
    state.list.total = result.total
    state.list.limit = result.limit
    state.list.page = page
    state.list.key = key
  },
  setListDetail(state, { result, key, page }) {
    state.listDetail.list = result.list
    state.listDetail.total = result.total
    state.listDetail.limit = result.limit
    state.listDetail.page = page
    state.listDetail.key = key
    state.listDetail.info = result.info || {}
  },
  setVisibleListDetail(state, bool) {
    if (!bool) state.listDetail.list = []
    state.isVisibleListDetail = bool
  },
  setSelectListInfo(state, info) {
    state.selectListInfo = info
  },
  clearListDetail(state) {
    state.listDetail.list = []
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
