import { httpGet, httpFetch } from '../../request'
import { xmRequest } from './util'

const parseLyric = str => {
  str = str.replace(/(?:<\d+>|\r)/g, '')
  let tlyric = []
  let lyric = str.replace(/\[[\d:.]+\].*?\n\[x-trans\].*/g, s => {
    // console.log(s)
    let [lrc, tlrc] = s.split('\n')
    tlrc = tlrc.replace('[x-trans]', lrc.replace(/^(\[[\d:.]+\]).*$/, '$1'))
    tlyric.push(tlrc)
    return lrc
  })
  tlyric = tlyric.join('\n')
  return {
    lyric,
    tlyric,
  }
}

export default {
  failTime: 0,
  expireTime: 60 * 1000 * 1000,
  getLyricFile_1(url, retryNum = 0) {
    if (retryNum > 5) return Promise.reject('歌词获取失败')
    let requestObj = httpFetch(url)
    requestObj.promise = requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        let tryRequestObj = this.getLyric(url, ++retryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }
      return url.endsWith('.xtrc') ? parseLyric(body) : {
        lyric: body,
        tlyric: '',
      }
    })
    return requestObj
  },
  getLyricFile_2(url, retryNum = 0) {
    if (retryNum > 5) return Promise.reject('歌词获取失败')
    return new Promise((resolve, reject) => {
      httpGet(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
          referer: 'https://www.xiami.com',
        },
      }, function(err, resp, body) {
        if (err || resp.statusCode !== 200) return this.getLyricFile(url, ++retryNum).then(resolve).catch(reject)
        return resolve(url.endsWith('.xtrc') ? parseLyric(body) : {
          lyric: body,
          tlyric: '',
        })
      })
    })
  },
  getLyricUrl_1(songInfo, retryNum = 0) {
    if (retryNum > 2) return Promise.reject('歌词获取失败')
    let requestObj = xmRequest('/api/lyric/getSongLyrics', { songId: songInfo.songmid })
    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200) {
        let tryRequestObj = this.getLyricUrl_1(songInfo, ++retryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }
      if (body.code !== 'SUCCESS') {
        this.failTime = Date.now()
        let tryRequestObj = this.getLyricUrl_2(songInfo)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }
      if (!body.result.data.lyrics.length) return Promise.reject(new Error('未找到歌词'))
      let lrc = body.result.data.lyrics.find(lyric => /\.(trc|lrc)$/.test(lyric.lyricUrl))
      return lrc
        ? lrc.lyricUrl.endsWith('.trc')
          ? parseLyric(lrc.content)
          : { lyric: lrc.content, tlyric: '' }
        : Promise.reject(new Error('未找到歌词'))
    })
    return requestObj
  },
  getLyricUrl_2(songInfo, retryNum = 0) {
    if (retryNum > 2) return Promise.reject('歌词获取失败')
    // https://github.com/listen1/listen1_chrome_extension/blob/2587e627d23a85e490628acc0b3c9b534bc8323d/js/provider/xiami.js#L149
    let requestObj = httpFetch(`https://emumo.xiami.com/song/playlist/id/${songInfo.songmid}/object_name/default/object_id/0/cat/json`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
        referer: 'https://www.xiami.com',
      },
    })
    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200 || !body.status) {
        let tryRequestObj = this.getLyricUrl_2(songInfo, ++retryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }
      let url = body.data.trackList[0].lyric_url
      if (!url) return Promise.reject(new Error('未找到歌词'))
      return this.getLyricFile_2(/^http:/.test(url) ? url : ('http:' + url))
    })
    return requestObj
  },
  getLyric(songInfo) {
    if (songInfo.lrcUrl && /\.(xtrc|lrc)$/.test(songInfo.lrcUrl)) return this.getLyricFile_1(songInfo.lrcUrl)
    return Date.now() - this.failTime > this.expireTime ? this.getLyricUrl_1(songInfo) : this.getLyricUrl_2(songInfo)
  },
}
