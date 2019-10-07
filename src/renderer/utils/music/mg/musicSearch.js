// import '../../polyfill/array.find'
// import jshtmlencode from 'js-htmlencode'
import { httpFetch } from '../../request'
import { sizeFormate } from '../../index'
// import { debug } from '../../utils/env'
// import { formatSinger } from './util'

let searchRequest
export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page) {
    if (searchRequest && searchRequest.cancelHttp) searchRequest.cancelHttp()
    searchRequest = httpFetch(`https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/search_all.do?isCopyright=1&isCorrect=1&pageNo=${page}&pageSize=${this.limit}&searchSwitch={%22song%22:1,%22album%22:0,%22singer%22:0,%22tagSong%22:0,%22mvSong%22:0,%22songlist%22:0,%22bestShow%22:0}&sort=0&text=${encodeURIComponent(str)}`)
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
      item.rateFormats && item.rateFormats.forEach(type => {
        let size
        switch (type.formatType) {
          case 'PQ':
            size = sizeFormate(type.size)
            types.push({ type: '128k', size })
            _types['128k'] = {
              size,
            }
            break
          case 'HQ':
            size = sizeFormate(type.size)
            types.push({ type: '320k', size })
            _types['320k'] = {
              size,
            }
            break
          case 'SQ':
            size = sizeFormate(type.size)
            types.push({ type: 'flac', size })
            _types.flac = {
              size,
            }
            break
        }
      })

      const albumNInfo = item.albums && item.albums.length ? {
        id: item.albums[0].id,
        name: item.albums[0].name,
      } : {}

      list.push({
        singer: this.getSinger(item.singers),
        name: item.name,
        albumName: albumNInfo.name,
        albumId: albumNInfo.id,
        songmid: item.id,
        copyrightId: item.copyrightId,
        source: 'mg',
        interval: null,
        img: item.imgItems && item.imgItems.length ? item.imgItems[0].img : null,
        lrc: null,
        lrcUrl: item.lyricUrl,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
  search(str, page = 1, { limit } = {}) {
    if (limit != null) this.limit = limit
    // http://newlyric.kuwo.cn/newlyric.lrc?62355680
    return this.musicSearch(str, page).then(result => {
      if (!result || result.code !== '000000') return this.search(str, page, { limit })
      let list = this.handleResult(result.songResultData.resultList.flat())

      if (list == null) return this.search(str, page, { limit })

      this.total = parseInt(result.songResultData.totalCount)
      this.page = page
      this.allPage = Math.ceil(this.total / this.limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        limit: this.limit,
        total: this.total,
        source: 'mg',
      })
    })
  },
}
