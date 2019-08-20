// state
const state = {
  defaultList: {
    name: '试听列表',
    list: [],
  },
  userList: [],
}

// getters
const getters = {
  defaultList: state => state.defaultList || {},
  userList: state => state.userList,
}

// actions
const actions = {

}

// mitations
const mutations = {
  initDefaultList(state, data) {
    state.defaultList = data
  },
  setDefaultList(state, list) {
    state.defaultList.list = list
  },
  defaultListAdd(state, musicInfo) {
    if (state.defaultList.list.some(s => s.songmid === musicInfo.songmid)) return
    state.defaultList.list.push(musicInfo)
  },
  defaultListAddMultiple(state, list) {
    list.forEach(musicInfo => {
      if (state.defaultList.list.some(s => s.songmid === musicInfo.songmid)) return
      state.defaultList.list.push(musicInfo)
    })
  },
  defaultListRemove(state, index) {
    state.defaultList.list.splice(index, 1)
  },
  updateMusicInfo(state, { index, data }) {
    Object.assign(state.defaultList.list[index], data)
  },
  defaultListRemoveMultiple(state, list) {
    list.forEach(musicInfo => {
      let index = state.defaultList.list.indexOf(musicInfo)
      if (index < 0) return
      state.defaultList.list.splice(index, 1)
    })
  },
  defaultListClear(state) {
    state.defaultList.list.length = 0
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
