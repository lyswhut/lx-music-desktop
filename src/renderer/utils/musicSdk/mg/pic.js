import { httpFetch } from '../../request'

export default {
  getPic(songInfo, tryNum = 0) {
    let requestObj = httpFetch(`http://music.migu.cn/v3/api/music/audioPlayer/getSongPic?songId=${songInfo.songmid}`, {
      headers: {
        Referer: 'http://music.migu.cn/v3/music/player/audio?from=migu',
      },
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      if (body.returnCode !== '000000') {
        if (tryNum > 5) return Promise.reject('图片获取失败')
        let tryRequestObj = this.getPic(songInfo, ++tryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }
      return body.largePic || body.mediumPic || body.smallPic
    })
    return requestObj
  },
}
