import { httpFetch } from '../../request'
import { decodeName } from '../../index'
import { formatSinger, objStr2JSON } from './util'

// let requestObj_list
export default {
  limit_list: 36,
  limit_song: 1000,
  /**
   * 专辑搜索
   * @param {*} keywords 关键词
   * @param {*} page 页码（从1开始）
   * @param {*} limit 每页数量
   */
  search(keywords, page = 1, limit = 20) {
    const requestObj = httpFetch(`https://search.kuwo.cn/r.s?all=${encodeURIComponent(keywords)}&ft=album&itemset=web_2013&client=kt&pn=${page - 1}&rn=${limit}&rformat=json&encoding=utf8`)
    requestObj.promise = requestObj.promise.then(({ body }) => {
      const data = objStr2JSON(body)
      const list = (data.abslist ?? []).map(item => ({
        id: item.albumid,
        name: decodeName(item.name),
        img: item.pic ? (item.pic.startsWith('http') ? item.pic : `https://img4.kuwo.cn/star/albumcover/256${item.pic}`) : null,
        desc: decodeName(item.info ?? ''),
        author: decodeName(item.artist ?? ''),
        play_count: null,
        time: item.publishDate ?? '',
        song_count: null,
        source: 'kw',
      }))
      return { list, total: parseInt(data.TOTAL, 10) || page * limit, page, limit, source: 'kw' }
    })
    return requestObj
  },
  filterListDetail(rawList, albumName, albumId) {
    // console.log(rawList)
    // console.log(rawList.length, rawList2.length)
    return rawList.map((item, inedx) => {
      let formats = item.formats.split('|')
      let types = []
      let _types = {}
      if (formats.includes('MP3128')) {
        types.push({ type: '128k', size: null })
        _types['128k'] = {
          size: null,
        }
      }
      // if (formats.includes('MP3192')) {
      //   types.push({ type: '192k', size: null })
      //   _types['192k'] = {
      //     size: null,
      //   }
      // }
      if (formats.includes('MP3H')) {
        types.push({ type: '320k', size: null })
        _types['320k'] = {
          size: null,
        }
      }
      // if (formats.includes('AL')) {
      //   types.push({ type: 'ape', size: null })
      //   _types.ape = {
      //     size: null,
      //   }
      // }
      if (formats.includes('ALFLAC')) {
        types.push({ type: 'flac', size: null })
        _types.flac = {
          size: null,
        }
      }
      if (formats.includes('HIRFLAC')) {
        types.push({ type: 'flac24bit', size: null })
        _types.flac24bit = {
          size: null,
        }
      }
      // types.reverse()
      return {
        singer: formatSinger(decodeName(item.artist)),
        name: decodeName(item.name),
        albumName,
        albumId,
        songmid: item.id,
        source: 'kw',
        interval: null,
        img: item.pic,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  /**
   * 格式化播放数量
   * @param {*} num
   */
  formatPlayCount(num) {
    if (num > 100000000) return parseInt(num / 10000000) / 10 + '亿'
    if (num > 10000) return parseInt(num / 1000) / 10 + '万'
    return num
  },
  getAlbumListDetail(id, page, retryNum = 0) {
    if (retryNum > 2) return Promise.reject(new Error('try max num'))
    const requestObj_listDetail = httpFetch(`http://search.kuwo.cn/r.s?pn=${page - 1}&rn=${this.limit_song}&stype=albuminfo&albumid=${id}&show_copyright_off=0&encoding=utf&vipver=MUSIC_9.1.0`)
    return requestObj_listDetail.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200) return this.getAlbumListDetail(id, page, ++retryNum)
      body = objStr2JSON(body)
      // console.log(body)
      if (!body.musiclist) return this.getAlbumListDetail(id, page, ++retryNum)
      body.name = decodeName(body.name)
      return {
        list: this.filterListDetail(body.musiclist, body.name, body.albumid),
        page,
        limit: this.limit_song,
        total: parseInt(body.songnum),
        source: 'kw',
        info: {
          name: body.name,
          img: body.img || body.hts_img,
          desc: decodeName(body.info),
          author: decodeName(body.artist),
          // play_count: this.formatPlayCount(body.playnum),
        },
      }
    })
  },
  // getAlbumListDetail(id, page, retryNum = 0) {
  //   if (retryNum > 2) return Promise.reject(new Error('try max num'))
  //   return tokenRequest(`http://www.kuwo.cn/api/www/album/albumInfo?albumId=${id}&pn=${page}&rn=${this.limit_song}&httpsStatus=1`).then((resp) => {
  //     return resp.promise.then(({ statusCode, body }) => {
  //       console.log(body)
  //       return Promise.reject(new Error('failed'))
  //       // if (statusCode !== 200) return this.getAlbumListDetail(id, page, ++retryNum)
  //       // const data = body.data
  //       // console.log(data)
  //       // if (!data.musicList) return this.getAlbumListDetail(id, page, ++retryNum)
  //       // return {
  //       //   list: this.filterListDetail(data.musiclist),
  //       //   page,
  //       //   limit: this.limit_song,
  //       //   total: data.total,
  //       //   source: 'kw',
  //       //   info: {
  //       //     name: data.album,
  //       //     img: data.pic,
  //       //     desc: data.albuminfo,
  //       //     author: data.artist,
  //       //     play_count: this.formatPlayCount(data.playCnt),
  //       //   },
  //       // }
  //     })
  //   })
  // },
}
