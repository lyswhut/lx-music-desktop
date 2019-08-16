import { httpGet, cancelHttp } from '../../request'
import leaderboard from './leaderboard'
import lyric from './lyric'

const tx = {
  leaderboard,

  getMusicUrl(songInfo, type) {
    let requestObj
    let cancelFn
    const p = new Promise((resolve, reject) => {
      cancelFn = reject
      requestObj = httpGet(`https://v1.itooi.cn/tencent/url?id=${songInfo.strMediaMid}&quality=${type.replace(/k$/, '')}&isRedirect=0`, (err, resp, body) => {
        requestObj = null
        cancelFn = null
        if (err) {
          console.log(err)
          const { promise, cancelHttp } = this.getMusicUrl(songInfo, type)
          obj.cancelHttp = cancelHttp
          return promise
        }
        body.code === 200 ? resolve({ type, url: body.data }) : reject(new Error(body.msg))
      })
    })
    const obj = {
      promise: p,
      cancelHttp() {
        console.log('cancel')
        if (!requestObj) return
        cancelHttp(requestObj)
        cancelFn(new Error('取消http请求'))
        requestObj = null
        cancelFn = null
      },
    }
    return obj
  },
  getLyric(songInfo) {
    // let singer = songInfo.singer.indexOf('、') > -1 ? songInfo.singer.split('、')[0] : songInfo.singer
    return lyric.getLyric(songInfo.songmid)
  },
  getPic(songInfo) {
    return Promise.resolve(`https://y.gtimg.cn/music/photo_new/T002R500x500M000${songInfo.albumId}.jpg`)
  },
}

export default tx
