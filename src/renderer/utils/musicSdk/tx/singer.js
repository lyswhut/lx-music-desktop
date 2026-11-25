import { httpFetch } from '../../request'

import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName, parseNonEmptyString, parseNonNegativeInt } from '../utils'
import { MusicSdkResponseError } from '../responseError'
import { buildSearchComm, getTxSearchId } from './musicSearch'
import { signRequest } from './utils'

export const normalizeTxImageUrl = url => {
  if (typeof url !== 'string') return ''
  const clean = url.trim()
  if (!clean) return ''
  return clean.replace(/^http:\/\//i, 'https://')
}

export const searchTxByType = (str, page, limit, searchType) => {
  const req = signRequest({
    comm: buildSearchComm(),
    'music.search.SearchCgiService': {
      module: 'music.search.SearchCgiService',
      method: 'DoSearchForQQMusicDesktop',
      param: {
        grp: 1,
        num_per_page: limit,
        page_num: page,
        query: str,
        remoteplace: 'txt.newclient.top',
        search_type: searchType,
        searchid: getTxSearchId(),
      },
    },
  })
  const promise = req.then(({ body }) => {
    const res = body?.['music.search.SearchCgiService'] ?? body?.req
    if (!res || typeof body?.code !== 'number' || typeof res.code !== 'number') throw new MusicSdkResponseError()
    if (body.code !== 0 || res.code !== 0) throw new Error('搜索失败')
    return res.data
  })
  promise.cancel = () => req.cancel?.()
  return promise
}

export const filterMusicInfoItem = item => {
  const types = []
  const _types = {}
  if (item.file.size_128mp3 != 0) {
    let size = sizeFormate(item.file.size_128mp3)
    types.push({ type: '128k', size })
    _types['128k'] = {
      size,
    }
  }
  if (item.file.size_320mp3 !== 0) {
    let size = sizeFormate(item.file.size_320mp3)
    types.push({ type: '320k', size })
    _types['320k'] = {
      size,
    }
  }
  if (item.file.size_flac !== 0) {
    let size = sizeFormate(item.file.size_flac)
    types.push({ type: 'flac', size })
    _types.flac = {
      size,
    }
  }
  if (item.file.size_hires !== 0) {
    let size = sizeFormate(item.file.size_hires)
    types.push({ type: 'flac24bit', size })
    _types.flac24bit = {
      size,
    }
  }

  const albumId = item.album.id ?? ''
  const albumMid = item.album.mid ?? ''
  const albumName = item.album.name ?? ''
  return {
    source: 'tx',
    singer: formatSingerName(item.singer, 'name'),
    artists: item.singer?.map(artist => ({ id: artist.mid, name: artist.name })),
    name: item.title,
    albumName,
    albumId,
    albumMid,
    interval: formatPlayTime(item.interval),
    songId: item.id,
    songmid: item.mid,
    strMediaMid: item.file.media_mid,
    img: (albumId === '' || albumId === '空')
      ? item.singer?.length ? `https://y.gtimg.cn/music/photo_new/T001R500x500M000${item.singer[0].mid}.jpg` : ''
      : `https://y.gtimg.cn/music/photo_new/T002R500x500M000${albumMid}.jpg`,
    types,
    _types,
    typeUrl: {},
  }
}


/**
 * 创建一个适用于TX的Http请求
 * @param {*} url
 * @param {*} options
 * @param {*} retryNum
 */
export const createMusicuFetch = async(data, options, retryNum = 0) => {
  if (retryNum > 2) throw new Error('try max num')

  let result
  try {
    result = await httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'POST',
      body: {
        comm: {
          cv: 4747474,
          ct: 24,
          format: 'json',
          inCharset: 'utf-8',
          outCharset: 'utf-8',
          uin: 0,
        },
        ...data,
      },
      headers: {
        'User-Angent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
      },
    }).promise
  } catch (err) {
    console.log(err)
    return createMusicuFetch(data, options, ++retryNum)
  }
  if (result.statusCode !== 200 || result.body.code != 0) return createMusicuFetch(data, options, ++retryNum)

  return result.body
}

