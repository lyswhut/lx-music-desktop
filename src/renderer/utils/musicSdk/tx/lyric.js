import { httpFetch } from '../../request'
import { b64DecodeUnicode, decodeName } from '../../index'

export default {
  regexps: {
    matchLrc: /.+"lyric":"([\w=+/]*)".+/,
  },
  getLyric(songmid) {
    const requestObj = httpFetch(`https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${songmid}&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&platform=yqq`, {
      headers: {
        Referer: 'https://y.qq.com/portal/player.html',
      },
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      if (body.code != 0 || !body.lyric) return Promise.reject(new Error('Get lyric failed'))
      return {
        lyric: decodeName(b64DecodeUnicode(body.lyric)),
        tlyric: decodeName(b64DecodeUnicode(body.trans)),
      }
    })
    return requestObj
  },
}
