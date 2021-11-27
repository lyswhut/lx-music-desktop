import { httpFetch } from '../../request'

export default {
  getLyric(songInfo, tryNum = 0) {
    // console.log(songInfo.copyrightId)
    if (songInfo.lrcUrl) {
      let requestObj = httpFetch(songInfo.lrcUrl)
      requestObj.promise = requestObj.promise.then(({ body, statusCode }) => {
        if (statusCode !== 200) {
          if (tryNum > 5) return Promise.reject('歌词获取失败')
          let tryRequestObj = this.getLyric(songInfo, ++tryNum)
          requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
          return tryRequestObj.promise
        }
        return {
          lyric: body,
          tlyric: '',
        }
      })
      return requestObj
    } else {
      let requestObj = httpFetch(`http://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=${songInfo.copyrightId}`, {
        headers: {
          Referer: 'http://music.migu.cn/v3/music/player/audio?from=migu',
        },
      })
      requestObj.promise = requestObj.promise.then(({ body }) => {
        if (body.returnCode !== '000000' || !body.lyric) {
          if (tryNum > 5) return Promise.reject(new Error('Get lyric failed'))
          let tryRequestObj = this.getLyric(songInfo, ++tryNum)
          requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
          return tryRequestObj.promise
        }
        return {
          lyric: body.lyric,
          tlyric: '',
        }
      })
      return requestObj
    }
  },
}
