// state
const state = {
  defaultList: {
    id: 'default',
    name: '试听列表',
    list: [],
  },
  loveList: {
    id: 'love',
    name: '我的收藏',
    list: [],
  },
  userList: [],
}

// getters
const getters = {
  defaultList: state => state.defaultList || {},
  loveList: state => state.loveList || {},
  userList: state => state.userList,
}

// actions
const actions = {

}

const getList = (state, id) => {
  let targetList
  switch (id) {
    case 'default':
      targetList = state.defaultList
      break
    case 'love':
      targetList = state.loveList
      break
    default:
      targetList = state.userList.find(l => l.id === id)
      break
  }
  return targetList
}

// mitations
const mutations = {
  initList(state, { defaultList, loveList }) {
    if (defaultList !== undefined) state.defaultList.list = defaultList.list
    if (loveList !== undefined) state.loveList.list = loveList.list
  },
  setList(state, { id, list }) {
    const targetList = getList(state, id)
    if (!targetList) return
    targetList.list = list
  },
  listAdd(state, { id, musicInfo }) {
    const targetList = getList(state, id)
    if (!targetList) return
    if (targetList.list.some(s => s.songmid === musicInfo.songmid)) return
    targetList.list.push(musicInfo)
  },
  listAddMultiple(state, { id, list }) {
    let targetList = getList(state, id)
    if (!targetList) return
    targetList = targetList.list
    list.forEach(musicInfo => {
      if (targetList.some(s => s.songmid === musicInfo.songmid)) return
      targetList.push(musicInfo)
    })
  },
  listRemove(state, { id, index }) {
    let targetList = getList(state, id)
    if (!targetList) return
    targetList.list.splice(index, 1)
  },
  listRemoveMultiple(state, { id, list }) {
    let targetList = getList(state, id)
    if (!targetList) return
    targetList = targetList.list
    list.forEach(musicInfo => {
      let index = targetList.indexOf(musicInfo)
      if (index < 0) return
      targetList.splice(index, 1)
    })
  },
  listClear(state, id) {
    let targetList = getList(state, id)
    if (!targetList) return
    targetList.list.length = []
  },
  updateMusicInfo(state, { id, index, data }) {
    let targetList = getList(state, id)
    if (!targetList) return
    Object.assign(targetList.list[index], data)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
