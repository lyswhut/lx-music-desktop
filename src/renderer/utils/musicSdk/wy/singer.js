import { eapiRequest } from './utils/index'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'

export default {
  /**
   * 获取歌手信息
   * @param {*} id
   */
  getInfo(id) {
    return eapiRequest('/api/artist/head/info/get', { id }).then(({ body }) => {
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
    if (page === 1) page = 0
    return eapiRequest('/api/v2/artist/songs', {
      id,
      limit,
      offset: limit * page,
    }).then(({ body }) => {
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
    if (page === 1) page = 0
    return eapiRequest(`/api/artist/albums/${id}`, {
      limit,
      offset: limit * page,
    }).then(({ body }) => {
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
      item.privilege.chargeInfoList.forEach(i => {
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
        singer: formatSingerName(item.artists),
        name: item.name,
        albumName: item.album.name,
        albumId: item.album.id,
        songmid: item.id,
        source: 'wy',
        interval: formatPlayTime(item.duration),
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
