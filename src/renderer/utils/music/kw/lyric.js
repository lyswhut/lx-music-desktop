import { httpFetch } from '../../request'
import { decodeName } from '../../index'

export default {
  formatTime(time) {
    let m = parseInt(time / 60)
    let s = (time % 60).toFixed(2)
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
  },
  sortLrcArr(arr) {
    const lrcSet = new Set()
    let lrc = []
    let lrcT = []

    for (const item of arr) {
      if (lrcSet.has(item.time)) {
        lrc.push(item)
      } else {
        lrcT.push(item)
        lrcSet.add(item.time)
      }
    }
    if (lrc.length) {
      if ((lrcT.length - lrc.length) > (lrcT.length * 0.1)) { // 翻译比正文多则证明翻译可能有问题，直接将其丢弃
        lrc = lrcT
        lrcT = []
      } else {
        lrc.unshift(lrcT.shift())
      }
    } else {
      lrc = lrcT
      lrcT = []
    }

    return {
      lrc,
      lrcT,
    }
  },
  transformLrc(songinfo, lrclist) {
    return `[ti:${songinfo.songName}]\n[ar:${songinfo.artist}]\n[al:${songinfo.album}]\n[by:]\n[offset:0]\n${lrclist ? lrclist.map(l => `[${this.formatTime(l.time)}]${l.lineLyric}\n`).join('') : '暂无歌词'}`
  },
  getLyric(songId) {
    const requestObj = httpFetch(`http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${songId}`)
    requestObj.promise = requestObj.promise.then(({ body }) => {
      // console.log(body)
      if (!body.data?.lrclist?.length) return Promise.reject(new Error('Get lyric failed'))
      const { lrc, lrcT } = this.sortLrcArr(body.data.lrclist)
      // console.log(body.data.lrclist)
      // console.log(lrc, lrcT)
      // console.log({
      //   lyric: decodeName(this.transformLrc(body.data.songinfo, lrc)),
      //   tlyric: decodeName(this.transformLrc(body.data.songinfo, lrcT)),
      // })
      return {
        lyric: decodeName(this.transformLrc(body.data.songinfo, lrc)),
        tlyric: lrcT.length ? decodeName(this.transformLrc(body.data.songinfo, lrcT)) : '',
      }
    })
    return requestObj
  },
}


/* export default {
  lrcInfoRxp: /<lyric>(.+?)<\/lyric>[\s\S]+<lyric_zz>(.+?)<\/lyric_zz>/,
  parseLyricInfo(str) {
    let result = str.match(this.lrcInfoRxp)
    return result ? { lyric: result[1], lyric_zz: result[2] } : null
  },
  getLyric(songId, isGetLyricx = false) {
    const requestObj = httpFetch(`http://player.kuwo.cn/webmusic/st/getNewMuiseByRid?rid=MUSIC_${songId}`)
    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      console.log(body)
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
 */
