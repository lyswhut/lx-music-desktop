import music from '../../utils/music'

// state
const state = {
  list: [],
  listId: null,
  playIndex: -1,
  changePlay: false,
}

let urlRequest
let picRequest
let lrcRequest

// getters
const getters = {
  list: state => state.list || [],
  listId: state => state.listId,
  changePlay: satte => satte.changePlay,
  playIndex: state => state.playIndex,
}

// actions
const actions = {
  getUrl({ commit, state }, { musicInfo, type, isRefresh }) {
    if (!musicInfo._types[type]) {
      // 兼容旧版酷我源搜索列表过滤128k音质的bug
      if (!(musicInfo.source == 'kw' && type == '128k')) return Promise.reject(new Error('该歌曲没有可播放的音频'))

      // return Promise.reject(new Error('该歌曲没有可播放的音频'))
    }
    if (urlRequest && urlRequest.cancelHttp) urlRequest.cancelHttp()
    if (musicInfo.typeUrl[type] && !isRefresh) return Promise.resolve()
    urlRequest = music[musicInfo.source].getMusicUrl(musicInfo, type)
    return urlRequest.promise.then(result => {
      commit('setUrl', { musicInfo, url: result.url, type })
    }).finally(() => {
      urlRequest = null
    })
  },
  getPic({ commit, state }, musicInfo) {
    if (picRequest && picRequest.cancelHttp) picRequest.cancelHttp()
    picRequest = music[musicInfo.source].getPic(musicInfo)
    return picRequest.promise.then(url => {
      commit('getPic', { musicInfo, url })
    }).finally(() => {
      picRequest = null
    })
  },
  getLrc({ commit, state }, musicInfo) {
    if (lrcRequest && lrcRequest.cancelHttp) lrcRequest.cancelHttp()
    lrcRequest = music[musicInfo.source].getLyric(musicInfo)
    return lrcRequest.promise.then(lrc => {
      commit('setLrc', { musicInfo, lrc })
    }).finally(() => {
      lrcRequest = null
    })
  },
}


// mitations
const mutations = {
  setUrl(state, datas) {
    datas.musicInfo.typeUrl = Object.assign({}, datas.musicInfo.typeUrl, { [datas.type]: datas.url })
  },
  getPic(state, datas) {
    datas.musicInfo.img = datas.url
  },
  setLrc(state, datas) {
    datas.musicInfo.lrc = datas.lrc
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
    // console.log(state.changePlay)
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
