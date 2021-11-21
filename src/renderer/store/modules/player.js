import path from 'path'
import music from '../../utils/music'
import {
  getRandom,
  checkPath,
  getLyric as getStoreLyric,
  setLyric,
  setMusicUrl,
  getMusicUrl as getStoreMusicUrl,
  assertApiSupport,
} from '../../utils'

// state
const state = {
  listInfo: {
    list: [],
    id: null,
  },
  playIndex: -1,
  changePlay: false,
  playedList: [],

  playMusicInfo: null,
  tempPlayList: [],
}


const filterList = async({ playedList, listInfo, savePath, commit }) => {
  // if (this.list.listName === null) return
  let list
  let canPlayList = []
  const filteredPlayedList = playedList.filter(({ listId, isTempPlay }) => listInfo.id === listId && !isTempPlay).map(({ musicInfo }) => musicInfo)
  if (listInfo.id == 'download') {
    list = []
    for (const item of listInfo.list) {
      const filePath = path.join(savePath, item.fileName)
      if (!await checkPath(filePath) || !item.isComplate || /\.ape$/.test(filePath)) continue

      canPlayList.push(item)

      // 排除已播放音乐
      let index = filteredPlayedList.findIndex(m => m.songmid == item.songmid)
      if (index > -1) {
        filteredPlayedList.splice(index, 1)
        continue
      }
      list.push(item)
    }
  } else {
    list = listInfo.list.filter(s => {
      // if (!assertApiSupport(s.source)) return false
      canPlayList.push(s)

      let index = filteredPlayedList.findIndex(m => m.songmid == s.songmid)
      if (index > -1) {
        filteredPlayedList.splice(index, 1)
        return false
      }
      return true
    })
  }
  if (!list.length && playedList.length) {
    commit('clearPlayedList')
    return canPlayList
  }
  return list
}

