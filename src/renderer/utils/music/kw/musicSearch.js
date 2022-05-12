// import '../../polyfill/array.find'

import { httpFetch } from '../../request'
import { formatPlayTime, decodeName } from '../../index'
// import { debug } from '../../utils/env'
import { formatSinger } from './util'

export default {
  regExps: {
    mInfo: /bitrate:(\d+),format:(\w+),size:([\w.]+)/,
  },
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  // cancelFn: null,
  musicSearch(str, page, limit) {
    const musicSearchRequestObj = httpFetch(`http://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(str)}&pn=${page - 1}&rn=${limit}&uid=794762570&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newver=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1&issubtitle=1`)
    return musicSearchRequestObj.promise
  },
  // getImg(songId) {
  //   return httpGet(`http://player.kuwo.cn/webmusic/sj/dtflagdate?flag=6&rid=MUSIC_${songId}`)
  // },
  // getLrc(songId) {
  //   return httpGet(`http://mobile.kuwo.cn/mpage/html5/songinfoandlrc?mid=${songId}&flag=0`)
  // },
  handleResult(rawData) {
    const result = []
    if (!rawData) return result
    for (let i = 0; i < rawData.length; i++) {
      const info = rawData[i]
      let songId = info.MUSICRID.replace('MUSIC_', '')
      // const format = (info.FORMATS || info.formats).split('|')

      if (!info.MINFO) {
        console.log('mInfo is undefined')
        return null
      }

      const types = []
      const _types = {}

      let infoArr = info.MINFO.split(';')
      infoArr.forEach(info => {
        info = info.match(this.regExps.mInfo)
        if (info) {
          switch (info[2]) {
            case 'flac':
              types.push({ type: 'flac', size: info[3] })
              _types.flac = {
                size: info[3].toLocaleUpperCase(),
              }
              break
            // case 'ape':
            //   types.push({ type: 'ape', size: info[3] })
            //   _types.ape = {
            //     size: info[3].toLocaleUpperCase(),
            //   }
            //   break
            case 'mp3':
              switch (info[1]) {
                case '320':
                  types.push({ type: '320k', size: info[3] })
                  _types['320k'] = {
                    size: info[3].toLocaleUpperCase(),
                  }
                  break
                case '192':
                //   types.push({ type: '192k', size: info[3] })
                //   _types['192k'] = {
                //     size: info[3].toLocaleUpperCase(),
                //   }
                //   break
                case '128':
                  types.push({ type: '128k', size: info[3] })
                  _types['128k'] = {
                    size: info[3].toLocaleUpperCase(),
                  }
                  break
              }
              break
          }
        }
      })
      types.reverse()

      let interval = parseInt(info.DURATION)

      result.push({
        name: decodeName(info.SONGNAME),
        singer: formatSinger(decodeName(info.ARTIST)),
        source: 'kw',
        // img = (info.album.name === '' || info.album.name === '空')
        //   ? `http://player.kuwo.cn/webmusic/sj/dtflagdate?flag=6&rid=MUSIC_160911.jpg`
        //   : `https://y.gtimg.cn/music/photo_new/T002R500x500M000${info.album.mid}.jpg`
        songmid: songId,
        albumId: decodeName(info.ALBUMID || ''),
        interval: Number.isNaN(interval) ? 0 : formatPlayTime(interval),
        albumName: info.ALBUM ? decodeName(info.ALBUM) : '',
        lrc: null,
        img: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    }
    return result
  },
  search(str, page = 1, { limit } = {}, retryNum = 0) {
    if (retryNum > 2) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit
    // http://newlyric.kuwo.cn/newlyric.lrc?62355680
    return this.musicSearch(str, page, limit).then(({ body: result }) => {
      // console.log(result)
      if (!result || (result.TOTAL !== '0' && result.SHOW === '0')) return this.search(str, page, { limit }, ++retryNum)
      let list = this.handleResult(result.abslist)

      if (list == null) return this.search(str, page, { limit })

      this.total = parseInt(result.TOTAL)
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        total: this.total,
        limit,
        source: 'kw',
      })
    })
  },
}
