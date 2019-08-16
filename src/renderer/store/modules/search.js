import music from '../../utils/music'

// state
const state = {
  list: [],
  text: '',
  page: 1,
  limit: 30,
  allPage: 1,
  total: 0,
}

// getters
const getters = {
  list: state => state.list || [],
  limit: state => state.limit,
  info: state => ({ page: state.page, text: state.text }),
  listInfo: state => ({ allPage: state.allPage, total: state.total }),
}

// actions
const actions = {
  search({ commit, rootState }, { text, page, limit }) {
    return music[rootState.setting.sourceId].musicSearch.search(text, page, limit)
      .then(data => commit('setList', { list: data.list, allPage: data.allPage, total: data.total, text, page }))
  },
}

// mitations
const mutations = {
  setList(state, datas) {
    state.list = datas.list
    state.total = datas.total
    state.allPage = datas.allPage
    state.page = datas.page
    state.text = datas.text
  },
  clearList(state) {
    state.list.length = 0
    state.page = 0
    state.allPage = 0
    state.total = 0
    state.text = ''
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
