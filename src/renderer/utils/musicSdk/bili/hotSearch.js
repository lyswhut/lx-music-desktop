import { httpFetch } from '../../request'

export default {
  _requestObj: null,

  async getList(retryNum = 0) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    const _requestObj = httpFetch('https://s.search.bilibili.com/main/hotword', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://www.bilibili.com/',
      },
    })

    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.code !== 0) throw new Error('获取热搜词失败')

    return {
      source: 'bili',
      list: this.filterList(body.list),
    }
  },

  filterList(rawList) {
    return rawList.map(item => item.keyword).slice(0, 20)
  },
}
