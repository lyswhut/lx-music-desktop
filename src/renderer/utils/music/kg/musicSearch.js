// import '../../polyfill/array.find'
// import jshtmlencode from 'js-htmlencode'
import { httpFetch } from '../../request'
import { decodeName, formatPlayTime, sizeFormate } from '../../index'
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
    searchRequest = httpFetch(`http://ioscdn.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(str)}&page=${page}&pagesize=${this.limit}&showtype=10&plat=2&version=7910&tag=1&correct=1&privilege=1&sver=5`)
    return searchRequest.promise.then(({ body }) => body)
  },
  handleResult(rawData) {
    // console.log(rawData)
    let ids = new Set()
    const list = []
    rawData.forEach(item => {
      if (ids.has(item.audio_id)) return
      ids.add(item.audio_id)
      const types = []
      const _types = {}
      if (item.filesize !== 0) {
        let size = sizeFormate(item.filesize)
        types.push({ type: '128k', size, hash: item.hash })
        _types['128k'] = {
          size,
          hash: item.hash,
        }
      }
      if (item['320filesize'] !== 0) {
        let size = sizeFormate(item['320filesize'])
        types.push({ type: '320k', size, hash: item['320hash'] })
        _types['320k'] = {
          size,
          hash: item['320hash'],
        }
      }
      if (item.sqfilesize !== 0) {
        let size = sizeFormate(item.sqfilesize)
        types.push({ type: 'flac', size, hash: item.sqhash })
        _types.flac = {
          size,
          hash: item.sqhash,
        }
      }
      list.push({
        singer: decodeName(item.singername),
        name: decodeName(item.songname),
        albumName: decodeName(item.album_name),
        albumId: item.album_id,
        songmid: item.audio_id,
        source: 'kg',
        interval: formatPlayTime(item.duration),
        _interval: item.duration,
        img: null,
        lrc: null,
        hash: item.hash,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
  search(str, page = 1, { limit } = {}, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit != null) this.limit = limit
    // http://newlyric.kuwo.cn/newlyric.lrc?62355680
    return this.musicSearch(str, page).then(result => {
      if (!result || result.errcode !== 0) return this.search(str, page, { limit }, retryNum)
      let list = this.handleResult(result.data.info)

      if (list == null) return this.search(str, page, { limit }, retryNum)

      this.total = result.data.total
      this.page = page
      this.allPage = Math.ceil(this.total / this.limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        limit: this.limit,
        total: this.total,
        source: 'kg',
      })
    })
  },
}
