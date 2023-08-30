import { httpFetch } from '../../request'
import { decodeLyric } from './util'
import { decodeName } from '../../index'

const headExp = /^.*\[id:\$\w+\]\n/

const parseLyric = str => {
  str = str.replace(/\r/g, '')
  if (headExp.test(str)) str = str.replace(headExp, '')
  let trans = str.match(/\[language:([\w=\\/+]+)\]/)
  let lyric
  let rlyric
  let tlyric
  if (trans) {
    str = str.replace(/\[language:[\w=\\/+]+\]\n/, '')
    let json = JSON.parse(Buffer.from(trans[1], 'base64').toString())
    for (const item of json.content) {
      switch (item.type) {
        case 0:
          rlyric = item.lyricContent
          break
        case 1:
          tlyric = item.lyricContent
          break
      }
    }
  }
  let i = 0
  let lxlyric = str.replace(/\[((\d+),\d+)\].*/g, str => {
    let result = str.match(/\[((\d+),\d+)\].*/)
    let time = parseInt(result[2])
    let ms = time % 1000
    time /= 1000
    let m = parseInt(time / 60).toString().padStart(2, '0')
    time %= 60
    let s = parseInt(time).toString().padStart(2, '0')
    time = `${m}:${s}.${ms}`
    if (rlyric) rlyric[i] = `[${time}]${rlyric[i]?.join('') ?? ''}`
    if (tlyric) tlyric[i] = `[${time}]${tlyric[i]?.join('') ?? ''}`
    i++
    return str.replace(result[1], time)
  })
  rlyric = rlyric ? rlyric.join('\n') : ''
  tlyric = tlyric ? tlyric.join('\n') : ''
  lxlyric = lxlyric.replace(/<(\d+,\d+),\d+>/g, '<$1>')
  lxlyric = decodeName(lxlyric)
  lyric = lxlyric.replace(/<\d+,\d+>/g, '')
  rlyric = decodeName(rlyric)
  tlyric = decodeName(tlyric)
  return {
    lyric,
    tlyric,
    rlyric,
    lxlyric,
  }
}

export default {
  getIntv(interval) {
    let intvArr = interval.split(':')
    let intv = 0
    let unit = 1
    while (intvArr.length) {
      intv += (intvArr.pop()) * unit
      unit *= 60
    }
    return parseInt(intv)
  },
  // getLyric(songInfo, tryNum = 0) {
  //   let requestObj = httpFetch(`http://m.kugou.com/app/i/krc.php?cmd=100&keyword=${encodeURIComponent(songInfo.name)}&hash=${songInfo.hash}&timelength=${songInfo._interval || this.getIntv(songInfo.interval)}&d=0.38664927426725626`, {
  //     headers: {
  //       'KG-RC': 1,
  //       'KG-THash': 'expand_search_manager.cpp:852736169:451',
  //       'User-Agent': 'KuGou2012-9020-ExpandSearchManager',
  //     },
  //   })
  //   requestObj.promise = requestObj.promise.then(({ body, statusCode }) => {
  //     if (statusCode !== 200) {
  //       if (tryNum > 5) return Promise.reject(new Error('歌词获取失败'))
  //       let tryRequestObj = this.getLyric(songInfo, ++tryNum)
  //       requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
  //       return tryRequestObj.promise
  //     }
  //     return {
  //       lyric: body,
  //       tlyric: '',
  //     }
  //   })
  //   return requestObj
  // },
  searchLyric(name, hash, time, tryNum = 0) {
    let requestObj = httpFetch(`http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(name)}&hash=${hash}&timelength=${time}`, {
      headers: {
        'KG-RC': 1,
        'KG-THash': 'expand_search_manager.cpp:852736169:451',
        'User-Agent': 'KuGou2012-9020-ExpandSearchManager',
      },
    })
    requestObj.promise = requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        if (tryNum > 5) return Promise.reject(new Error('歌词获取失败'))
        let tryRequestObj = this.searchLyric(name, hash, time, ++tryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }
      if (body.candidates.length) {
        let info = body.candidates[0]
        return { id: info.id, accessKey: info.accesskey }
      }
      return null
    })
    return requestObj
  },
  getLyricDownload(id, accessKey, tryNum = 0) {
    let requestObj = httpFetch(`http://lyrics.kugou.com/download?ver=1&client=pc&id=${id}&accesskey=${accessKey}&fmt=krc&charset=utf8`, {
      headers: {
        'KG-RC': 1,
        'KG-THash': 'expand_search_manager.cpp:852736169:451',
        'User-Agent': 'KuGou2012-9020-ExpandSearchManager',
      },
    })
    requestObj.promise = requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        if (tryNum > 5) return Promise.reject(new Error('歌词获取失败'))
        let tryRequestObj = this.getLyric(id, accessKey, ++tryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }

      return decodeLyric(body.content).then(result => parseLyric(result))
    })
    return requestObj
  },
  getLyric(songInfo, tryNum = 0) {
    let requestObj = this.searchLyric(songInfo.name, songInfo.hash, songInfo._interval || this.getIntv(songInfo.interval))

    requestObj.promise = requestObj.promise.then(result => {
      if (!result) return Promise.reject(new Error('Get lyric failed'))

      let requestObj2 = this.getLyricDownload(result.id, result.accessKey)

      requestObj.cancelHttp = requestObj2.cancelHttp.bind(requestObj2)

      return requestObj2.promise
    })
    return requestObj
  },
}
