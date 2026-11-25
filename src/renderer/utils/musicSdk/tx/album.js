import { MusicSdkResponseError } from '../responseError'
import { formatSingerName, parseNonEmptyString, parseNonNegativeInt, parseValidCatalogId } from '../utils'
import { createMusicuFetch, filterMusicInfoItem, normalizeTxImageUrl, searchTxByType } from './singer'

export default {
  limit: 20,
  search(str, page = 1, limit = 20) {
    const req = searchTxByType(str, page, limit, 2)
    const promise = req.then(data => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new MusicSdkResponseError()
      if (data.body != null && (typeof data.body !== 'object' || Array.isArray(data.body))) throw new MusicSdkResponseError()
      if (data.body?.album != null && (typeof data.body.album !== 'object' || Array.isArray(data.body.album))) throw new MusicSdkResponseError()
      const rawList = data.body?.album?.list
      const total = parseNonNegativeInt(data.meta?.sum)
      if (total === null) throw new MusicSdkResponseError()
      if (!Array.isArray(rawList)) {
        if (total === 0 && rawList == null) return { list: [], total: 0, page, limit, source: 'tx' }
        throw new MusicSdkResponseError()
      }
      const list = rawList.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        if (item.albumMID != null && typeof item.albumMID !== 'string') throw new MusicSdkResponseError()
        if (
          item.singer_list != null &&
          (!Array.isArray(item.singer_list) || item.singer_list.some(s => !s || typeof s !== 'object' || Array.isArray(s) || (s.name != null && typeof s.name !== 'string')))
        ) {
          throw new MusicSdkResponseError()
        }
        const mid = parseValidCatalogId(item.albumMID)
        const id = mid ?? parseValidCatalogId(item.albumID)
        const name = parseNonEmptyString(item.albumName)
        if (!id || !name) throw new MusicSdkResponseError()
        const img = normalizeTxImageUrl(item.albumPic) || (mid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${mid}.jpg` : '')
        const singer = parseNonEmptyString(item.singerName) ?? (Array.isArray(item.singer_list) ? formatSingerName(item.singer_list, 'name') : '')
        return {
          id,
          name,
          singer,
          img,
          publishTime: typeof item.publicTime === 'string' ? item.publicTime.trim() : '',
          songCount: parseNonNegativeInt(item.song_count),
          source: 'tx',
        }
      })
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
  async getAlbumDetail(id, page = 1, limit = 50) {
    // Search/saved tracks historically store QQ's MID in albumId; singer rows use numeric IDs.
    const identity = typeof id === 'number' || /^[1-9]\d*$/.test(id)
      ? { albumID: Number(id) }
      : { albumMid: String(id) }
    if ('albumID' in identity && (!Number.isSafeInteger(identity.albumID) || identity.albumID <= 0)) throw new Error('Invalid album ID')
    const body = await createMusicuFetch({
      req: {
        module: 'music.musichallAlbum.AlbumSongList',
        method: 'GetAlbumSongList',
        param: { ...identity, begin: (page - 1) * limit, num: limit },
      },
    })
    const data = body.req?.data
    if (body.req == null || typeof body.req.code !== 'number') throw new MusicSdkResponseError()
    if (body.req.code !== 0) throw new Error('Get album songs failed')
    if (!Array.isArray(data?.songList)) throw new MusicSdkResponseError()
    let list
    try {
      list = data.songList.map(item => {
        if (typeof item?.songInfo?.mid !== 'string' || !item.songInfo.mid.trim()) throw new MusicSdkResponseError()
        return filterMusicInfoItem(item.songInfo)
      })
    } catch {
      throw new MusicSdkResponseError()
    }
    return {
      list,
      total: data.totalNum,
      page,
      limit,
      source: 'tx',
    }
  },
}
