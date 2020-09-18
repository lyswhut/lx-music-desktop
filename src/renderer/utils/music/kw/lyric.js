import { httpFetch } from '../../request'
import { decodeLyric } from './util'

export default {
  lrcInfoRxp: /<lyric>(.+?)<\/lyric>[\s\S]+<lyric_zz>(.+?)<\/lyric_zz>/,
  parseLyricInfo(str) {
    let result = str.match(this.lrcInfoRxp)
    return result ? { lyric: result[1], lyric_zz: result[2] } : null
  },
  getLyric(songId, isGetLyricx = false) {
    const requestObj = httpFetch(`http://player.kuwo.cn/webmusic/st/getNewMuiseByRid?rid=MUSIC_${songId}`)
    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode != 200) return Promise.reject(new Error(JSON.stringify(body)))
      let info = this.parseLyricInfo(body)
      if (!info) return Promise.reject(new Error(JSON.stringify(body)))
      Object.assign(requestObj, httpFetch(`http://newlyric.kuwo.cn/newlyric.lrc?${isGetLyricx ? info.lyric_zz : info.lyric}`))
      return requestObj.promise.then(({ statusCode, body, raw }) => {
        if (statusCode != 200) return Promise.reject(new Error(JSON.stringify(body)))
        return decodeLyric({ lrcBase64: raw.toString('base64'), isGetLyricx }).then(base64Data => {
          return {
            lyric: Buffer.from(base64Data, 'base64').toString(),
            tlyric: '',
          }
        })
      })
    })
    return requestObj
  },
}
