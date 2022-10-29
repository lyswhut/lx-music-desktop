import { httpFetch } from '../../request'

export default {
  _requestObj: null,
  async getList(retryNum = 0) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    const _requestObj = httpFetch('http://musicapi.qianqian.com/v1/restserver/ting?from=android&version=7.0.2.0&channel=ppzs&operator=0&method=baidu.ting.search.hot', {
      method: 'get',
      headers: {
        'User-Agent': 'android_7.0.2.0;baiduyinyue',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.error_code !== 22000) throw new Error('获取热搜词失败')
    // console.log(body, statusCode)
    return { source: 'bd', list: this.filterList(body.result) }
  },
  filterList(rawList) {
    return rawList.map(item => item.word)
  },
}