const getMusicUrl = function(musicInfo, type, onToggleSource, retryedSource = [], originMusic) {
  // console.log(musicInfo.source)
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getMusicUrl(musicInfo, type).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    onToggleSource()
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source) || !assertApiSupport(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return getMusicUrl.call(this, item, type, onToggleSource, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}

const getPic = function(musicInfo, retryedSource = [], originMusic) {
  // console.log(musicInfo.source)
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getPic(musicInfo).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return getPic.call(this, item, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}
const getLyric = function(musicInfo, retryedSource = [], originMusic) {
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getLyric(musicInfo).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return getLyric.call(this, item, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}

let prevListPlayIndex
// getters
const getters = {
  list: state => state.listInfo.list,
  changePlay: satte => satte.changePlay,
  playInfo(state) {
    if (state.playMusicInfo == null) return { listId: null, playIndex: -1, playListId: null, listPlayIndex: -1, isPlayList: false, musicInfo: null }
    const playListId = state.listInfo.id
    let listId = state.playMusicInfo.listId
    const isTempPlay = !!state.playMusicInfo.isTempPlay
    const isPlayList = listId === playListId
    let playIndex = -1
    let listPlayIndex = Math.min(state.playIndex, state.listInfo.list.length - 1)

    if (listId != '__temp__') {
      if (state.playMusicInfo.musicInfo.key) {
        const currentKey = state.playMusicInfo.musicInfo.key
        if (isPlayList) {
          playIndex = state.listInfo.list.findIndex(m => m.key == currentKey)
          if (!isTempPlay) listPlayIndex = playIndex
        } else if (listId == 'download') {
          playIndex = window.downloadList.findIndex(m => m.key == currentKey)
        }
      } else {
        const currentSongmid = state.playMusicInfo.musicInfo.songmid
        if (isPlayList) {
          playIndex = state.listInfo.list.findIndex(m => m.songmid == currentSongmid)
          if (!isTempPlay) listPlayIndex = playIndex
        } else {
          let list = window.allList[listId]
          if (list) playIndex = list.list.findIndex(m => m.songmid == currentSongmid)
        }
      }
    }
    if (listPlayIndex >= 0) prevListPlayIndex = listPlayIndex
    // if (listPlayIndex < 0) {
    //   let length = state.listInfo.list.length
    //   if (length) {
    //     let index = Math.min(prevListPlayIndex, 0)
    //     if (index > length - 1) index = length - 1
    //     listPlayIndex = prevListPlayIndex = index
    //   }
    // } else {
    //   prevListPlayIndex = listPlayIndex
    // }
    // console.log({
    //   listId,
    //   playIndex,
    //   playListId,
    //   listPlayIndex,
    //   isPlayList,
    //   isTempPlay,
    //   musicInfo: state.playMusicInfo.musicInfo,
    // })

    // console.log(state.playMusicInfo)
    return {
      listId,
      playIndex,
      playListId,
      listPlayIndex,
      isPlayList,
      isTempPlay,
      musicInfo: state.playMusicInfo.musicInfo,
    }
  },
  playMusicInfo: state => state.playMusicInfo,
  playedList: state => state.playedList,
  tempPlayList: state => state.tempPlayList,
}

// actions
const actions = {
  async getUrl({ commit, state }, { musicInfo, type, isRefresh, onToggleSource = () => {} }) {
    // if (!musicInfo._types[type]) {
    //   // 兼容旧版酷我源搜索列表过滤128k音质的bug
    //   if (!(musicInfo.source == 'kw' && type == '128k')) throw new Error('该歌曲没有可播放的音频')

    //   // return Promise.reject(new Error('该歌曲没有可播放的音频'))
    // }
    const cachedUrl = await getStoreMusicUrl(musicInfo, type)
    if (cachedUrl && !isRefresh) return cachedUrl

    return getMusicUrl.call(this, musicInfo, type, onToggleSource).then(({ url }) => {
      commit('setUrl', { musicInfo, url, type })
      return url
    }).catch(err => {
      return Promise.reject(err)
    })
  },
  getPic({ commit, state }, musicInfo) {
    // if (picRequest && picRequest.cancelHttp) picRequest.cancelHttp()
    // picRequest = music[musicInfo.source].getPic(musicInfo)
    return getPic.call(this, musicInfo).then(url => {
      // picRequest = null
      commit('getPic', { musicInfo, url })
    }).catch(err => {
      // picRequest = null
      return Promise.reject(err)
    })
  },
  async getLrc({ commit, state }, musicInfo) {
    const lrcInfo = await getStoreLyric(musicInfo)
    // if (lrcRequest && lrcRequest.cancelHttp) lrcRequest.cancelHttp()
    if (lrcInfo.lyric && lrcInfo.tlyric != null) {
      // if (musicInfo.lrc.startsWith('\ufeff[id:$00000000]')) {
      //   let str = musicInfo.lrc.replace('\ufeff[id:$00000000]\n', '')
      //   commit('setLrc', { musicInfo, lyric: str, tlyric: musicInfo.tlrc, lxlyric: musicInfo.tlrc })
      // } else if (musicInfo.lrc.startsWith('[id:$00000000]')) {
      //   let str = musicInfo.lrc.replace('[id:$00000000]\n', '')
      //   commit('setLrc', { musicInfo, lyric: str, tlyric: musicInfo.tlrc, lxlyric: musicInfo.tlrc })
      // }

      if ((lrcInfo.lxlyric == null && musicInfo.source != 'kg') || lrcInfo.lxlyric != null) return lrcInfo
    }

    // lrcRequest = music[musicInfo.source].getLyric(musicInfo)
    return getLyric.call(this, musicInfo).then(({ lyric, tlyric, lxlyric }) => {
      // lrcRequest = null
      commit('setLrc', { musicInfo, lyric, tlyric, lxlyric })
      return { lyric, tlyric, lxlyric }
    }).catch(err => {
      // lrcRequest = null
      return Promise.reject(err)
    })
  },

  async playPrev({ state, rootState, commit, getters }) {
    const currentListId = state.listInfo.id
    const currentList = state.listInfo.list
    const playInfo = getters.playInfo
    if (state.playedList.length) {
      let currentSongmid
      if (state.playMusicInfo.isTempPlay) {
        const musicInfo = currentList[playInfo.listPlayIndex]
        if (musicInfo) currentSongmid = musicInfo.songmid
      } else {
        currentSongmid = state.playMusicInfo.musicInfo.songmid
      }
      // 从已播放列表移除播放列表已删除的歌曲
      let index
      for (index = state.playedList.findIndex(m => m.musicInfo.songmid === currentSongmid) - 1; index > -1; index--) {
        const playMusicInfo = state.playedList[index]
        const currentSongmid = playMusicInfo.musicInfo.songmid
        if (playMusicInfo.listId == currentListId && !currentList.some(m => m.songmid === currentSongmid)) {
          commit('removePlayedList', index)
          continue
        }
        break
      }

      if (index > -1) {
        commit('setPlayMusicInfo', state.playedList[index])
        return
      }
    }

    let filteredList = await filterList({
      listInfo: state.listInfo,
      playedList: state.playedList,
      savePath: rootState.setting.download.savePath,
      commit,
    })
    if (!filteredList.length) return commit('setPlayMusicInfo', null)

    let listPlayIndex = filteredList.indexOf(state.listInfo.list[playInfo.listPlayIndex])
    const currentListLength = state.listInfo.list.length - 1
    if (listPlayIndex == -1 && currentListLength) {
      listPlayIndex = prevListPlayIndex >= currentListLength ? 0 : prevListPlayIndex + 1
    }
    let currentIndex = listPlayIndex
    if (currentIndex < 0) currentIndex = 0
    let nextIndex = currentIndex
    if (!playInfo.isTempPlay) {
      switch (rootState.setting.player.togglePlayMethod) {
        case 'random':
          nextIndex = getRandom(0, filteredList.length)
          break
        case 'listLoop':
        case 'list':
          nextIndex = currentIndex === 0 ? filteredList.length - 1 : currentIndex - 1
          break
        case 'singleLoop':
          break
        default:
          nextIndex = -1
          return
      }
      if (nextIndex < 0) return
    }

    commit('setPlayMusicInfo', {
      musicInfo: filteredList[nextIndex],
      listId: currentListId,
    })
  },
  async playNext({ state, rootState, commit, getters }) {
    if (state.tempPlayList.length) {
      const playMusicInfo = state.tempPlayList[0]
      commit('removeTempPlayList', 0)
      commit('setPlayMusicInfo', playMusicInfo)
      return
    }
    const currentListId = state.listInfo.id
    const currentList = state.listInfo.list
    const playInfo = getters.playInfo

    if (state.playedList.length) {
      let currentSongmid
      if (state.playMusicInfo.isTempPlay) {
        const musicInfo = currentList[playInfo.listPlayIndex]
        if (musicInfo) currentSongmid = musicInfo.songmid
      } else {
        currentSongmid = state.playMusicInfo.musicInfo.songmid
      }
      // 从已播放列表移除播放列表已删除的歌曲
      let index
      for (index = state.playedList.findIndex(m => m.musicInfo.songmid === currentSongmid) + 1; index < state.playedList.length; index++) {
        const playMusicInfo = state.playedList[index]
        const currentSongmid = playMusicInfo.musicInfo.songmid
        if (playMusicInfo.listId == currentListId && !currentList.some(m => m.songmid === currentSongmid)) {
          commit('removePlayedList', index)
          continue
        }
        break
      }

      if (index < state.playedList.length) {
        commit('setPlayMusicInfo', state.playedList[index])
        return
      }
    }
    let filteredList = await filterList({
      listInfo: state.listInfo,
      playedList: state.playedList,
      savePath: rootState.setting.download.savePath,
      commit,
    })

    if (!filteredList.length) return commit('setPlayMusicInfo', null)
    let listPlayIndex = filteredList.indexOf(state.listInfo.list[playInfo.listPlayIndex])
    const currentListLength = state.listInfo.list.length - 1
    if (listPlayIndex == -1 && currentListLength) {
      listPlayIndex = prevListPlayIndex > currentListLength ? currentListLength : prevListPlayIndex - 1
    }
    const currentIndex = listPlayIndex
    let nextIndex = currentIndex

    switch (rootState.setting.player.togglePlayMethod) {
      case 'listLoop':
        nextIndex = currentIndex === filteredList.length - 1 ? 0 : currentIndex + 1
        break
      case 'random':
        nextIndex = getRandom(0, filteredList.length)
        break
      case 'list':
        nextIndex = currentIndex === filteredList.length - 1 ? -1 : currentIndex + 1
        break
      case 'singleLoop':
        break
      default:
        nextIndex = -1
        return
    }
    if (nextIndex < 0) return

    commit('setPlayMusicInfo', {
      musicInfo: filteredList[nextIndex],
      listId: currentListId,
    })
  },
}


// mitations
const mutations = {
  setUrl(state, { musicInfo, type, url }) {
    setMusicUrl(musicInfo, type, url)
  },
  getPic(state, datas) {
    datas.musicInfo.img = datas.url
  },
  setLrc(state, datas) {
    // datas.musicInfo.lrc = datas.lyric
    // datas.musicInfo.tlrc = datas.tlyric
    // datas.musicInfo.lxlrc = datas.lxlyric
    setLyric(datas.musicInfo, {
      lyric: datas.lyric,
      tlyric: datas.tlyric,
      lxlyric: datas.lxlyric,
    })
  },
  setList(state, { list, index }) {
    if (!(list && list.list && list.list[index])) return
    state.playMusicInfo = {
      musicInfo: list.list[index],
      listId: list.id,
    }
    state.listInfo = list
    state.playIndex = index
    state.changePlay = true
    // console.log(state.playMusicInfo)
    if (state.playedList.length) this.commit('player/clearPlayedList')
    if (state.tempPlayList.length) this.commit('player/clearTempPlayeList')
  },
  setPlayIndex(state, index) {
    state.playIndex = index
  },
  setChangePlay(state) {
    state.changePlay = true
  },
  resetChangePlay(state) {
    state.changePlay = false
  },
  setPlayedList(state, item) {
    // console.log(item)
    if (state.playedList.includes(item)) return
    state.playedList.push(item)
  },
  removePlayedList(state, index) {
    state.playedList.splice(index, 1)
  },
  clearPlayedList(state) {
    state.playedList.splice(0, state.playedList.length)
  },
  setTempPlayList(state, list) {
    state.tempPlayList.push(...list.map(({ musicInfo, listId }) => ({ musicInfo, listId, isTempPlay: true })))
    if (!state.playMusicInfo) this.commit('player/playNext')
  },
  removeTempPlayList(state, index) {
    state.tempPlayList.splice(index, 1)
  },
  clearTempPlayeList(state) {
    state.tempPlayList.splice(0, state.tempPlayList.length)
  },

  setPlayMusicInfo(state, playMusicInfo) {
    let playIndex = state.playIndex
    if (playMusicInfo == null) {
      playIndex = -1
    } else {
      let listId = playMusicInfo.listId
      if (listId != '__temp__' && !playMusicInfo.isTempPlay && listId === state.listInfo.id) {
        const currentSongmid = playMusicInfo.musicInfo.songmid
        playIndex = state.listInfo.list.findIndex(m => m.songmid == currentSongmid)
      }
    }

    state.playMusicInfo = playMusicInfo
    state.playIndex = playIndex
    state.changePlay = true
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
