import musicSdk from '../../utils/music'
import { clearLyric, clearMusicUrl } from '../../utils'
import { sync as eventSyncName, list as eventListNames } from '@renderer/event/names'
import { removeListPosition, setListPrevSelectId } from '@renderer/utils/data'
import { markRawList, toRaw, markRaw } from '@renderer/utils/vueTools'
import { allList, allListInit, setInited, removeUserList, addUserList, updateList, defaultList, loveList, userLists } from '@renderer/core/share/list'

// import { allListInit } from '@renderer/core/share/list'

// state
const state = window.lists = {
  // isInitedList: false,
}

// getters
const getters = {
  // isInitedList: state => state.isInitedList,
  // defaultList: state => state.defaultList || {},
  // loveList: state => state.loveList || {},
  // userList: state => state.userList,
  // allList: () => allList,
}

const getOtherSourcePromises = new Map()

// actions
const actions = {
  getOtherSource({ state, commit }, musicInfo) {
    if (musicInfo.otherSource?.length) return Promise.resolve(musicInfo.otherSource)
    let key = `${musicInfo.source}_${musicInfo.songmid}`
    if (getOtherSourcePromises.has(key)) return getOtherSourcePromises.get(key)
    const promise = musicSdk.findMusic(musicInfo).then(otherSource => {
      commit('setOtherSource', { musicInfo, otherSource })
      if (getOtherSourcePromises.has(key)) getOtherSourcePromises.delete(key)
      return otherSource
    })
    getOtherSourcePromises.set(key, promise)
    return promise
  },
}

