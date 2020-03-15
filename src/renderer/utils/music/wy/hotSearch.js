import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'

export default {
  _requestObj: null,
  async getList(retryNum = 0) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    const _requestObj = httpFetch('https://music.163.com/weapi/search/hot', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
      },
      form: weapi({ type: 1111 }),
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.code !== 200) throw new Error('获取热搜词失败')
    // console.log(body)
    return { source: 'wy', list: this.filterList(body.result.hots) }
  },
  filterList(rawList) {
    return rawList.map(item => item.first)
  },
}
