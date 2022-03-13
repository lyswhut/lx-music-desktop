import { httpFetch } from '../../request'
import { decodeLyric } from './util'
import { decodeName } from '../../index'

/*
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
        const tItem = lrc.pop()
        tItem.time = lrc[lrc.length - 1].time
        lrcT.push(tItem)
        lrc.push(item)
      } else {
        lrc.push(item)
        lrcSet.add(item.time)
      }
    }

    if (lrcT.length && lrc.length > lrcT.length) {
      const tItem = lrc.pop()
      tItem.time = lrc[lrc.length - 1].time
      lrcT.push(tItem)
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
      let lrcInfo
      try {
        lrcInfo = this.sortLrcArr(body.data.lrclist)
      } catch {
        return Promise.reject(new Error('Get lyric failed'))
      }
      // console.log(body.data.lrclist)
      // console.log(lrcInfo.lrc, lrcInfo.lrcT)
      // console.log({
      //   lyric: decodeName(this.transformLrc(body.data.songinfo, lrc)),
      //   tlyric: decodeName(this.transformLrc(body.data.songinfo, lrcT)),
      // })
      return {
        lyric: decodeName(this.transformLrc(body.data.songinfo, lrcInfo.lrc)),
        tlyric: lrcInfo.lrcT.length ? decodeName(this.transformLrc(body.data.songinfo, lrcInfo.lrcT)) : '',
      }
    })
    return requestObj
  },
}
 */

const buf_key = Buffer.from('yeelion')
const buf_key_len = buf_key.length
const buildParams = (id, isGetLyricx) => {
  let params = `user=12345,web,web,web&requester=localhost&req=1&rid=MUSIC_${id}`
  if (isGetLyricx) params += '&lrcx=1'
  const buf_str = Buffer.from(params)
  const buf_str_len = buf_str.length
  const output = new Uint16Array(buf_str_len)
  let i = 0
  while (i < buf_str_len) {
    let j = 0
    while (j < buf_key_len && i < buf_str_len) {
      output[i] = buf_key[j] ^ buf_str[i]
      i++
      j++
    }
  }
  return Buffer.from(output).toString('base64')
}

// console.log(buildParams('207527604', false))
// console.log(buildParams('207527604', true))

const timeExp = /^\[([\d:.]*)\]{1}/g
export default {
  sortLrcArr(arr) {
    const lrcSet = new Set()
    let lrc = []
    let lrcT = []

    for (const item of arr) {
      if (lrcSet.has(item.time)) {
        const tItem = lrc.pop()
        tItem.time = lrc[lrc.length - 1].time
        lrcT.push(tItem)
        lrc.push(item)
      } else {
        lrc.push(item)
        lrcSet.add(item.time)
      }
    }

    if (lrcT.length && lrc.length > lrcT.length) {
      const tItem = lrc.pop()
      tItem.time = lrc[lrc.length - 1].time
      lrcT.push(tItem)
    }

    return {
      lrc,
      lrcT,
    }
  },
  transformLrc(songinfo, lrclist) {
    return `[ti:${songinfo.name ?? ''}]\n[ar:${songinfo.singer ?? ''}]\n[al:${songinfo.albumName ?? ''}]\n[by:]\n[offset:0]\n${lrclist ? lrclist.map(l => `[${l.time}]${l.text}\n`).join('') : '暂无歌词'}`
  },
  parseLrc(musicInfo, lrc) {
    const lines = lrc.split(/\r\n|\r|\n/)
    let lrcArr = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      let result = timeExp.exec(line)
      if (result) {
        const text = line.replace(timeExp, '').trim()
        lrcArr.push({
          time: RegExp.$1,
          text,
        })
      }
    }
    const lrcInfo = this.sortLrcArr(lrcArr)
    return {
      lyric: decodeName(this.transformLrc(musicInfo, lrcInfo.lrc)),
      tlyric: lrcInfo.lrcT.length ? decodeName(this.transformLrc(musicInfo, lrcInfo.lrcT)) : '',
    }
  },
  getLyric(musicInfo, isGetLyricx = false) {
    const requestObj = httpFetch(`http://newlyric.kuwo.cn/newlyric.lrc?${buildParams(musicInfo.songmid, isGetLyricx)}`)
    requestObj.promise = requestObj.promise.then(({ statusCode, body, raw }) => {
      if (statusCode != 200) return Promise.reject(new Error(JSON.stringify(body)))
      return decodeLyric({ lrcBase64: raw.toString('base64'), isGetLyricx }).then(base64Data => {
        let lrcInfo
        try {
          lrcInfo = this.parseLrc(musicInfo, Buffer.from(base64Data, 'base64').toString())
        } catch {
          return Promise.reject(new Error('Get lyric failed'))
        }
        // console.log(lrcInfo)
        return lrcInfo
      })
    })
    return requestObj
  },
}
