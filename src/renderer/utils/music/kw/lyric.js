import { httpGet, cancelHttp } from '../../request'

export default {
  _musicLrcRequestObj: null,
  _musicLrcPromiseCancelFn: null,
  formatTime(time) {
    let m = parseInt(time / 60)
    let s = (time % 60).toFixed(2)
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
  },
  transformLrc({ songinfo, lrclist }) {
    return `[ti:${songinfo.songName}]\n[ar:${songinfo.artist}]\n[al:${songinfo.album}]\n[by:]\n[offset:0]\n${lrclist ? lrclist.map(l => `[${this.formatTime(l.time)}]${l.lineLyric}\n`).join('') : '暂无歌词'}`
  },
  getLyric(songId) {
    if (this._musicLrcRequestObj != null) {
      cancelHttp(this._musicLrcRequestObj)
      this._musicLrcPromiseCancelFn(new Error('取消http请求'))
    }
    return new Promise((resolve, reject) => {
      this._musicLrcPromiseCancelFn = reject
      // this._musicLrcRequestObj = httpGet(`https://v1.itooi.cn/kuwo/lrc?id=${songId}`, (err, resp, body) => {
      this._musicLrcRequestObj = httpGet(`http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${songId}`, (err, resp, body) => {
        this._musicLrcRequestObj = null
        this._musicLrcPromiseCancelFn = null
        if (err) {
          console.log(err)
          reject(err)
        }
        // resolve(body)
        resolve(this.transformLrc(body.data))
      })
    })
  },
}
