import { httpFetch } from '../../request'
import { b64DecodeUnicode } from '../../index'

export default {
  regexps: {
    matchLrc: /.+"lyric":"([\w=+/]*)".+/,
  },
  getLyric(songmid) {
    const requestObj = httpFetch(`https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${songmid}&g_tk=2001461048&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&platform=yqq`, {
      headers: {
        Referer: 'https://y.qq.com/portal/player.html',
      },
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return b64DecodeUnicode(body.replace(this.regexps.matchLrc, '$1'))
    })
    return requestObj
  },
}
