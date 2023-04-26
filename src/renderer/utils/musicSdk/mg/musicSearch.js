import { sizeFormate, formatPlayTime, getSingerName } from '../../index'
import { toMD5 } from '../utils'
import { createHttpFetch } from './util'

const searchSign = (timeStr, str, deviceId) => {
  const key = '6cdc72a439cef99a3418d2a78aa28c73'
  return toMD5(`${str}${key}yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${timeStr}`)
}

export default {
  limit: 20,
  total: 0,
  page: 0,
  allPage: 1,
  deviceId: '963B7AA0D21511ED807EE5846EC87D20',
  musicSearch(str, page, limit) {
    // searchRequest = httpFetch(`https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/search_all.do?isCopyright=1&isCorrect=1&pageNo=${page}&pageSize=${limit}&searchSwitch={%22song%22:1,%22album%22:0,%22singer%22:0,%22tagSong%22:0,%22mvSong%22:0,%22songlist%22:0,%22bestShow%22:0}&sort=0&text=${encodeURIComponent(str)}`)
    const timeStr = Date.now().toString()
    const signResult = searchSign(timeStr, str, this.deviceId)
    return createHttpFetch(`https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=1&isCopyright=1&searchSwitch=%7B%22song%22%3A1%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A1%2C%22mvSong%22%3A0%2C%22bestShow%22%3A1%2C%22songlist%22%3A0%2C%22lyricSong%22%3A0%7D&pageSize=${limit}&text=${encodeURIComponent(str)}&pageNo=${page}&sort=0`, {
      headers: {
        uiVersion: 'A_music_3.6.1',
        deviceId: this.deviceId,
        timestamp: timeStr,
        sign: signResult,
        channel: '0146921',
        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 11.0.0; zh-cn; MI 11 Build/OPR1.170623.032) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
      },
    }).then(body => body)
  },
  filterList(raw) {
    const ids = new Set()
    const list = []

    raw.forEach(item => {
      if (!item.songId || !item.copyrightId || ids.has(item.copyrightId)) return
      ids.add(item.copyrightId)

      const types = []
      const _types = {}
      item.audioFormats && item.audioFormats.forEach(type => {
        let size
        switch (type.formatType) {
          case 'PQ':
            size = sizeFormate(type.asize ?? type.isize)
            types.push({ type: '128k', size })
            _types['128k'] = {
              size,
            }
            break
          case 'HQ':
            size = sizeFormate(type.asize ?? type.isize)
            types.push({ type: '320k', size })
            _types['320k'] = {
              size,
            }
            break
          case 'SQ':
            size = sizeFormate(type.asize ?? type.isize)
            types.push({ type: 'flac', size })
            _types.flac = {
              size,
            }
            break
          case 'ZQ24':
            size = sizeFormate(type.asize ?? type.isize)
            types.push({ type: 'flac24bit', size })
            _types.flac24bit = {
              size,
            }
            break
        }
      })

      let img = item.img3 || item.img2 || item.img1 || null
      if (img && !/https?:/.test(item.img3)) img = 'http://d.musicapp.migu.cn' + img

      list.push({
        singer: getSingerName(item.singerList, 'name'),
        name: item.name,
        albumName: item.album,
        albumId: item.albumId,
        songmid: item.songId,
        copyrightId: item.copyrightId,
        source: 'mg',
        interval: formatPlayTime(item.duration),
        img,
        lrc: null,
        lrcUrl: item.lrcUrl,
        mrcUrl: item.mrcurl,
        trcUrl: item.trcUrl,
        types,
        _types,
        typeUrl: {},
      })
    })

    return list
  },
  handleResult(rawData) {
    return this.filterList(rawData.flat())
  },
  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    return this.musicSearch(str, page, limit).then(data => {
      const songResultData = data.songResultData || { resultList: [], totalCount: 0 }

      let list = this.handleResult(songResultData.resultList)
      if (list == null) return this.search(str, page, limit, retryNum)

      this.total = parseInt(songResultData.totalCount)
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        limit,
        total: this.total,
        source: 'mg',
      })
    })
  },
}
