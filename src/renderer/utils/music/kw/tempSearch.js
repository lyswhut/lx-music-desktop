import { httpGet, cancelHttp } from '../../request'
import { decodeName } from '../../index'

export default {
  regExps: {
    relWord: /RELWORD=(.+)/,
  },
  _musicTempSearchRequestObj: null,
  _musicTempSearchPromiseCancelFn: null,
  tempSearch(str) {
    this.cancelTempSearch()
    return new Promise((resolve, reject) => {
      this._musicTempSearchPromiseCancelFn = reject
      this._musicTempSearchRequestObj = httpGet(`http://www.kuwo.cn/api/www/search/searchKey?key=${encodeURIComponent(str)}`, (err, resp, body) => {
        this._musicTempSearchRequestObj = null
        this._musicTempSearchPromiseCancelFn = null
        if (err) {
          console.log(err)
          reject(err)
        }
        resolve(body)
      })
    })
  },
  handleResult(rawData) {
    return rawData.map(info => {
      let matchResult = info.match(this.regExps.relWord)
      return matchResult ? decodeName(matchResult[1]) : ''
    })
  },
  cancelTempSearch() {
    if (this._musicTempSearchRequestObj != null) {
      cancelHttp(this._musicTempSearchRequestObj)
      this._musicTempSearchPromiseCancelFn(new Error('取消http请求'))
    }
  },
  search(str) {
    return this.tempSearch(str).then(result => this.handleResult(result.data))
  },
}
