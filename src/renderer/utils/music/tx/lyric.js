import { httpGet, cancelHttp } from '../../request'
import { b64DecodeUnicode } from '../../index'

export default {
  _musicLrcRequestObj: null,
  _musicLrcPromiseCancelFn: null,
  regexps: {
    matchLrc: /.+"lyric":"([\w=+/]*)".+/,
  },
  getLyric(songmid) {
    if (this._musicLrcRequestObj != null) {
      cancelHttp(this._musicLrcRequestObj)
      this._musicLrcPromiseCancelFn(new Error('取消http请求'))
    }
    return new Promise((resolve, reject) => {
      this._musicLrcPromiseCancelFn = reject
      this._musicLrcRequestObj = httpGet(`https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${songmid}&g_tk=2001461048&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&platform=yqq`, {
        headers: {
          Referer: 'https://y.qq.com/portal/player.html',
        },
      }, (err, resp, body) => {
        this._musicLrcRequestObj = null
        this._musicLrcPromiseCancelFn = null
        if (err) {
          console.log(err)
          reject(err)
        }
        resolve(b64DecodeUnicode(body.replace(this.regexps.matchLrc, '$1')))
      })
    })
  },
}
