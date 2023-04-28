import { httpFetch } from '../../request'
import { decodeName, formatPlayTime, sizeFormate } from '../../index'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page, limit) {
    const searchRequest = httpFetch(`https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(str)}&page=${page}&pagesize=${limit}&userid=0&clientver=&platform=WebFilter&filter=2&iscorrection=1&privilege_filter=0`)
    return searchRequest.promise.then(({ body }) => body)
  },
  filterList(raw) {
    let ids = new Set()
    const list = []

    raw.forEach(item => {
      if (ids.has(item.Audioid) || !item.Audioid) return
      ids.add(item.Audioid)

      const types = []
      const _types = {}
      if (item.FileSize !== 0) {
        let size = sizeFormate(item.FileSize)
        types.push({ type: '128k', size, hash: item.FileHash })
        _types['128k'] = {
          size,
          hash: item.FileHash,
        }
      }
      if (item.HQFileSize !== 0) {
        let size = sizeFormate(item.HQFileSize)
        types.push({ type: '320k', size, hash: item.HQFileHash })
        _types['320k'] = {
          size,
          hash: item.HQFileHash,
        }
      }
      if (item.SQFileSize !== 0) {
        let size = sizeFormate(item.SQFileSize)
        types.push({ type: 'flac', size, hash: item.SQFileHash })
        _types.flac = {
          size,
          hash: item.SQFileHash,
        }
      }
      if (item.ResFileSize !== 0) {
        let size = sizeFormate(item.ResFileSize)
        types.push({ type: 'flac24bit', size, hash: item.ResFileHash })
        _types.flac24bit = {
          size,
          hash: item.ResFileHash,
        }
      }
      list.push({
        singer: decodeName(item.SingerName),
        name: decodeName(item.SongName),
        albumName: decodeName(item.AlbumName),
        albumId: item.AlbumID,
        songmid: item.Audioid,
        source: 'kg',
        interval: formatPlayTime(item.Duration),
        _interval: item.Duration,
        img: null,
        lrc: null,
        otherSource: null,
        hash: item.FileHash,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
  handleResult(raw) {
    const handleList = []

    raw.forEach(item => {
      handleList.push(item)
      if (item.Grp.length === 0) return
      for (const e in item.Grp) {
        handleList.push(e)
      }
    })
    return this.filterList(handleList)
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
