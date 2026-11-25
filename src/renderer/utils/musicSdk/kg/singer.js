import { httpFetch } from '../../request'
import { MusicSdkResponseError } from '../responseError'
import { parseNonEmptyString, parseNonNegativeInt, parseValidCatalogId } from '../utils'
import { getMusicInfosByList } from './musicInfo'
import { createHttpFetch } from './util'

export default {
  limit: 20,
  search(str, page = 1, limit = 20) {
    const req = httpFetch(
      `http://mobilecdn.kugou.com/api/v3/search/singer?keyword=${encodeURIComponent(str)}&page=${page}&pagesize=${limit}`,
    )
    const promise = req.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200 || !body || typeof body !== 'object' || Array.isArray(body) || body.status !== 1 || body.errcode !== 0) {
        throw new MusicSdkResponseError()
      }
      let rawList
      let total
      if (body.data === null) {
        return { list: [], total: 0, page, limit, source: 'kg' }
      } else if (Array.isArray(body.data)) {
        rawList = body.data
        total = rawList.length
      } else if (body.data && typeof body.data === 'object') {
        total = parseNonNegativeInt(body.data.total)
        if (total === null) throw new MusicSdkResponseError()
        if (Array.isArray(body.data.info)) {
          rawList = body.data.info
        } else if (total === 0 && body.data.info == null) {
          return { list: [], total: 0, page, limit, source: 'kg' }
        } else {
          throw new MusicSdkResponseError()
        }
      } else {
        throw new MusicSdkResponseError()
      }
      const list = rawList.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        const id = parseValidCatalogId(item.singerid)
        const name = parseNonEmptyString(item.singername)
        if (!id || !name) throw new MusicSdkResponseError()
        return {
          id,
          name,
          img: typeof item.imgurl === 'string' ? item.imgurl.replace('{size}', '480') : '',
          songCount: parseNonNegativeInt(item.songcount),
          albumCount: parseNonNegativeInt(item.albumcount),
          source: 'kg',
        }
      })
      return {
        list,
        total,
        page,
        limit,
        source: 'kg',
      }
    })
    promise.cancel = () => req.cancelHttp?.()
    return promise
  },
  /**
   * 获取歌手信息
   * @param {*} id
   */
  getInfo(id) {
    if (id == 0) throw new Error('歌手不存在') // kg源某些歌曲在歌手没被kg收录时返回的歌手id为0
    return createHttpFetch(`http://mobiles.kugou.com/api/v5/singer/info?singerid=${id}`).then(body => {
      if (!body) throw new Error('get singer info faild.')

      return {
        source: 'kg',
        id: body.singerid,
        info: {
          name: body.singername,
          desc: body.intro,
          avatar: body.imgurl.replace('{size}', 480),
          gender: body.grade === 1 ? 'man' : 'woman',
        },
        count: {
          music: body.songcount,
          album: body.albumcount,
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
    if (id == 0) throw new Error('歌手不存在')
    return createHttpFetch(`http://mobiles.kugou.com/api/v5/singer/album?singerid=${id}&page=${page}&pagesize=${limit}`).then(body => {
      if (!body.info) throw new Error('get singer album list faild.')

      const list = this.filterAlbumList(body.info)
      return {
        source: 'kg',
        list,
        limit,
        page,
        total: body.total,
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
    if (id == 0) throw new Error('歌手不存在')
    const body = await createHttpFetch(`http://mobiles.kugou.com/api/v5/singer/song?singerid=${id}&page=${page}&pagesize=${limit}`)
    if (!body.info) throw new Error('get singer song list faild.')

    const list = await getMusicInfosByList(body.info)
    return {
      source: 'kg',
      list,
      limit,
      page,
      total: body.total,
    }
  },
  filterAlbumList(raw) {
    return raw.map(item => {
      return {
        id: item.albumid,
        count: item.songcount,
        info: {
          name: item.albumname,
          author: item.singername,
          img: item.replaceAll('{size}', '480'),
          desc: item.intro,
        },
      }
    })
  },
}
