// import '../../polyfill/array.find'
// import jshtmlencode from 'js-htmlencode'
import { xmRequest } from './util'
import { formatPlayTime, sizeFormate } from '../../index'
// import { debug } from '../../utils/env'
// import { formatSinger } from './util'
// "cdcb72dc3eba41cb5bc4267f09183119_xmMain_/api/list/collect_{"pagingVO":{"page":1,"pageSize":60},"dataType":"system"}"
let searchRequest
export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page, limit) {
    if (searchRequest && searchRequest.cancelHttp) searchRequest.cancelHttp()
    searchRequest = xmRequest('/api/search/searchSongs', {
      key: str,
      pagingVO: {
        page: page,
        pageSize: limit,
      },
    })
    return searchRequest.promise.then(({ body }) => body)
  },
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.artistName)
    })
    return arr.join('、')
  },
  handleResult(rawData) {
    // console.log(rawData)
    let ids = new Set()
    const list = []
    rawData.forEach(songData => {
      if (!songData) return
      if (ids.has(songData.songId)) return
      ids.add(songData.songId)

      const types = []
      const _types = {}
      let size = null
      for (const item of songData.purviewRoleVOs) {
        if (!item.filesize) continue
        size = sizeFormate(item.filesize)
        switch (item.quality) {
          case 's':
            types.push({ type: 'wav', size })
            _types.wav = {
              size,
            }
            break
          case 'h':
            types.push({ type: '320k', size })
            _types['320k'] = {
              size,
            }
            break
          case 'l':
            types.push({ type: '128k', size })
            _types['128k'] = {
              size,
            }
            break
        }
      }
      types.reverse()

      list.push({
        singer: this.getSinger(songData.singerVOs),
        name: songData.songName,
        albumName: songData.albumName,
        albumId: songData.albumId,
        source: 'xm',
        interval: formatPlayTime(parseInt(songData.length / 1000)),
        songmid: songData.songId,
        img: songData.albumLogo || songData.albumLogoS,
        songStringId: songData.songStringId,
        lrc: null,
        lrcUrl: songData.lyricInfo && songData.lyricInfo.lyricFile,
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
      if (!result) return this.search(str, page, { limit }, retryNum)
      if (result.code !== 'SUCCESS') return this.search(str, page, { limit }, retryNum)
      // const songResultData = result.data || { songs: [], total: 0 }

      let list = this.handleResult(result.result.data.songs)
      if (list == null) return this.search(str, page, { limit }, retryNum)

      this.total = parseInt(result.result.data.pagingVO.count)
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        limit,
        total: this.total,
        source: 'xm',
      })
    }).catch(err => err.message.includes('canceled verify') ? Promise.reject(err) : this.search(str, page, { limit }, retryNum))
  },
}
