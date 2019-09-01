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
    total: 0,
    page: 1,
    limit: 30,
    key: null,
  },
}

// getters
const getters = {
  sourceInfo: () => ({ sources, sortList }),
  tags: state => state.tags,
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
    let tabId = rootState.setting.songList.tagId
    let sortId = rootState.setting.songList.sortId
    let key = `${source}${sortId}${tabId}${page}`
    if (state.list.list.length && state.list.key == key) return true
    return music[source].songList.getList(sortId, tabId, page).then(result => commit('setList', { result, key }))
  },
  getListDetail({ state, rootState, commit }, { id, page }) {
    let source = rootState.setting.songList.source
    let key = `${source}${id}${page}}`
    if (state.listDetail.list.length && state.listDetail.key == key) return true
    return music[source].songList.getListDetail(id, page).then(result => commit('setListDetail', { result, key }))
  },
}

// mitations
const mutations = {
  setTags(state, { tags, source }) {
    state.tags[source] = tags
  },
  setList(state, { result, key }) {
    state.list.list = result.list
    state.list.total = result.total
    state.list.limit = result.limit
    state.list.page = result.page
    state.list.key = key
    console.log(result)
  },
  setListDetail(state, { result, key }) {
    state.listDetail.list = result.list
    state.listDetail.total = result.total
    state.listDetail.limit = result.limit
    state.listDetail.page = result.page
    state.listDetail.key = key
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
