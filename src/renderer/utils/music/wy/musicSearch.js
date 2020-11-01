import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'
// import { sizeFormate, formatPlayTime } from '../../index'
import musicDetailApi from './musicDetail'

let searchRequest
export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page) {
    if (searchRequest && searchRequest.cancelHttp) searchRequest.cancelHttp()
    searchRequest = httpFetch('https://music.163.com/weapi/search/get', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
      },
      form: weapi({
        s: str,
        type: 1, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
        limit: this.limit,
        offset: this.limit * (page - 1),
      }),
    })
    return searchRequest.promise.then(({ body }) =>
      body && body.code === 200
        ? musicDetailApi.getList(body.result.songs.map(s => s.id)).then(({ list }) => {
          this.total = body.result.songCount || 0
          this.page = page
          this.allPage = Math.ceil(this.total / this.limit)
          return {
            code: 200,
            data: {
              list,
              allPage: this.allPage,
              limit: this.limit,
              total: this.total,
              source: 'wy',
            },
          }
        })
        : body)
  },
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.name)
    })
    return arr.join('、')
  },
  /* handleResult(rawList) {
    // console.log(rawList)
    if (!rawList) return []
    return rawList.map(item => {
      const types = []
      const _types = {}
      let size
      switch (item.privilege.maxbr) {
        case 999000:
          size = null
          types.push({ type: 'flac', size })
          _types.flac = {
            size,
          }
        case 320000:
          if (item.h) {
            size = sizeFormate(item.h.size)
            types.push({ type: '320k', size })
            _types['320k'] = {
              size,
            }
          }
        case 192000:
        case 128000:
          if (item.l) {
            size = sizeFormate(item.l.size)
            types.push({ type: '128k', size })
            _types['128k'] = {
              size,
            }
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
  }, */
  search(str, page = 1, { limit } = {}, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit != null) this.limit = limit
    return this.musicSearch(str, page).then(result => {
      // console.log(result)
      if (!result || result.code !== 200) return this.search(str, page, { limit }, retryNum)
      // let list = this.handleResult(result.result.songs || [])

      // if (list == null) return this.search(str, page, { limit }, retryNum)

      // this.total = result.result.songCount || 0
      // this.page = page
      // this.allPage = Math.ceil(this.total / this.limit)

      // return Promise.resolve({
      //   list,
      //   allPage: this.allPage,
      //   limit: this.limit,
      //   total: this.total,
      //   source: 'wy',
      // })
      return result.data
    })
  },
}
