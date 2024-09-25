import { httpFetch } from '../../request'
import { decodeKrc } from '@common/utils/lyricUtils/kg'

export default {
  getIntv(interval) {
    if (!interval) return 0
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
    let requestObj = httpFetch(`http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(name)}&hash=${hash}&timelength=${time}&lrctxt=1`, {
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
        return { id: info.id, accessKey: info.accesskey, fmt: (info.krctype == 1 && info.contenttype != 1) ? 'krc' : 'lrc' }
      }
      return null
    })
    return requestObj
  },
  getLyricDownload(id, accessKey, fmt, tryNum = 0) {
    let requestObj = httpFetch(`http://lyrics.kugou.com/download?ver=1&client=pc&id=${id}&accesskey=${accessKey}&fmt=${fmt}&charset=utf8`, {
      headers: {
        'KG-RC': 1,
        'KG-THash': 'expand_search_manager.cpp:852736169:451',
        'User-Agent': 'KuGou2012-9020-ExpandSearchManager',
      },
    })
    requestObj.promise = requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        if (tryNum > 5) return Promise.reject(new Error('歌词获取失败'))
        let tryRequestObj = this.getLyric(id, accessKey, fmt, ++tryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }

      switch (body.fmt) {
        case 'krc':
          return decodeKrc(body.content)
        case 'lrc':
          return {
            lyric: Buffer.from(body.content, 'base64').toString('utf-8'),
            tlyric: '',
            rlyric: '',
            lxlyric: '',
          }
        default:
          return Promise.reject(new Error(`未知歌词格式: ${body.fmt}`))
      }
    })

    return requestObj
  },
  getLyric(songInfo, tryNum = 0) {
    let requestObj = this.searchLyric(songInfo.name, songInfo.hash, songInfo._interval || this.getIntv(songInfo.interval))

    requestObj.promise = requestObj.promise.then(result => {
      if (!result) return Promise.reject(new Error('Get lyric failed'))

      let requestObj2 = this.getLyricDownload(result.id, result.accessKey, result.fmt)

      requestObj.cancelHttp = requestObj2.cancelHttp.bind(requestObj2)

      return requestObj2.promise
    })
    return requestObj
  },
}
