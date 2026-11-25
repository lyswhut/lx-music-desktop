import { httpFetch } from '../../request'
import { decodeName } from '../../index'
import { MusicSdkResponseError } from '../responseError'
import { parseNonEmptyString, parseNonNegativeInt, parseValidCatalogId } from '../utils'
import { formatSinger, objStr2JSON } from './util'

const buildKwAlbumImg = (item, basePath = '') => {
  const direct = parseNonEmptyString(item?.hts_img) ?? parseNonEmptyString(item?.img) ?? ''
  if (direct && /^https?:\/\//i.test(direct)) return direct
  const pic = parseNonEmptyString(item?.pic) ?? ''
  if (!pic) return ''
  if (/^https?:\/\//i.test(pic)) return pic
  const base = typeof basePath === 'string' && basePath.trim()
    ? basePath.trim()
    : 'https://img4.kuwo.cn/star/albumcover/'
  return `${base.replace(/\/+$/, '')}/${pic.replace(/^\/+/, '')}`
}

// let requestObj_list
export default {
  limit_list: 36,
  limit_song: 1000,
  search(str, page = 1, limit = 20) {
    const req = httpFetch(
      `http://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(str)}&pn=${page - 1}&rn=${limit}&ft=album&encoding=utf8&rformat=json&mobi=1&newver=1`,
    )
    const promise = req.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200 || !body || typeof body !== 'object' || Array.isArray(body)) throw new MusicSdkResponseError()
      const total = parseNonNegativeInt(body.total ?? body.TOTAL)
      const rawList = body.albumlist
      if (!Array.isArray(rawList)) {
        // 酷我 ft=album 越界翻页（(page - 1) * limit >= total）会返回 {"SHOW":"0","abslist":[],"total":"N"} 并省略 albumlist
        const isOutOfRangeEmpty = total !== null && (page - 1) * limit >= total && Array.isArray(body.abslist) && body.abslist.length === 0
        if (rawList == null && (total === 0 || isOutOfRangeEmpty)) {
          return { list: [], total, page, limit, source: 'kw' }
        }
        throw new MusicSdkResponseError()
      }
      if (total === null) throw new MusicSdkResponseError()
      const list = rawList.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        const id = parseValidCatalogId(item.albumid)
        const name = parseNonEmptyString(item.name)
        if (!id || !name) throw new MusicSdkResponseError()
        return {
          id,
          name: decodeName(name),
          singer: typeof item.artist === 'string' ? formatSinger(decodeName(item.artist)) : '',
          img: buildKwAlbumImg(item, body.BASEPICPATH),
          publishTime: typeof item.pub === 'string' ? item.pub.trim() : '',
          songCount: parseNonNegativeInt(item.musiccnt),
          source: 'kw',
        }
      })
      return {
        list,
        total,
        page,
        limit,
        source: 'kw',
      }
    })
    promise.cancel = () => req.cancelHttp?.()
    return promise
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
