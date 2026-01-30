import { httpFetch } from '../../request'
import { sizeFormate, formatPlayTime } from '../../index'
import { eapi } from './utils/crypto'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page, limit) {
    const searchRequest = httpFetch(
      'http://interface3.music.163.com/eapi/search/song/list/page',
      {
        method: 'post',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
          origin: 'https://music.163.com',
        },
        form: eapi('/api/search/song/list/page', {
          keyword: str,
          needCorrect: '1',
          channel: 'typing',
          offset: limit * (page - 1),
          scene: 'normal',
          total: page == 1,
          limit,
        }),
      },
    )
    return searchRequest.promise.then(({ body }) => body)
  },

  getSinger(singers) {
    let arr = []
    singers.forEach((singer) => {
      arr.push(singer.name)
    })
    return arr.join('、')
  },
  handleResult(rawList) {
    if (!rawList) return []
    return rawList.map((item) => {
      item = item.baseInfo.simpleSongData

      const types = []
      const _types = {}
      let size

      if (item.privilege.maxBrLevel == 'hires') {
        size = item.hr ? sizeFormate(item.hr.size) : null
        types.push({ type: 'flac24bit', size })
        _types.flac24bit = {
          size,
        }
      }
      switch (item.privilege.maxbr) {
        case 999000:
          size = item.sq ? sizeFormate(item.sq.size) : null
          types.push({ type: 'flac', size })
          _types.flac = {
            size,
          }
        case 320000:
          size = item.h ? sizeFormate(item.h.size) : null
          types.push({ type: '320k', size })
          _types['320k'] = {
            size,
          }
        case 192000:
        case 128000:
          size = item.l ? sizeFormate(item.l.size) : null
          types.push({ type: '128k', size })
          _types['128k'] = {
            size,
          }
      }

      types.reverse()

      return {
        singer: this.getSinger(item.ar),
        name: item.name,
        albumName: item.al.name,
        albumId: item.al.id,
        source: 'wy',
        interval: formatPlayTime(item.dt / 1000),
        songmid: item.id,
        img: item.al.picUrl,
        lrc: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit
    return this.musicSearch(str, page, limit).then(result => {
      if (!result || result.code !== 200) return this.search(str, page, limit, retryNum)
      let list = this.handleResult(result.data.resources || [])
      if (list == null) return this.search(str, page, limit, retryNum)

      this.total = result.data.totalCount || 0
      this.page = page
      this.allPage = Math.ceil(this.total / this.limit)

      return {
        list,
        allPage: this.allPage,
        limit: this.limit,
        total: this.total,
        source: 'wy',
      }
      // return result.data
    })
  },
}
