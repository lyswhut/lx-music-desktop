import { httpFetch } from '../../request'
import getSongId from './songId'

export default {
  async getPicUrl(songId, tryNum = 0) {
    let requestObj = httpFetch(`http://music.migu.cn/v3/api/music/audioPlayer/getSongPic?songId=${songId}`, {
      headers: {
        Referer: 'http://music.migu.cn/v3/music/player/audio?from=migu',
      },
    })
    requestObj.promise.then(({ body }) => {
      if (body.returnCode !== '000000') {
        if (tryNum > 5) return Promise.reject(new Error('图片获取失败'))
        let tryRequestObj = this.getPic(songId, ++tryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }
      let url = body.largePic || body.mediumPic || body.smallPic
      if (!/https?:/.test(url)) url = 'http:' + url
      return url
    })
    return requestObj
  },
  async getPic(songInfo) {
    const songId = await getSongId(songInfo)
    return this.getPicUrl(songId)
  },
}
