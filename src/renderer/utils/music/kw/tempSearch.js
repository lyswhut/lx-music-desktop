import { httpFetch } from '../../request'
import { decodeName } from '../../index'

export default {
  regExps: {
    relWord: /RELWORD=(.+)/,
  },
  requestObj: null,
  tempSearch(str) {
    this.cancelTempSearch()
    this.requestObj = httpFetch(`http://www.kuwo.cn/api/www/search/searchKey?key=${encodeURIComponent(str)}`, {
      headers: {
        Referer: 'http://www.kuwo.cn/',
      },
    })
    return this.requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode != 200 || body.code !== 200) return Promise.reject(new Error('请求失败'))
      return body
    })
  },
  handleResult(rawData) {
    return rawData.map(info => {
      let matchResult = info.match(this.regExps.relWord)
      return matchResult ? decodeName(matchResult[1]) : ''
    })
  },
  cancelTempSearch() {
    if (this.requestObj && this.requestObj.cancelHttp) this.requestObj.cancelHttp()
  },
  search(str) {
    return this.tempSearch(str).then(result => this.handleResult(result.data))
  },
}