// mitations
const mutations = {
  initList(state, { defaultList, loveList, userList, tempList }) {
    if (defaultList != null) {
      markRawList(defaultList.list)
    }
    if (loveList != null) {
      markRawList(loveList.list)
    }
    if (tempList != null) {
      markRawList(tempList.list)
    }
    if (userList != null) {
      for (const list of userList) if (list.list) markRawList(list.list)
    }
    allListInit({ defaultList, loveList, tempList, userList })
    window.eventHub.emit(eventListNames.listChange, [defaultList.id, loveList.id, tempList.id, ...userList.map(l => l.id)])
    // state.isInitedList = true
    setInited()

    // if (!isSync) {
    //   window.eventHub.emit(eventSyncName.send_action_list, {
    //     action: 'init_list',
    //     data: { defaultList, loveList, userList },
    //   })
    // }
  },
  setSyncListData(state, { defaultList, loveList, userList }) {
    if (defaultList != null) markRawList(defaultList.list)
    if (loveList != null) markRawList(loveList.list)
    if (userList != null) for (const list of userList) markRawList(list.list)
    allListInit({ defaultList, loveList, userList })
    window.eventHub.emit(eventListNames.listChange, [defaultList.id, loveList.id, ...userList.map(l => l.id)])
  },
  setList(state, { id, list, name, source, sourceListId, isSync }) {
    markRawList(list)
    const targetList = id == defaultList.id
      ? defaultList
      : id == loveList.id
        ? loveList
        : userLists.find(l => l.id == id)
    if (targetList) {
      if (name && targetList.name === name) {
        if (!isSync) {
          window.eventHub.emit(eventSyncName.send_action_list, {
            action: 'set_list',
            data: { id, list: toRaw(list), name, source, sourceListId },
          })
        }
        updateList({
          id,
          list,
          name,
          source,
          sourceListId,
        })
        window.eventHub.emit(eventListNames.listChange, [id])
        return
      }

      id += '_' + Math.random()
    }
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'set_list',
        data: { id, list: toRaw(list), name, source, sourceListId },
      })
    }
    let newList = {
      name,
      id,
      list,
      source,
      sourceListId,
    }
    addUserList(newList)
    window.eventHub.emit(eventListNames.listChange, [id])
  },
  listAdd(state, { id, musicInfo, addMusicLocationType, isSync }) {
    if (!addMusicLocationType) addMusicLocationType = this.state.setting.list.addMusicLocationType

    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'list_add',
        data: { id, musicInfo: toRaw(musicInfo), addMusicLocationType },
      })
    }

    const targetList = allList[id]
    markRaw(musicInfo)
    if (!targetList) return
    if (targetList.some(s => s.songmid === musicInfo.songmid)) return
    switch (addMusicLocationType) {
      case 'top':
        targetList.unshift(musicInfo)
        break
      case 'bottom':
      default:
        targetList.push(musicInfo)
        break
    }
    window.eventHub.emit(eventListNames.listChange, [id])
  },
  listMove(state, { fromId, musicInfo, toId, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'list_move',
        data: { fromId, musicInfo: toRaw(musicInfo), toId },
      })
    }

    const fromList = allList[fromId]
    const toList = allList[toId]
    if (!fromList || !toList) return
    fromList.splice(fromList.findIndex(s => s.songmid === musicInfo.songmid), 1)
    let index = toList.findIndex(s => s.songmid === musicInfo.songmid)
    if (index < 0) {
      switch (this.state.setting.list.addMusicLocationType) {
        case 'top':
          toList.unshift(musicInfo)
          break
        case 'bottom':
        default:
          toList.push(musicInfo)
          break
      }
    }
    window.eventHub.emit(eventListNames.listChange, [fromId, toList])
  },
  listAddMultiple(state, { id, list, addMusicLocationType, isSync }) {
    if (!addMusicLocationType) addMusicLocationType = this.state.setting.list.addMusicLocationType

    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'list_add_multiple',
        data: { id, list: toRaw(list), addMusicLocationType },
      })
    }

    let targetList = allList[id]
    if (!targetList) return
    markRawList(list)
    let newList
    const map = {}
    const ids = []
    switch (addMusicLocationType) {
      case 'top':
        newList = [...list, ...targetList]
        for (let i = newList.length - 1; i > -1; i--) {
          const item = newList[i]
          if (map[item.songmid]) continue
          ids.unshift(item.songmid)
          map[item.songmid] = item
        }
        break
      case 'bottom':
      default:
        newList = [...targetList, ...list]
        for (const item of newList) {
          if (map[item.songmid]) continue
          ids.push(item.songmid)
          map[item.songmid] = item
        }
        break
    }
    targetList.splice(0, targetList.length, ...ids.map(id => map[id]))
    window.eventHub.emit(eventListNames.listChange, [id])
  },
  // { fromId, toId, list }
  listMoveMultiple(state, { fromId, toId, list, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'list_move_multiple',
        data: { fromId, toId, list: toRaw(list) },
      })
    }

    // console.log(state.commit)
    this.commit('list/listRemoveMultiple', { listId: fromId, ids: list.map(s => s.songmid), isSync: true })
    this.commit('list/listAddMultiple', { id: toId, list, isSync: true })
  },
  listRemove(state, { listId, id, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'list_remove',
        data: { listId, id },
      })
    }

    let targetList = allList[listId]
    if (!targetList) return
    const index = targetList.findIndex(item => item.songmid == id)
    if (index < 0) return
    targetList.splice(index, 1)
    window.eventHub.emit(eventListNames.listChange, [listId])
  },
  listRemoveMultiple(state, { listId, ids: musicIds, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'list_remove_multiple',
        data: { listId, ids: musicIds },
      })
    }

    let targetList = allList[listId]
    if (!targetList) return
    let map = {}
    let ids = []
    for (const item of targetList) {
      ids.push(item.songmid)
      map[item.songmid] = item
    }
    for (const songmid of musicIds) {
      if (map[songmid]) delete map[songmid]
    }
    let newList = []
    for (const id of ids) if (map[id]) newList.push(map[id])

    targetList.splice(0, targetList.length, ...newList)
    window.eventHub.emit(eventListNames.listChange, [listId])
  },
  listClear(state, { id, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'list_clear',
        data: { id },
      })
    }

    let targetList = allList[id]
    if (!targetList) return
    targetList.splice(0, targetList.length)
    window.eventHub.emit(eventListNames.listChange, [id])
  },
  updateMusicInfo(state, { listId, id, data, musicInfo, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'update_music_info',
        data: { listId, id, data, musicInfo: toRaw(musicInfo) },
      })
    }

    let targetList = allList[listId]
    if (!targetList) {
      if (musicInfo) Object.assign(musicInfo, data)
      return
    }
    const targetMusicInfo = targetList.find(item => item.songmid == id)
    if (targetMusicInfo) Object.assign(targetMusicInfo, data)

    switch (listId) {
      case defaultList.id:
        window.eventHub.emit(eventListNames.musicInfoChange, { list: targetList, ...defaultList })
        break
      case loveList.id:
        window.eventHub.emit(eventListNames.musicInfoChange, { list: targetList, ...loveList })
        break
      default:
        window.eventHub.emit(eventListNames.musicInfoChange, userLists.map(l => ({ list: allList[l.id], ...l })))
        break
    }
  },
  createUserList(state, { name, id = `userlist_${Date.now()}`, list = [], source, sourceListId, position, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'create_user_list',
        data: { name, id, list: toRaw(list), source, sourceListId, position },
      })
    }

    markRawList(list)
    let newList = userLists.find(item => item.id === id)
    if (!newList) {
      newList = {
        name,
        id,
        list: [],
        source,
        position,
        sourceListId,
      }
      if (position) newList.locationUpdateTime = Date.now()
      addUserList(newList)
    }
    this.commit('list/listAddMultiple', { id, list, isSync: true })
  },
  removeUserList(state, { id, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'remove_user_list',
        data: { id },
      })
    }

    const index = userLists.findIndex(l => l.id === id)
    if (index < 0) return
    removeUserList(id)
    removeListPosition(id)
    window.eventHub.emit(eventListNames.listChange, [id])
  },
  setUserListName(state, { id, name, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'set_user_list_name',
        data: { id, name },
      })
    }

    let list = userLists.find(l => l.id === id)
    if (!list) return
    list.name = name
    window.eventHub.emit(eventListNames.listChange, [id])
  },
  setUserListPosition(state, { id, position, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'set_user_list_position',
        data: { id, position },
      })
    }
    const index = userLists.findIndex(l => l.id == id)
    if (index < 0) return
    let targetList = userLists[index]
    userLists.splice(index, 1)
    userLists.splice(Math.max(Math.min(position, userLists.length), 0), 0, targetList)
    targetList.locationUpdateTime = Date.now()
    window.eventHub.emit(eventListNames.listChange, [id])
  },
  setMusicPosition(state, { id, position, list, isSync }) {
    if (!isSync) {
      window.eventHub.emit(eventSyncName.send_action_list, {
        action: 'set_music_position',
        data: { id, position, list: toRaw(list) },
      })
    }

    let targetList = allList[id]
    this.commit('list/listRemoveMultiple', { listId: id, ids: list.map(m => m.songmid), isSync: true })

    targetList.splice(position - 1, 0, ...list)
    window.eventHub.emit(eventListNames.listChange, [id])
  },
  clearCache() {
    const lists = Object.values(allList)
    for (const list of lists) {
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
    window.eventHub.emit(eventListNames.listChange, Object.keys(allList))
  },
  setOtherSource(state, { musicInfo, otherSource }) {
    musicInfo.otherSource = otherSource
  },
  setPrevSelectListId(state, val) {
    setListPrevSelectId(val)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