export default {
  limit: 20,
  search(str, page = 1, limit = 20) {
    const req = searchTxByType(str, page, limit, 1)
    const promise = req.then(data => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new MusicSdkResponseError()
      if (data.body != null && (typeof data.body !== 'object' || Array.isArray(data.body))) throw new MusicSdkResponseError()
      if (data.body?.singer != null && (typeof data.body.singer !== 'object' || Array.isArray(data.body.singer))) throw new MusicSdkResponseError()
      const rawList = data.body?.singer?.list
      const total = parseNonNegativeInt(data.meta?.sum)
      if (total === null) throw new MusicSdkResponseError()
      if (!Array.isArray(rawList)) {
        if (total === 0 && rawList == null) return { list: [], total: 0, page, limit, source: 'tx' }
        throw new MusicSdkResponseError()
      }
      const list = []
      for (const item of rawList) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        if (item.singerMID != null && typeof item.singerMID !== 'string') throw new MusicSdkResponseError()
        const name = parseNonEmptyString(item.singerName)
        if (!name) throw new MusicSdkResponseError()
        // QQ 音乐 GetSingerSongList 仅接受 string singerMid，不能回退到数字 singerID
        const mid = parseNonEmptyString(item.singerMID)
        if (!mid || mid === '0') continue
        const img = normalizeTxImageUrl(item.singerPic) || `https://y.gtimg.cn/music/photo_new/T001R300x300M000${mid}.jpg`
        list.push({
          id: mid,
          name,
          img,
          songCount: parseNonNegativeInt(item.songNum),
          albumCount: parseNonNegativeInt(item.albumNum),
          source: 'tx',
        })
      }
      if (rawList.length > 0 && list.length === 0) throw new MusicSdkResponseError()
      return {
        list,
        total,
        page,
        limit,
        source: 'tx',
      }
    })
    promise.cancel = () => req.cancel?.()
    return promise
  },
  /**
   * 获取歌手信息
   * @param {*} id
   */
  getInfo(id) {
    return createMusicuFetch({
      req_1: {
        module: 'music.musichallSinger.SingerInfoInter',
        method: 'GetSingerDetail',
        param: {
          singer_mid: [id],
          ex_singer: 1,
          wiki_singer: 1,
          group_singer: 0,
          pic: 1,
          photos: 0,
        },
      },
      req_2: {
        module: 'music.musichallAlbum.AlbumListServer',
        method: 'GetAlbumList',
        param: {
          singerMid: id,
          order: 0,
          begin: 0,
          num: 1,
          songNumTag: 0,
          singerID: 0,
        },
      },
      req_3: {
        module: 'musichall.song_list_server',
        method: 'GetSingerSongList',
        param: {
          singerMid: id,
          order: 1,
          begin: 0,
          num: 1,
        },
      },
    }).then(body => {
      if (body.req_1.code != 0 || body.req_2 != 0 || body.req_3 != 0) throw new Error('get singer info faild.')

      const info = body.req_1.data.singer_list[0]
      const music = body.req_3.data
      const album = body.req_3.data
      return {
        source: 'tx',
        id: info.basic_info.singer_mid,
        info: {
          name: info.basic_info.name,
          desc: info.ex_info.desc,
          avatar: info.pic.pic,
          gender: info.ex_info.genre === 1 ? 'man' : 'woman',
        },
        count: {
          music: music.totalNum,
          album: album.total,
        },
      }
    })
  },
  /**
   * 获取歌手专辑列表
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  getAlbumList(id, page = 1, limit = 10) {
    return createMusicuFetch({
      req: {
        module: 'music.musichallAlbum.AlbumListServer',
        method: 'GetAlbumList',
        param: {
          singerMid: id,
          order: 0,
          begin: (page - 1) * limit,
          num: limit,
          songNumTag: 0,
          singerID: 0,
        },
      },
    }).then(body => {
      if (body.req.code != 0) throw new Error('get singer album faild.')

      const list = this.filterAlbumList(body.req.data.albumList)
      return {
        source: 'tx',
        list,
        limit,
        page,
        total: body.req.data.total,
      }
    })
  },
  /**
   * 获取歌手歌曲列表
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  async getSongList(id, page = 1, limit = 100) {
    return createMusicuFetch({
      req: {
        module: 'musichall.song_list_server',
        method: 'GetSingerSongList',
        param: {
          singerMid: id,
          order: 1,
          begin: (page - 1) * limit,
          num: limit,
        },
      },
    }).then(body => {
      if (body.req.code != 0) throw new Error('get singer song list faild.')

      const list = this.filterSongList(body.req.data.songList)
      return {
        source: 'tx',
        list,
        limit,
        page,
        total: body.req.data.totalNum,
      }
    })
  },
  filterAlbumList(raw) {
    return raw.map(item => {
      return {
        id: item.albumID,
        mid: item.albumMid,
        count: item.totalNum,
        info: {
          name: item.albumName,
          author: item.singerName,
          img: `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.albumMid}.jpg`,
          desc: null,
        },
      }
    })
  },
  filterSongList(raw) {
    return raw.map(item => {
      return filterMusicInfoItem(item.songInfo)
    })
  },
}

