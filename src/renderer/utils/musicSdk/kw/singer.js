import { httpFetch } from '../../request'
import { decodeName, formatPlayTime } from '../../index'
import { MusicSdkResponseError } from '../responseError'
import { parseNonEmptyString, parseNonNegativeInt, parseValidCatalogId } from '../utils'
import { formatSinger } from './util'

const mInfoRxp = /level:(\w+),bitrate:(\d+),format:(\w+),size:([\w.]+)/

const parseQuality = (rawMInfo, rawFormats) => {
  const types = []
  const _types = {}
  if (typeof rawMInfo === 'string' && rawMInfo) {
    for (const part of rawMInfo.split(';')) {
      const match = part.match(mInfoRxp)
      if (!match) continue
      const size = match[4].toLocaleUpperCase()
      switch (match[2]) {
        case '4000':
          if (!_types.flac24bit) {
            types.push({ type: 'flac24bit', size })
            _types.flac24bit = { size }
          }
          break
        case '2000':
          if (!_types.flac) {
            types.push({ type: 'flac', size })
            _types.flac = { size }
          }
          break
        case '320':
          if (!_types['320k']) {
            types.push({ type: '320k', size })
            _types['320k'] = { size }
          }
          break
        case '128':
          if (!_types['128k']) {
            types.push({ type: '128k', size })
            _types['128k'] = { size }
          }
          break
      }
    }
    types.reverse()
  }
  if (!types.length && typeof rawFormats === 'string' && rawFormats) {
    const formats = rawFormats.split('|')
    if (formats.includes('MP3128')) {
      types.push({ type: '128k', size: null })
      _types['128k'] = { size: null }
    }
    if (formats.includes('MP3H')) {
      types.push({ type: '320k', size: null })
      _types['320k'] = { size: null }
    }
    if (formats.includes('ALFLAC')) {
      types.push({ type: 'flac', size: null })
      _types.flac = { size: null }
    }
    if (formats.includes('HIRFLAC')) {
      types.push({ type: 'flac24bit', size: null })
      _types.flac24bit = { size: null }
    }
  }
  return { types, _types }
}

const buildKwImageUrl = (picPath, basePath = '') => {
  if (typeof picPath !== 'string') return ''
  const clean = picPath.trim()
  if (!clean) return ''
  if (/^https?:\/\//i.test(clean)) return clean
  const base = typeof basePath === 'string' ? basePath.trim() : ''
  return base ? `${base.replace(/\/+$/, '')}/${clean.replace(/^\/+/, '')}` : ''
}

export default {
  limit: 20,
  search(str, page = 1, limit = 20) {
    const req = httpFetch(
      `http://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(str)}&pn=${page - 1}&rn=${limit}&ft=artist&encoding=utf8&rformat=json&mobi=1&newver=1`,
    )
    const promise = req.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200 || !body || typeof body !== 'object' || Array.isArray(body)) throw new MusicSdkResponseError()
      const total = parseNonNegativeInt(body.TOTAL)
      const rawList = body.abslist
      if (!Array.isArray(rawList)) {
        if (total === 0 && rawList == null) return { list: [], total: 0, page, limit, source: 'kw' }
        throw new MusicSdkResponseError()
      }
      if (total === null) throw new MusicSdkResponseError()
      const basePic = typeof body.BASEPICPATH === 'string' && body.BASEPICPATH.trim()
        ? body.BASEPICPATH
        : 'http://img1.kuwo.cn/star/starheads/'
      const list = rawList.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        const id = parseValidCatalogId(item.ARTISTID)
        const name = parseNonEmptyString(item.ARTIST)
        if (!id || !name) throw new MusicSdkResponseError()
        return {
          id,
          name: decodeName(name),
          img: buildKwImageUrl(item.hts_PICPATH || item.PICPATH, basePic),
          songCount: parseNonNegativeInt(item.SONGNUM),
          albumCount: parseNonNegativeInt(item.ALBUMNUM),
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

  async getSongList(id, page = 1, limit = 50) {
    const req = httpFetch(
      `http://search.kuwo.cn/r.s?stype=artist2music&artistid=${encodeURIComponent(id)}&pn=${page - 1}&rn=${limit}&encoding=utf8&rformat=json&mobi=1`,
    )
    const { statusCode, body } = await req.promise
    if (statusCode !== 200 || !body || typeof body !== 'object' || Array.isArray(body)) {
      throw new MusicSdkResponseError()
    }
    const rawTotal = body.total ?? body.TOTAL
    const hasTotal = rawTotal !== undefined && rawTotal !== null && rawTotal !== ''
    const total = hasTotal ? parseNonNegativeInt(rawTotal) : null
    if (hasTotal && total === null) throw new MusicSdkResponseError()
    const rawList = body.musiclist
    if (!Array.isArray(rawList)) {
      if (total === 0 && rawList == null) {
        return { list: [], total: 0, page, limit, source: 'kw' }
      }
      throw new MusicSdkResponseError()
    }
    const fallbackArtist = typeof body.artist === 'string' ? decodeName(body.artist) : ''
    const fallbackArtistId = parseValidCatalogId(id)
    const list = rawList.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
      const rawSongId = parseValidCatalogId(item.musicrid ?? item.id)
      const songId = rawSongId ? parseValidCatalogId(rawSongId.replace(/^MUSIC_/, '')) : null
      const rawName = parseNonEmptyString(item.name)
      if (!songId || !rawName) throw new MusicSdkResponseError()
      const { types, _types } = parseQuality(item.N_MINFO || item.MINFO, item.formats)
      const duration = parseNonNegativeInt(item.duration)
      const rawArtist = typeof item.artist === 'string' && item.artist.trim() ? decodeName(item.artist) : fallbackArtist
      const artistName = formatSinger(rawArtist)
      const artistId = parseValidCatalogId(item.artistid) ?? fallbackArtistId
      const rawAlbumId = parseValidCatalogId(item.albumid)
      return {
        name: decodeName(rawName),
        singer: artistName,
        artists: artistId && artistName && !artistName.includes('、') ? [{ id: artistId, name: artistName }] : undefined,
        source: 'kw',
        songmid: songId,
        albumId: rawAlbumId ? decodeName(rawAlbumId) : '',
        albumName: typeof item.album === 'string' ? decodeName(item.album) : '',
        interval: duration === null ? null : formatPlayTime(duration),
        img: typeof item.img === 'string' ? item.img : null,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
    return {
      list,
      total: total ?? undefined,
      page,
      limit,
      source: 'kw',
    }
  },
}
