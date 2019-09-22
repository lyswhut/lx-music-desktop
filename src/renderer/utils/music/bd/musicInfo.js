import { httpFetch } from '../../request'

export default {
  cache: {},
  getMusicInfo(songmid) {
    if (this.cache[songmid]) {
      return { promise: Promise.resolve(this.cache[songmid]) }
    }
    const requestObj = httpFetch(`https://musicapi.qianqian.com/v1/restserver/ting?method=baidu.ting.song.getSongLink&format=json&from=bmpc&version=1.0.0&version_d=11.1.6.0&songid=${songmid}&type=1&res=1&s_protocol=1&aac=2&project=tpass`)
    requestObj.promise = requestObj.promise.then(({ body }) => {
      // console.log(body)
      if (body.error_code == 22000) {
        this.cache[songmid] = body.result.songinfo
        return body.result.songinfo
      }
      return Promise.reject(new Error('获取音乐信息失败'))
    })
    return requestObj
  },
}
