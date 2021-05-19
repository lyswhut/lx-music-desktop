// import { httpFetch } from '../../request'
import { decodeName } from '../../index'
import { tokenRequest } from './util'


export default {
  regExps: {
    relWord: /RELWORD=(.+)/,
  },
  requestObj: null,
  async tempSearch(str) {
    this.cancelTempSearch()
    this.requestObj = await tokenRequest(`http://www.kuwo.cn/api/www/search/searchKey?key=${encodeURIComponent(str)}`)
    return this.requestObj.promise.then(({ body }) => {
      // console.log(body)
      if (body.code !== 200) return Promise.reject(new Error('请求失败'))
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
  async search(str) {
    return this.tempSearch(str).then(result => this.handleResult(result.data))
  },
}
