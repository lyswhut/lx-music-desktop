import { decodeName, formatPlayTime, sizeFormate } from '../../index'
import { signatureParams, createHttpFetch } from './util'
import { formatSingerName } from '../../utils'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page, limit) {
    const sign = signatureParams(`userid=0&area_code=1&appid=1005&dopicfull=1&page=${page}&token=0&privilegefilter=0&requestid=0&pagesize=${limit}&user_labels=&clienttime=0&sec_aggre=1&iscorrection=1&uuid=0&mid=0&keyword=${str}&dfid=-&clientver=11409&platform=AndroidFilter&tag=`, 3)
    return createHttpFetch(`https://gateway.kugou.com/complexsearch/v3/search/song?userid=0&area_code=1&appid=1005&dopicfull=1&page=${page}&token=0&privilegefilter=0&requestid=0&pagesize=${limit}&user_labels=&clienttime=0&sec_aggre=1&iscorrection=1&uuid=0&mid=0&dfid=-&clientver=11409&platform=AndroidFilter&tag=&keyword=${encodeURIComponent(str)}&signature=${sign}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        referer: 'https://kugou.com',
      },
    }).then(body => body)
  },
  filterList(raw) {
    let ids = new Set()
    const list = []

    raw.forEach(item => {
      if (ids.has(item.Audioid)) return
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
      if (item.HQ != undefined) {
        let size = sizeFormate(item.HQ.FileSize)
        types.push({ type: '320k', size, hash: item.HQ.Hash })
        _types['320k'] = {
          size,
          hash: item.HQ.Hash,
        }
      }
      if (item.SQ != undefined) {
        let size = sizeFormate(item.SQ.FileSize)
        types.push({ type: 'flac', size, hash: item.SQ.Hash })
        _types.flac = {
          size,
          hash: item.SQ.Hash,
        }
      }
      if (item.Res != undefined) {
        let size = sizeFormate(item.Res.FileSize)
        types.push({ type: 'flac24bit', size, hash: item.Res.Hash })
        _types.flac24bit = {
          size,
          hash: item.Res.Hash,
        }
      }
      list.push({
        singer: decodeName(formatSingerName(item.Singers)),
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
  handleResult(rawData) {
    const rawList = []
    rawData.forEach(item => {
      rawList.push(item)
      item.Grp.forEach(e => rawList.push(e))
    })

    return this.filterList(rawList)
  },
  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    return this.musicSearch(str, page, limit).then(data => {
      let list = this.handleResult(data.lists)
      if (!list) return this.search(str, page, limit, retryNum)

      this.total = data.total
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
