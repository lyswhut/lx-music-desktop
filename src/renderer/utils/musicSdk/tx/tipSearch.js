import { httpFetch } from '../../request'

export default {
  requestObj: null,
  cancelTipSearch() {
    if (this.requestObj && this.requestObj.cancelHttp) this.requestObj.cancelHttp()
  },
  tipSearchBySong(str) {
    this.cancelTipSearch()
    this.requestObj = httpFetch(`https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?_=1682514997109&cv=4747474&ct=24&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=1&uin=0&g_tk_new_20200303=5381&g_tk=5381&hostUin=0&is_xml=0&key=${encodeURIComponent(str)}`, {
      headers: {
        origin: 'https://y.qq.com/',
        referer: 'https://y.qq.com/',
      },
    })
    return this.requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode != 200 || body.code != 0) return Promise.reject(new Error('请求失败'))
      return body.data.song.itemlist
    })
  },
  handleResult(rawData) {
    return rawData.map(info => `${info.name} - ${info.singer}`)
  },
  async search(str) {
    return this.tipSearchBySong(str).then(result => this.handleResult(result))
  },
}
