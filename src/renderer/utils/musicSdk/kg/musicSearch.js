import { httpFetch } from '../../request'
import { decodeName, formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'


export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page, limit) {
    const searchRequest = httpFetch(`http://songsearch.kugou.com/song_search_v2?platform=AndroidFilter&iscorrection=1&keyword=${encodeURIComponent(str)}&hifiquality=0&pagesize=${limit}&PrivilegeFilter=0&page=${page}`)
    const promise = searchRequest.promise.then(({ body }) => body)
    promise.cancel = () => searchRequest.cancelHttp?.()
    return promise
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
      artists: rawData.Singers?.map(artist => ({ id: artist.id, name: decodeName(artist.name) })),
      name: decodeName(`${rawData.OriSongName}${rawData.Suffix ? ` ${rawData.Suffix}` : ''}`),
      albumName: decodeName(rawData.AlbumName),
      albumId: rawData.AlbumID,
      songmid: rawData.Audioid,
      albumAudioId: rawData.MixSongID,
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
  search(str, page = 1, limit, retryNum = 0, cancelState = { cancelled: false, request: null }) {
    if (cancelState.cancelled) return Promise.reject(new Error('request cancelled'))
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit
    // http://newlyric.kuwo.cn/newlyric.lrc?62355680
    const request = this.musicSearch(str, page, limit)
    cancelState.request = request
    const promise = request.then(result => {
      if (cancelState.cancelled) throw new Error('request cancelled')
      if (!result || result.error_code !== 0) return this.search(str, page, limit, retryNum, cancelState)
      let list = this.handleResult(result.data.lists)

      if (list == null) return this.search(str, page, limit, retryNum, cancelState)

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
    promise.cancel = () => {
      cancelState.cancelled = true
      cancelState.request?.cancel?.()
    }
    return promise
  },
}
