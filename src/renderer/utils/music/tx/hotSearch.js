import { httpFetch } from '../../request'

export default {
  _requestObj: null,
  async getList(retryNum = 0) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    const _requestObj = httpFetch('https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg', {
      method: 'get',
      headers: {
        Referer: 'https://y.qq.com/portal/player.html',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.code !== 0) throw new Error('获取热搜词失败')
    // console.log(body)
    return { source: 'tx', list: this.filterList(body.data.hotkey) }
  },
  filterList(rawList) {
    return rawList.map(item => item.k)
  },
}
