import { httpFetch } from '../../request'
import { decodeName } from '../../index'

export default {
  _requestObj: null,
  async getList(retryNum = 0) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    const _requestObj = httpFetch('http://gateway.kugou.com/api/v3/search/hot_tab?signature=ee44edb9d7155821412d220bcaf509dd&appid=1005&clientver=10026&plat=0', {
      method: 'get',
      headers: {
        dfid: '1ssiv93oVqMp27cirf2CvoF1',
        mid: '156798703528610303473757548878786007104',
        clienttime: 1584257267,
        'x-router': 'msearch.kugou.com',
        'user-agent': 'Android9-AndroidPhone-10020-130-0-searchrecommendprotocol-wifi',
        'kg-rc': 1,
      },
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.errcode !== 0) throw new Error('获取热搜词失败')
    // console.log(body, statusCode)
    return { source: 'kg', list: this.filterList(body.data.list) }
  },
  filterList(rawList) {
    const list = []
    rawList.forEach(item => {
      item.keywords.map(k => list.push(decodeName(k.keyword)))
    })
    return list
  },
}
