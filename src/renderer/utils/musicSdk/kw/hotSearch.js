import { httpFetch } from '../../request'

export default {
  _requestObj: null,
  async getList(retryNum = 0) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    const _requestObj = httpFetch('http://hotword.kuwo.cn/hotword.s?prod=kwplayer_ar_9.3.0.1&corp=kuwo&newver=2&vipver=9.3.0.1&source=kwplayer_ar_9.3.0.1_40.apk&p2p=1&notrace=0&uid=0&plat=kwplayer_ar&rformat=json&encoding=utf8&tabid=1', {
      headers: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9;)',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.status !== 'ok') throw new Error('获取热搜词失败')
    // console.log(body, statusCode)
    return { source: 'kw', list: this.filterList(body.tagvalue) }
  },
  filterList(rawList) {
    return rawList.map(item => item.key)
  },
}
