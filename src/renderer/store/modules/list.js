import musicSdk from '../../utils/music'
import { clearLyric, clearMusicUrl } from '../../utils'
import { sync as eventSyncName } from '@renderer/event/names'

let allList = {}
window.allList = allList

const allListInit = (defaultList, loveList, userList) => {
  for (const id of Object.keys(allList)) {
    delete allList[id]
  }
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

    // if (!isSync) {
    //   window.eventHub.$emit(eventSyncName.send_action_list, {
    //     action: 'init_list',
    //     data: { defaultList, loveList, userList },
    //   })
    // }
  },
  setSyncListData(state, { defaultList, loveList, userList }) {
    state.defaultList.list.splice(0, state.defaultList.list.length, ...defaultList.list)
    state.loveList.list.splice(0, state.loveList.list.length, ...loveList.list)
    for (let index = 0; index < userList.length; index++) {
      const list = userList[index]
      const targetList = allList[list.id]
      if (targetList) {
        userList.splice(index, 1, targetList)
        targetList.name = list.name
        targetList.list.splice(0, targetList.list.length, ...list.list)
      }
    }
    console.log()
    state.userList = userList
    allListInit(state.defaultList, state.loveList, state.userList)
  },
  setList(state, { id, list, name, location, source, sourceListId, isSync }) {
    const targetList = allList[id]
    if (targetList) {
      if (name && targetList.name === name) {
        if (!isSync) {
          window.eventHub.$emit(eventSyncName.send_action_list, {
            action: 'set_list',
            data: { id, list, name, location, source, sourceListId },
          })
        }
        targetList.list.splice(0, targetList.list.length, ...list)
        targetList.location = location
        return
      }

      id += '_' + Math.random()
    }
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'set_list',
        data: { id, list, name, location, source, sourceListId },
      })
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
  listAdd(state, { id, musicInfo, addMusicLocationType, isSync }) {
    if (!addMusicLocationType) addMusicLocationType = this.state.setting.list.addMusicLocationType

    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'list_add',
        data: { id, musicInfo, addMusicLocationType },
      })
    }

    const targetList = allList[id]
    if (!targetList) return
    if (targetList.list.some(s => s.songmid === musicInfo.songmid)) return
    switch (addMusicLocationType) {
      case 'top':
        targetList.list.unshift(musicInfo)
        break
      case 'bottom':
      default:
        targetList.list.push(musicInfo)
        break
    }
  },
  listMove(state, { fromId, musicInfo, toId, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'list_move',
        data: { fromId, musicInfo, toId },
      })
    }

    const fromList = allList[fromId]
    const toList = allList[toId]
    if (!fromList || !toList) return
    fromList.list.splice(fromList.list.findIndex(s => s.songmid === musicInfo.songmid), 1)
    let index = toList.list.findIndex(s => s.songmid === musicInfo.songmid)
    if (index < 0) {
      switch (this.state.setting.list.addMusicLocationType) {
        case 'top':
          toList.list.unshift(musicInfo)
          break
        case 'bottom':
        default:
          toList.list.push(musicInfo)
          break
      }
    }
  },
  listAddMultiple(state, { id, list, addMusicLocationType, isSync }) {
    if (!addMusicLocationType) addMusicLocationType = this.state.setting.list.addMusicLocationType

    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'list_add_multiple',
        data: { id, list, addMusicLocationType },
      })
    }

    let targetList = allList[id]
    if (!targetList) return
    let newList
    const map = {}
    const ids = []
    switch (addMusicLocationType) {
      case 'top':
        newList = [...list, ...targetList.list]
        for (let i = newList.length - 1; i > -1; i--) {
          const item = newList[i]
          if (map[item.songmid]) continue
          ids.unshift(item.songmid)
          map[item.songmid] = item
        }
        break
      case 'bottom':
      default:
        newList = [...targetList.list, ...list]
        for (const item of newList) {
          if (map[item.songmid]) continue
          ids.push(item.songmid)
          map[item.songmid] = item
        }
        break
    }
    targetList.list.splice(0, targetList.list.length, ...ids.map(id => map[id]))
  },
  // { fromId, toId, list }
  listMoveMultiple(state, { fromId, toId, list, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'list_move_multiple',
        data: { fromId, toId, list },
      })
    }

    // console.log(state.commit)
    this.commit('list/listRemoveMultiple', { listId: fromId, ids: list.map(s => s.songmid), isSync: true })
    this.commit('list/listAddMultiple', { id: toId, list, isSync: true })
  },
  listRemove(state, { listId, id, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'list_remove',
        data: { listId, id },
      })
    }

    let targetList = allList[listId]
    if (!targetList) return
    const index = targetList.list.findIndex(item => item.songmid == id)
    if (index < 0) return
    targetList.list.splice(index, 1)
  },
  listRemoveMultiple(state, { listId, ids: musicIds, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'list_remove_multiple',
        data: { listId, ids: musicIds },
      })
    }

    let targetList = allList[listId]
    if (!targetList) return
    let map = {}
    let ids = []
    for (const item of targetList.list) {
      ids.push(item.songmid)
      map[item.songmid] = item
    }
    for (const songmid of musicIds) {
      if (map[songmid]) delete map[songmid]
    }
    let newList = []
    for (const id of ids) if (map[id]) newList.push(map[id])

    targetList.list.splice(0, targetList.list.length, ...newList)
  },
  listClear(state, { id, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'list_clear',
        data: { id },
      })
    }

    let targetList = allList[id]
    if (!targetList) return
    targetList.list.splice(0, targetList.list.length)
  },
  updateMusicInfo(state, { listId, id, data, musicInfo, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'update_music_info',
        data: { listId, id, data, musicInfo },
      })
    }

    let targetList = allList[listId]
    if (!targetList) {
      if (musicInfo) Object.assign(musicInfo, data)
      return
    }
    const targetMusicInfo = targetList.list.find(item => item.songmid == id)
    if (targetMusicInfo) Object.assign(targetMusicInfo, data)
  },
  createUserList(state, { name, id = `userlist_${Date.now()}`, list = [], source, sourceListId, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'create_user_list',
        data: { name, id, list, source, sourceListId },
      })
    }

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
    this.commit('list/listAddMultiple', { id, list, isSync: true })
  },
  removeUserList(state, { id, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'remove_user_list',
        data: { id },
      })
    }

    const index = state.userList.findIndex(l => l.id === id)
    if (index < 0) return
    let list = state.userList.splice(index, 1)[0]
    allListRemove(list)
  },
  setUserListName(state, { id, name, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'set_user_list_name',
        data: { id, name },
      })
    }

    let list = allList[id]
    if (!list) return
    list.name = name
  },
  moveupUserList(state, { id, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'moveup_user_list',
        data: { id },
      })
    }

    const index = state.userList.findIndex(l => l.id == id)
    if (index < 0) return
    let targetList = allList[id]
    state.userList.splice(index, 1)
    state.userList.splice(index - 1, 0, targetList)
  },
  movedownUserList(state, { id, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'movedown_user_list',
        data: { id },
      })
    }
    const index = state.userList.findIndex(l => l.id == id)
    if (index < 0) return
    let targetList = allList[id]
    state.userList.splice(index, 1)
    state.userList.splice(index + 1, 0, targetList)
  },
  setListScroll(state, { id, location }) {
    if (allList[id]) allList[id].location = location
  },
  setMusicPosition(state, { id, position, list, isSync }) {
    if (!isSync) {
      window.eventHub.$emit(eventSyncName.send_action_list, {
        action: 'set_music_position',
        data: { id, position, list },
      })
    }

    let targetList = allList[id]
    this.commit('list/listRemoveMultiple', { listId: id, ids: list.map(m => m.songmid), isSync: true })

    targetList.list.splice(position - 1, 0, ...list)
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
