import musicSdk from '../../utils/music'
import { clearLyric, clearMusicUrl } from '../../utils'

let allList = {}
window.allList = allList

const allListInit = (defaultList, loveList, userList) => {
  allList[defaultList.id] = defaultList
  allList[loveList.id] = loveList
  for (const list of userList) allList[list.id] = list
}
const allListUpdate = list => {
  allList[list.id] = list
}
const allListRemove = list => {
  delete allList[list.id]
}

// state
const state = {
  isInitedList: false,
  defaultList: {
    id: 'default',
    name: '试听列表',
    list: [],
    location: 0,
  },
  loveList: {
    id: 'love',
    name: '我的收藏',
    list: [],
    location: 0,
  },
  tempList: {
    id: 'temp',
    name: '临时列表',
    list: [],
    location: 0,
  },
  userList: [],
}

// getters
const getters = {
  isInitedList: state => state.isInitedList,
  defaultList: state => state.defaultList || {},
  loveList: state => state.loveList || {},
  userList: state => state.userList,
  allList: () => allList,
}

// actions
const actions = {
  getOtherSource({ state, commit }, musicInfo) {
    return (musicInfo.otherSource && musicInfo.otherSource.length ? Promise.resolve(musicInfo.otherSource) : musicSdk.findMusic(musicInfo)).then(otherSource => {
      commit('setOtherSource', { musicInfo, otherSource })
      return otherSource
    })
  },
}

// mitations
const mutations = {
  initList(state, { defaultList, loveList, userList }) {
    if (defaultList != null) Object.assign(state.defaultList, { list: defaultList.list, location: defaultList.location })
    if (loveList != null) Object.assign(state.loveList, { list: loveList.list, location: loveList.location })
    if (userList != null) state.userList = userList
    allListInit(state.defaultList, state.loveList, state.userList)
    state.isInitedList = true
  },
  setList(state, { id, list, name, location, source, sourceListId }) {
    const targetList = allList[id]
    if (targetList) {
      if (name && targetList.name === name) {
        targetList.list.splice(0, targetList.list.length, ...list)
        targetList.location = location
        return
      }

      id += '_' + Math.random()
    }
    let newList = {
      name,
      id,
      list,
      location,
      source,
      sourceListId,
    }
    state.userList.push(newList)
    allListUpdate(newList)
  },
  listAdd(state, { id, musicInfo }) {
    const targetList = allList[id]
    if (!targetList) return
    if (targetList.list.some(s => s.songmid === musicInfo.songmid)) return
    targetList.list.push(musicInfo)
  },
  listMove(state, { fromId, musicInfo, toId }) {
    const fromList = allList[fromId]
    const toList = allList[toId]
    if (!fromList || !toList) return
    fromList.list.splice(fromList.list.indexOf(musicInfo), 1)
    let index = toList.list.findIndex(s => s.songmid === musicInfo.songmid)
    if (index < 0) toList.list.push(musicInfo)
  },
  listAddMultiple(state, { id, list }) {
    let targetList = allList[id]
    if (!targetList) return
    let newList = [...targetList.list, ...list]
    let map = {}
    let ids = []
    for (const item of newList) {
      if (map[item.songmid]) continue
      ids.push(item.songmid)
      map[item.songmid] = item
    }
    targetList.list.splice(0, targetList.list.length, ...ids.map(id => map[id]))
  },
  // { fromId, toId, list }
  listMoveMultiple(state, { fromId, toId, list }) {
    // console.log(state.commit)
    this.commit('list/listRemoveMultiple', { id: fromId, list })
    this.commit('list/listAddMultiple', { id: toId, list })
  },
  listRemove(state, { id, index }) {
    let targetList = allList[id]
    if (!targetList) return
    targetList.list.splice(index, 1)
  },
  listRemoveMultiple(state, { id, list }) {
    let targetList = allList[id]
    if (!targetList) return
    let map = {}
    let ids = []
    for (const item of targetList.list) {
      ids.push(item.songmid)
      map[item.songmid] = item
    }
    for (const item of list) {
      if (map[item.songmid]) delete map[item.songmid]
    }
    let newList = []
    for (const id of ids) if (map[id]) newList.push(map[id])

    targetList.list.splice(0, targetList.list.length, ...newList)
  },
  listClear(state, id) {
    let targetList = allList[id]
    if (!targetList) return
    targetList.list.splice(0, targetList.list.length)
  },
  updateMusicInfo(state, { id, index, data, musicInfo = {} }) {
    let targetList = allList[id]
    if (!targetList) return Object.assign(musicInfo, data)
    Object.assign(targetList.list[index], data)
  },
  createUserList(state, { name, id = `userlist_${Date.now()}`, list = [], source, sourceListId }) {
    let newList = state.userList.find(item => item.id === id)
    if (!newList) {
      newList = {
        name,
        id,
        list: [],
        location: 0,
        source,
        sourceListId,
      }
      state.userList.push(newList)
      allListUpdate(newList)
    }
    this.commit('list/listAddMultiple', { id, list })
  },
  removeUserList(state, index) {
    let list = state.userList.splice(index, 1)[0]
    allListRemove(list)
  },
  setUserListName(state, { index, name }) {
    let list = state.userList[index]
    if (!list) return
    list.name = name
  },
  moveupUserList(state, index) {
    let targetList = state.userList[index]
    state.userList.splice(index, 1)
    state.userList.splice(index - 1, 0, targetList)
  },
  movedownUserList(state, index) {
    let targetList = state.userList[index]
    state.userList.splice(index, 1)
    state.userList.splice(index + 1, 0, targetList)
  },
  setListScroll(state, { id, location }) {
    if (allList[id]) allList[id].location = location
  },
  sortList(state, { id, sortNum, musicInfos }) {
    let targetList = allList[id]
    this.commit('list/listRemoveMultiple', { id, list: musicInfos })

    targetList.list.splice(sortNum - 1, 0, ...musicInfos)
  },
  clearCache() {
    const lists = Object.values(allList)
    for (const { list } of lists) {
      for (const item of list) {
        if (item.otherSource) item.otherSource = null
        if (item.typeUrl['128k']) delete item.typeUrl['128k']
        if (item.typeUrl['320k']) delete item.typeUrl['320k']
        if (item.typeUrl.flac) delete item.typeUrl.flac
        if (item.typeUrl.wav) delete item.typeUrl.wav

        // v1.8.2以前的Lyric
        if (item.lxlrc) delete item.lxlrc
        if (item.lrc) delete item.lrc
        if (item.tlrc) delete item.tlrc
      }
    }
    clearMusicUrl()
    clearLyric()
  },
  setOtherSource(state, { musicInfo, otherSource }) {
    musicInfo.otherSource = otherSource
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
