// import '../../polyfill/array.find'

import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate } from '../../index'
// import { debug } from '../../utils/env'
// import { formatSinger } from './util'

let searchRequest
export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  successCode: 0,
  musicSearch(str, page, limit, retryNum = 0) {
    if (searchRequest && searchRequest.cancelHttp) searchRequest.cancelHttp()
    if (retryNum > 5) return Promise.reject(new Error('搜索失败'))
    // searchRequest = httpFetch(`https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&new_json=1&remoteplace=sizer.yqq.song_next&searchid=49252838123499591&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=${page}&n=${limit}&w=${encodeURIComponent(str)}&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`)
    searchRequest = httpFetch(`https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&remoteplace=txt.yqq.top&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=${page}&n=${limit}&w=${encodeURIComponent(str)}&cv=4747474&ct=24&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&uin=0&hostUin=0&loginUin=0`)
    // searchRequest = httpFetch(`http://ioscdn.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(str)}&page=${page}&pagesize=${this.limit}&showtype=10&plat=2&version=7910&tag=1&correct=1&privilege=1&sver=5`)
    return searchRequest.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.musicSearch(str, page, limit, ++retryNum)
      return body.data
    })
  },
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.name)
    })
    return arr.join('、')
  },
  handleResult(rawList) {
    // console.log(rawList)
    const list = []
    rawList.forEach(item => {
      if (!item.strMediaMid) return

      let types = []
      let _types = {}
      if (item.size128 !== 0) {
        let size = sizeFormate(item.size128)
        types.push({ type: '128k', size })
        _types['128k'] = {
          size,
        }
      }
      if (item.size320 !== 0) {
        let size = sizeFormate(item.size320)
        types.push({ type: '320k', size })
        _types['320k'] = {
          size,
        }
      }
      if (item.sizeape !== 0) {
        let size = sizeFormate(item.sizeape)
        types.push({ type: 'ape', size })
        _types.ape = {
          size,
        }
      }
      if (item.sizeflac !== 0) {
        let size = sizeFormate(item.sizeflac)
        types.push({ type: 'flac', size })
        _types.flac = {
          size,
        }
      }
      // types.reverse()
      list.push({
        singer: this.getSinger(item.singer),
        name: item.songname,
        albumName: item.albumname,
        albumId: item.albummid,
        source: 'tx',
        interval: formatPlayTime(item.interval),
        songId: item.songid,
        albumMid: item.albummid,
        strMediaMid: item.strMediaMid,
        songmid: item.songmid,
        img: (item.albummid === '' || item.albummid === '空')
          ? `https://y.gtimg.cn/music/photo_new/T001R500x500M000${item.singer[0]?.mid}.jpg`
          : `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.albummid}.jpg`,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
  search(str, page = 1, { limit } = {}) {
    if (limit == null) limit = this.limit
    // http://newlyric.kuwo.cn/newlyric.lrc?62355680
    return this.musicSearch(str, page, limit).then(({ song }) => {
      let list = this.handleResult(song.list)

      this.total = song.totalnum
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        limit,
        total: this.total,
        source: 'tx',
      })
    })
  },
}
