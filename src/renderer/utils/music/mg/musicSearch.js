// import '../../polyfill/array.find'

import { httpFetch } from '../../request'
import { sizeFormate } from '../../index'
// import { debug } from '../../utils/env'
// import { formatSinger } from './util'

export default {
  limit: 20,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page, limit) {
    const searchRequest = httpFetch(`http://pd.musicapp.migu.cn/MIGUM2.0/v1.0/content/search_all.do?ua=Android_migu&version=5.0.1&text=${encodeURIComponent(str)}&pageNo=${page}&pageSize=${limit}&searchSwitch=%7B%22song%22%3A1%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A0%2C%22mvSong%22%3A0%2C%22songlist%22%3A0%2C%22bestShow%22%3A1%7D`, {
    // searchRequest = httpFetch(`http://jadeite.migu.cn:7090/music_search/v2/search/searchAll?sid=4f87090d01c84984a11976b828e2b02c18946be88a6b4c47bcdc92fbd40762db&isCorrect=1&isCopyright=1&searchSwitch=%7B%22song%22%3A1%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A1%2C%22mvSong%22%3A0%2C%22bestShow%22%3A1%2C%22songlist%22%3A0%2C%22lyricSong%22%3A0%7D&pageSize=${limit}&text=${encodeURIComponent(str)}&pageNo=${page}&sort=0`, {
      headers: {
        // sign: 'c3b7ae985e2206e97f1b2de8f88691e2',
        // timestamp: 1578225871982,
        // appId: 'yyapp2',
        // mode: 'android',
        // ua: 'Android_migu',
        // version: '6.9.4',
        osVersion: 'android 7.0',
        'User-Agent': 'okhttp/3.9.1',
      },
    })
    // searchRequest = httpFetch(`https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/search_all.do?isCopyright=1&isCorrect=1&pageNo=${page}&pageSize=${limit}&searchSwitch={%22song%22:1,%22album%22:0,%22singer%22:0,%22tagSong%22:0,%22mvSong%22:0,%22songlist%22:0,%22bestShow%22:0}&sort=0&text=${encodeURIComponent(str)}`)
    return searchRequest.promise.then(({ body }) => body)
  },
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.name)
    })
    return arr.join('、')
  },
  handleResult(rawData) {
    // console.log(rawData)
    let ids = new Set()
    const list = []
    rawData.forEach(item => {
      if (ids.has(item.id)) return
      ids.add(item.id)
      const types = []
      const _types = {}
      item.newRateFormats && item.newRateFormats.forEach(type => {
        let size
        switch (type.formatType) {
          case 'PQ':
            size = sizeFormate(type.size ?? type.androidSize)
            types.push({ type: '128k', size })
            _types['128k'] = {
              size,
            }
            break
          case 'HQ':
            size = sizeFormate(type.size ?? type.androidSize)
            types.push({ type: '320k', size })
            _types['320k'] = {
              size,
            }
            break
          case 'SQ':
            size = sizeFormate(type.size ?? type.androidSize)
            types.push({ type: 'flac', size })
            _types.flac = {
              size,
            }
            break
          case 'ZQ':
            size = sizeFormate(type.size ?? type.androidSize)
            types.push({ type: 'flac32bit', size })
            _types.flac32bit = {
              size,
            }
            break
        }
      })

      const albumNInfo = item.albums && item.albums.length
        ? {
            id: item.albums[0].id,
            name: item.albums[0].name,
          }
        : {}

      list.push({
        singer: this.getSinger(item.singers),
        name: item.name,
        albumName: albumNInfo.name,
        albumId: albumNInfo.id,
        songmid: item.id,
        songId: item.songId,
        copyrightId: item.copyrightId,
        source: 'mg',
        interval: null,
        img: item.imgItems && item.imgItems.length ? item.imgItems[0].img : null,
        lrc: null,
        lrcUrl: item.lyricUrl,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
  search(str, page = 1, { limit } = {}, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit
    // http://newlyric.kuwo.cn/newlyric.lrc?62355680
    return this.musicSearch(str, page, limit).then(result => {
      // console.log(result)
      if (!result || result.code !== '000000') return Promise.reject(new Error(result ? result.info : '搜索失败'))
      const songResultData = result.songResultData || { result: [], totalCount: 0 }

      let list = this.handleResult(songResultData.result)
      if (list == null) return this.search(str, page, { limit }, retryNum)

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
