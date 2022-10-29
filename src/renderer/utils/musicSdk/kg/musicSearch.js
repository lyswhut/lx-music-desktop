// import '../../polyfill/array.find'

import { httpFetch } from '../../request'
import { decodeName, formatPlayTime, sizeFormate } from '../../index'
// import { debug } from '../../utils/env'
// import { formatSinger } from './util'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page, limit) {
    const searchRequest = httpFetch(`http://ioscdn.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(str)}&page=${page}&pagesize=${limit}&showtype=10&plat=2&version=7910&tag=1&correct=1&privilege=1&sver=5`)
    return searchRequest.promise.then(({ body }) => body)
  },
  filterData(rawData) {
    const types = []
    const _types = {}
    if (rawData.filesize !== 0) {
      let size = sizeFormate(rawData.filesize)
      types.push({ type: '128k', size, hash: rawData.hash })
      _types['128k'] = {
        size,
        hash: rawData.hash,
      }
    }
    if (rawData['320filesize'] !== 0) {
      let size = sizeFormate(rawData['320filesize'])
      types.push({ type: '320k', size, hash: rawData['320hash'] })
      _types['320k'] = {
        size,
        hash: rawData['320hash'],
      }
    }
    if (rawData.sqfilesize !== 0) {
      let size = sizeFormate(rawData.sqfilesize)
      types.push({ type: 'flac', size, hash: rawData.sqhash })
      _types.flac = {
        size,
        hash: rawData.sqhash,
      }
    }
    return {
      singer: decodeName(rawData.singername),
      name: decodeName(rawData.songname),
      albumName: decodeName(rawData.album_name),
      albumId: rawData.album_id,
      songmid: rawData.audio_id,
      source: 'kg',
      interval: formatPlayTime(rawData.duration),
      _interval: rawData.duration,
      img: null,
      lrc: null,
      otherSource: null,
      hash: rawData.hash,
      types,
      _types,
      typeUrl: {},
    }
  },
  handleResult(rawData) {
    // console.log(rawData)
    let ids = new Set()
    const list = []
    rawData.forEach(item => {
      const key = item.audio_id + item.hash
      if (ids.has(key)) return
      ids.add(key)
      list.push(this.filterData(item))
      for (const childItem of item.group) {
        const key = item.audio_id + item.hash
        if (ids.has(key)) return
        ids.add(key)
        list.push(this.filterData(childItem))
      }
    })
    return list
  },
  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit
    // http://newlyric.kuwo.cn/newlyric.lrc?62355680
    return this.musicSearch(str, page, limit).then(result => {
      if (!result || result.errcode !== 0) return this.search(str, page, limit, retryNum)
      let list = this.handleResult(result.data.info)

      if (list == null) return this.search(str, page, limit, retryNum)

      this.total = result.data.total
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        limit,
        total: this.total,
        source: 'kg',
      })
    })
  },
}
