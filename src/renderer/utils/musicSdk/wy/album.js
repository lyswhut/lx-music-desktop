import { MusicSdkResponseError } from '../responseError'
import { formatSingerName, parseNonEmptyString, parseNonNegativeInt, parseValidCatalogId } from '../utils'
import { eapiRequest } from './utils/index'
import singer from './singer'

const formatPublishDate = ts => {
  const num = Number(ts)
  if (!Number.isFinite(num) || num <= 0) return ''
  // 网易云发行时间戳以北京时间（UTC+8）零点计，按固定 UTC+8 输出避免西半球时区偏移一天
  const d = new Date(num + 8 * 3600_000)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default {
  limit: 20,
  search(str, page = 1, limit = 20) {
    const req = eapiRequest('/api/cloudsearch/pc', {
      s: str,
      type: 10,
      limit,
      offset: limit * (page - 1),
      total: true,
    })
    const promise = req.promise.then(({ body }) => {
      if (!body || typeof body !== 'object' || body.code !== 200) throw new MusicSdkResponseError()
      const result = body.result
      if (!result || typeof result !== 'object' || Array.isArray(result)) throw new MusicSdkResponseError()
      const total = parseNonNegativeInt(result.albumCount)
      const rawList = result.albums
      if (!Array.isArray(rawList)) {
        if (total === 0 && rawList == null) return { list: [], total: 0, page, limit, source: 'wy' }
        throw new MusicSdkResponseError()
      }
      if (total === null) throw new MusicSdkResponseError()
      const list = rawList.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        if (
          item.artists != null &&
          (!Array.isArray(item.artists) || item.artists.some(a => !a || typeof a !== 'object' || Array.isArray(a) || (a.name != null && typeof a.name !== 'string')))
        ) {
          throw new MusicSdkResponseError()
        }
        const id = parseValidCatalogId(item.id)
        const name = parseNonEmptyString(item.name)
        if (!id || !name) throw new MusicSdkResponseError()
        const picUrl = typeof item.picUrl === 'string' ? item.picUrl.trim() : ''
        const blurUrl = typeof item.blurPicUrl === 'string' ? item.blurPicUrl.trim() : ''
        return {
          id: typeof item.id === 'number' ? item.id : id,
          name,
          singer: Array.isArray(item.artists) && item.artists.length
            ? formatSingerName(item.artists)
            : (typeof item.artist?.name === 'string' ? item.artist.name : ''),
          img: picUrl || blurUrl,
          publishTime: formatPublishDate(item.publishTime),
          songCount: parseNonNegativeInt(item.size),
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
  async getAlbumDetail(id, page = 1, limit = 50) {
    const { body } = await eapiRequest(`/api/v1/album/${encodeURIComponent(id)}`, {}).promise
    if (body?.code !== 200) throw new Error('Get album songs failed')
    if (!Array.isArray(body.songs)) throw new MusicSdkResponseError()
    const songs = body.songs.slice((page - 1) * limit, page * limit)
    // The legacy singer converter silently skips missing IDs. A nonempty malformed page is not an empty album.
    const validId = id => (typeof id === 'number' && Number.isSafeInteger(id) && id > 0) || (typeof id === 'string' && /^[1-9]\d*$/.test(id))
    if (songs.some(song => !song || !validId(song.id))) throw new MusicSdkResponseError()
    let list
    try {
      list = singer.filterSongList(songs)
    } catch {
      throw new MusicSdkResponseError()
    }
    // This endpoint returns the complete album. Present the same one-based paging contract as other SDKs.
    return {
      list,
      total: body.songs.length,
      page,
      limit,
      source: 'wy',
    }
  },
}
