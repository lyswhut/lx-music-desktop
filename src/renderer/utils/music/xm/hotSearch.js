// import { xmRequest } from './util'

export default {
  _requestObj: null,
  async getList(retryNum = 0) {
    // if (this._requestObj) this._requestObj.cancelHttp()
    // if (retryNum > 2) return Promise.reject(new Error('try max num'))

    // const _requestObj = xmRequest('/api/search/getHotSearchWords')
    // const { body, statusCode } = await _requestObj.promise
    // // console.log(body)
    // if (statusCode != 200 || body.code !== 'SUCCESS') return this.getList(++retryNum)
    // // console.log(body, statusCode)
    // return { source: 'xm', list: this.filterList(body.result.data.hotWords) }
    return { source: 'xm', list: [] }
  },
  filterList(rawList) {
    return rawList.map(item => item.word)
  },
}
