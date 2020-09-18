import music from '../../utils/music'

// state
const state = {
  listInfo: {
    list: [],
    id: null,
  },
  playIndex: -1,
  changePlay: false,
  isShowPlayerDetail: false,
  playedList: [],
}

let urlRequest
let picRequest
let lrcRequest

// getters
const getters = {
  list: state => state.listInfo.list,
  listId: state => state.listInfo.id,
  changePlay: satte => satte.changePlay,
  playIndex: state => state.playIndex,
  isShowPlayerDetail: state => state.isShowPlayerDetail,
  playedList: state => state.playedList,
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
      urlRequest = null
    }).catch(err => {
      urlRequest = null
      return Promise.reject(err)
    })
  },
  getPic({ commit, state }, musicInfo) {
    if (picRequest && picRequest.cancelHttp) picRequest.cancelHttp()
    picRequest = music[musicInfo.source].getPic(musicInfo)
    return picRequest.promise.then(url => {
      picRequest = null
      commit('getPic', { musicInfo, url })
    }).catch(err => {
      picRequest = null
      return Promise.reject(err)
    })
  },
  getLrc({ commit, state }, musicInfo) {
    if (lrcRequest && lrcRequest.cancelHttp) lrcRequest.cancelHttp()
    lrcRequest = music[musicInfo.source].getLyric(musicInfo)
    return lrcRequest.promise.then(({ lyric, tlyric }) => {
      lrcRequest = null
      commit('setLrc', { musicInfo, lyric, tlyric })
    }).catch(err => {
      lrcRequest = null
      return Promise.reject(err)
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
    datas.musicInfo.lrc = datas.lyric
    datas.musicInfo.tlrc = datas.tlyric
  },
  setList(state, { list, index }) {
    state.listInfo = list
    state.playIndex = index
    state.changePlay = true
    if (state.playedList.length) this.commit('player/clearPlayedList')
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
  setPlayedList(state, item) {
    if (state.playedList.includes(item)) return
    state.playedList.push(item)
  },
  removePlayedList(state, index) {
    state.playedList.splice(index, 1)
  },
  clearPlayedList(state) {
    state.playedList = []
  },
  visiblePlayerDetail(state, visible) {
    state.isShowPlayerDetail = visible
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
