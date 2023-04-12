import { httpFetch } from '../../request'

export default {
  _requestObj: null,
  async getList(retryNum = 0) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    const _requestObj = httpFetch('http://jadeite.migu.cn:7090/music_search/v3/search/hotword')
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.code !== '000000') throw new Error('获取热搜词失败')
    // console.log(body, statusCode)
    return { source: 'mg', list: this.filterList(body.data.hotwords[0].hotwordList) }
  },
  filterList(rawList) {
    return rawList.filter(item => item.resourceType == 'song').map(item => item.word)
  },
}
