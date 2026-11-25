import { eapiRequest } from './utils/index'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName, parseNonEmptyString, parseNonNegativeInt, parseValidCatalogId } from '../utils'
import { MusicSdkResponseError } from '../responseError'

export default {
  limit: 20,
  search(str, page = 1, limit = 20) {
    const req = eapiRequest('/api/cloudsearch/pc', {
      s: str,
      type: 100,
      limit,
      offset: limit * (page - 1),
      total: true,
    })
    const promise = req.promise.then(({ body }) => {
      if (!body || typeof body !== 'object' || body.code !== 200) throw new MusicSdkResponseError()
      const result = body.result
      if (!result || typeof result !== 'object' || Array.isArray(result)) throw new MusicSdkResponseError()
      const total = parseNonNegativeInt(result.artistCount)
      const rawList = result.artists
      if (!Array.isArray(rawList)) {
        if (total === 0 && rawList == null) return { list: [], total: 0, page, limit, source: 'wy' }
        throw new MusicSdkResponseError()
      }
      if (total === null) throw new MusicSdkResponseError()
      const list = rawList.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        const id = parseValidCatalogId(item.id)
        const name = parseNonEmptyString(item.name)
        if (!id || !name) throw new MusicSdkResponseError()
        const picUrl = typeof item.picUrl === 'string' ? item.picUrl.trim() : ''
        const fallbackUrl = typeof item.img1v1Url === 'string' ? item.img1v1Url.trim() : ''
        return {
          id: typeof item.id === 'number' ? item.id : id,
          name,
          img: picUrl || fallbackUrl,
          songCount: parseNonNegativeInt(item.musicSize),
          albumCount: parseNonNegativeInt(item.albumSize),
          source: 'wy',
        }
      })
      return {
        list,
        total,
        page,
        limit,
        source: 'wy',
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
    return eapiRequest('/api/artist/head/info/get', { id }).promise.then(({ body }) => {
      if (!body || body.code != 200) throw new Error('get singer info faild.')
      return {
        source: 'wy',
        id: body.artist.id,
        info: {
          name: body.artist.name,
          desc: body.artist.briefDesc,
          avatar: body.user.avatarUrl,
          gender: body.user.gender === 1 ? 'man' : 'woman',
        },
        count: {
          music: body.artist.musicSize,
          album: body.artist.albumSize,
        },
      }
    })
  },
  /**
   * 获取歌手歌曲列表
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  getSongList(id, page = 1, limit = 100) {
    return eapiRequest('/api/v2/artist/songs', {
      id,
      limit,
      offset: limit * (page - 1),
    }).promise.then(({ body }) => {
      if (!body.songs || body.code != 200) throw new Error('get singer song list faild.')

      const list = this.filterSongList(body.songs)
      return {
        list,
        limit,
        page,
        total: body.total,
        source: 'wy',
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
    return eapiRequest(`/api/artist/albums/${id}`, {
      limit,
      offset: limit * (page - 1),
    }).promise.then(({ body }) => {
      if (!body.hotAlbums || body.code != 200) throw new Error('get singer album list faild.')

      const list = this.filterAlbumList(body.hotAlbums)
      return {
        source: 'wy',
        list,
        limit,
        page,
        total: body.artist.albumSize,
      }
    })
  },
  filterAlbumList(raw) {
    const list = []
    raw.forEach(item => {
      if (!item.id) return
      list.push({
        id: item.id,
        count: item.size,
        info: {
          name: item.name,
          author: formatSingerName(item.artists),
          img: item.picUrl,
          desc: null,
        },
      })
    })
    return list
  },
  filterSongList(raw) {
    const list = []
    raw.forEach(item => {
      if (!item.id) return

      const types = []
      const _types = {}
      let size
      ;(item.privilege?.chargeInfoList ?? []).forEach(i => {
        switch (i.rate) {
          case 128000:
            size = item.lMusic ? sizeFormate(item.lMusic.size) : null
            types.push({ type: '128k', size })
            _types['128k'] = {
              size,
            }
          case 320000:
            size = item.hMusic ? sizeFormate(item.hMusic.size) : null
            types.push({ type: '320k', size })
            _types['320k'] = {
              size,
            }
          case 999000:
            size = item.sqMusic ? sizeFormate(item.sqMusic.size) : null
            types.push({ type: 'flac', size })
            _types.flac = {
              size,
            }
          case 1999000:
            size = item.hrMusic ? sizeFormate(item.hrMusic.size) : null
            types.push({ type: 'flac24bit', size })
            _types.flac24bit = {
              size,
            }
        }
      })

      list.push({
        singer: formatSingerName(item.artists ?? item.ar),
        artists: (item.artists ?? item.ar)?.map(artist => ({ id: artist.id, name: artist.name })),
        name: item.name,
        albumName: (item.album ?? item.al)?.name ?? '',
        albumId: (item.album ?? item.al)?.id,
        songmid: item.id,
        source: 'wy',
        interval: formatPlayTime((item.duration ?? item.dt) / 1000),
        img: null,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
}
