import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'

export default {
  successCode: 200,
  getSinger(singers) {
    let arr = []
    singers?.forEach(singer => {
      arr.push(singer.name)
    })
    return arr.join('、')
  },
  filterList(rawList) {
    const list = []
    rawList.forEach(item => {
      const types = []
      const _types = {}
      let size
      if (item.hr) {
        size = item.hr.size ? sizeFormate(item.hr.size) : null
        types.push({ type: 'flac24bit', size })
        _types.flac24bit = {
          size,
        }
      }
      if (item.sq) {
        size = item.sq.size ? sizeFormate(item.sq.size) : null
        types.push({ type: 'flac', size })
        _types.flac = {
          size,
        }
      }
      if (item.h) {
        size = item.h.size ? sizeFormate(item.h.size) : null
        types.push({ type: '320k', size })
        _types['320k'] = {
          size,
        }
      }
      if (item.l) {
        size = item.l.size ? sizeFormate(item.l.size) : null
        types.push({ type: '128k', size })
        _types['128k'] = {
          size,
        }
      }
      types.reverse()

      list.push({
        singer: this.getSinger(item.ar),
        name: item.name ?? '',
        albumName: item.al?.name,
        albumId: item.al?.id,
        source: 'wy',
        interval: formatPlayTime(item.dt / 1000),
        songmid: item.id,
        img: item.al?.picUrl,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
  getAlbumDetail(id, page, tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))

    const requestObj = httpFetch(`https://music.163.com/weapi/v1/album/${id}`, {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
      },
      form: weapi({ id }),
    })
    return requestObj.promise.then(({ body }) => {
      if (!body || body.code !== this.successCode || !body.album) return this.getAlbumDetail(id, page, ++tryNum)
      const album = body.album
      const list = this.filterList(body.songs ?? [])
      return {
        list,
        page,
        limit: 1000,
        total: album.size ?? list.length,
        source: 'wy',
        info: {
          name: album.name,
          img: album.picUrl,
          desc: album.description,
          author: formatSingerName(Array.isArray(album.artists) ? album.artists : [album.artist]),
        },
      }
    })
  },
}
