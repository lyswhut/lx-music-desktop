import { eapiRequest } from './utils'
import { formatPlayTime, dateFormat, decodeName } from '../../index'

// 网易云专辑接口（eapi 通道）
//   注：公开接口 /api/album 与 weapi cloudsearch 已被风控（-462），eapi 通道稳定可用
// 搜索：/api/cloudsearch/pc（type=10 专辑）
// 详情：/api/v1/album/{id}（一次返回全量曲目，分页在本地完成）

export default {
  search(keywords, page = 1, limit = 20) {
    const requestObj = eapiRequest('/api/cloudsearch/pc', {
      s: keywords,
      type: 10,
      limit,
      offset: (page - 1) * limit,
      total: page === 1,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      if (body.code !== 200) throw new Error('专辑搜索请求失败')
      const result = body.result ?? {}
      const list = (result.albums ?? []).map(item => ({
        id: item.id,
        name: decodeName(item.name),
        img: item.picUrl,
        desc: item.description ?? '',
        author: (item.artists ?? []).map(s => s.name).join('、'),
        play_count: null,
        time: item.publishTime ? dateFormat(item.publishTime, 'Y-M-D') : '',
        song_count: item.size ?? null,
        source: 'wy',
      }))
      return { list, total: result.albumCount ?? page * limit, page, limit, source: 'wy' }
    })
    return requestObj
  },

  getAlbumDetail(id, page = 1, limit = 100) {
    const requestObj = eapiRequest(`/api/v1/album/${id}`, {})
    requestObj.promise = requestObj.promise.then(({ body }) => {
      if (body.code !== 200) throw new Error('获取专辑歌曲失败')
      const album = body.album ?? {}
      const songs = body.songs ?? []
      const list = songs.slice((page - 1) * limit, page * limit).map(item => ({
        singer: (item.ar ?? []).map(s => s.name).join('、'),
        name: decodeName(item.alia?.length ? `${item.name}（${item.alia[0]}）` : item.name),
        albumName: decodeName(item.al?.name ?? ''),
        albumId: item.al?.id ?? id,
        songmid: item.id,
        source: 'wy',
        interval: formatPlayTime(Math.trunc((item.dt ?? 0) / 1000)),
        img: item.al?.picUrl ?? null,
        lrc: null,
        types: [],
        _types: {},
        typeUrl: {},
      }))
      const info = {
        name: decodeName(album.name ?? ''),
        img: album.picUrl ?? null,
        desc: album.description ?? '',
        author: (album.artists ?? []).map(s => s.name).join('、'),
        play_count: null,
        time: album.publishTime ? dateFormat(album.publishTime, 'Y-M-D') : '',
      }
      return { list, page, limit, total: songs.length, source: 'wy', info }
    })
    return requestObj
  },
}
