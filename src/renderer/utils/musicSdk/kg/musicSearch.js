import { httpFetch } from '../../request'
import { decodeName, formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'


export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page, limit) {
    const searchRequest = httpFetch(`https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(str)}&page=${page}&pagesize=${limit}&userid=0&clientver=&platform=WebFilter&filter=2&iscorrection=1&privilege_filter=0`)
    return searchRequest.promise.then(({ body }) => body)
  },
  filterData(rawData) {
    const types = []
    const _types = {}
    if (rawData.FileSize !== 0) {
      let size = sizeFormate(rawData.FileSize)
      types.push({ type: '128k', size, hash: rawData.FileHash })
      _types['128k'] = {
        size,
        hash: rawData.FileHash,
      }
    }
    if (rawData.HQFileSize !== 0) {
      let size = sizeFormate(rawData.HQFileSize)
      types.push({ type: '320k', size, hash: rawData.HQFileHash })
      _types['320k'] = {
        size,
        hash: rawData.HQFileHash,
      }
    }
    if (rawData.SQFileSize !== 0) {
      let size = sizeFormate(rawData.SQFileSize)
      types.push({ type: 'flac', size, hash: rawData.SQFileHash })
      _types.flac = {
        size,
        hash: rawData.SQFileHash,
      }
    }
    if (rawData.ResFileSize !== 0) {
      let size = sizeFormate(rawData.ResFileSize)
      types.push({ type: 'flac24bit', size, hash: rawData.ResFileHash })
      _types.flac24bit = {
        size,
        hash: rawData.ResFileHash,
      }
    }
    return {
      singer: decodeName(formatSingerName(rawData.Singers, 'name')),
      name: decodeName(rawData.SongName),
      albumName: decodeName(rawData.AlbumName),
      albumId: rawData.AlbumID,
      songmid: rawData.Audioid,
      source: 'kg',
      interval: formatPlayTime(rawData.Duration),
      _interval: rawData.Duration,
      img: null,
      lrc: null,
      otherSource: null,
      hash: rawData.FileHash,
      types,
      _types,
      typeUrl: {},
    }
  },
  handleResult(rawData) {
    let ids = new Set()
    const list = []
    rawData.forEach(item => {
      const key = item.Audioid + item.FileHash
      if (ids.has(key)) return
      ids.add(key)
      list.push(this.filterData(item))
      for (const childItem of item.Grp) {
        const key = item.Audioid + item.FileHash
        if (ids.has(key)) continue
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
      if (!result || result.error_code !== 0) return this.search(str, page, limit, retryNum)
      let list = this.handleResult(result.data.lists)

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
