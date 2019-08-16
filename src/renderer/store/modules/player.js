import music from '../../utils/music'

// state
const state = {
  list: [],
  listId: null,
  playIndex: -1,
  changePlay: false,
}

// getters
const getters = {
  list: state => state.list || [],
  listId: state => state.listId,
  changePlay: satte => satte.changePlay,
  playIndex: state => state.playIndex,
}

// actions
const actions = {
  getUrl({ commit, state }, { musicInfo, type }) {
    if (state.cancelFn) state.cancelFn()
    const { promise, cancelHttp } = music[musicInfo.source].getMusicUrl(musicInfo, type)
    state.cancelFn = cancelHttp
    return promise.then(result => {
      return commit('setUrl', { musicInfo, url: result.url, type })
    }).finally(() => {
      state.cancelFn = null
    })
  },
  getPic({ commit, state }, musicInfo) {
    return music[musicInfo.source].getPic(musicInfo).then(url => commit('getPic', { musicInfo, url }))
  },
  getLrc({ commit, state }, musicInfo) {
    return music[musicInfo.source].getLyric(musicInfo).then(lrc => commit('setLrc', { musicInfo, lrc }))
  },
}


// mitations
const mutations = {
  setUrl(state, datas) {
    datas.musicInfo.typeUrl[datas.type] = datas.url
  },
  getPic(state, datas) {
    datas.musicInfo.img = datas.url
  },
  setLrc(state, datas) {
    datas.musicInfo.lyric = datas.lrc
  },
  setList(state, { list, listId, index }) {
    state.list = list
    state.listId = listId
    state.playIndex = index
    state.changePlay = true
  },
  setPlayIndex(state, index) {
    state.playIndex = index
    state.changePlay = true
  },
  fixPlayIndex(state, index) {
    state.playIndex = index
  },
  resetChangePlay(state) {
    state.changePlay = false
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
