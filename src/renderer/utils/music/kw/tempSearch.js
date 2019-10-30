import { httpFetch } from '../../request'
import { decodeName } from '../../index'
import { getToken, matchToken } from './util'


export default {
  regExps: {
    relWord: /RELWORD=(.+)/,
  },
  requestObj: null,
  tempSearch(str, token) {
    this.cancelTempSearch()
    this.requestObj = httpFetch(`http://www.kuwo.cn/api/www/search/searchKey?key=${encodeURIComponent(str)}`, {
      headers: {
        Referer: 'http://www.kuwo.cn/',
        csrf: token,
        cookie: 'kw_token=' + token,
      },
    })
    return this.requestObj.promise.then(({ statusCode, body, headers }) => {
      if (statusCode != 200) return Promise.reject(new Error('请求失败'))
      window.kw_token.token = matchToken(headers)
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
    let token = window.kw_token.token
    if (!token) token = await getToken()
    return this.tempSearch(str, token).then(result => this.handleResult(result.data))
  },
}
