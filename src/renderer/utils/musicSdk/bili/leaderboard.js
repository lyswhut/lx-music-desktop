export default {
  getList(bangid, page = 1, retryNum = 0) {
    return Promise.resolve({
      list: [],
      total: 0,
      limit: 30,
      page: 1,
      source: 'bili',
    })
  },
  getBoards() {
    return Promise.resolve({
      list: [],
      source: 'bili',
    })
  },
}
