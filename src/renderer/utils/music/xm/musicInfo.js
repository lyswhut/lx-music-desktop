import { xmRequest } from './util'

export default {
  _requestObj: null,
  async getMusicInfo({ songmid }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    const _requestObj = xmRequest('/api/song/initialize', { songId: songmid })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.code !== 'SUCCESS') throw new Error('获取歌曲信息失败')
    return { source: 'xm', data: body.result.data.songDetail }
  },
}
