import { httpFetch } from '../../request'
import { MusicSdkResponseError } from '../responseError'
import { parseNonEmptyString, parseNonNegativeInt, parseValidCatalogId } from '../utils'
import { createSignature } from './musicSearch'

export const normalizeMiguImg = list => {
  if (!Array.isArray(list) || !list.length) return ''
  const raw = typeof list[0]?.img === 'string' ? list[0].img.trim() : ''
  if (!raw) return ''
  if (raw.startsWith('//')) return `https:${raw}`
  return /^https?:\/\//i.test(raw) ? raw : `https://d.musicapp.migu.cn/${raw.replace(/^\/+/, '')}`
}

export const searchMiguCatalog = (str, page, limit, switchKey) => {
  const time = Date.now().toString()
  const signData = createSignature(time, str)
  const searchSwitch = JSON.stringify({
    song: 0,
    album: switchKey === 'album' ? 1 : 0,
    singer: switchKey === 'singer' ? 1 : 0,
    tagSong: 0,
    mvSong: 0,
    bestShow: 0,
    songlist: 0,
    lyricSong: 0,
  })
  const req = httpFetch(
    `https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=0&isCopyright=1&searchSwitch=${encodeURIComponent(searchSwitch)}&pageSize=${limit}&text=${encodeURIComponent(str)}&pageNo=${page}&sort=0&sid=USS`,
    {
      headers: {
        uiVersion: 'A_music_3.6.1',
        deviceId: signData.deviceId,
        timestamp: time,
        sign: signData.sign,
        channel: '0146921',
        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 11.0.0; zh-cn; MI 11 Build/OPR1.170623.032) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
      },
    },
  )
  const promise = req.promise.then(({ statusCode, body }) => {
    if (statusCode !== 200 || !body || typeof body !== 'object' || Array.isArray(body) || typeof body.code !== 'string') {
      throw new MusicSdkResponseError()
    }
    if (body.code !== '000000') throw new Error(body.info || '搜索失败')
    return body
  })
  promise.cancel = () => req.cancelHttp?.()
  return promise
}

export default {
  limit: 20,
  search(str, page = 1, limit = 20) {
    const req = searchMiguCatalog(str, page, limit, 'singer')
    const promise = req.then(body => {
      const data = body.singerResultData
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new MusicSdkResponseError()
      const total = parseNonNegativeInt(data.totalCount)
      if (total === null) throw new MusicSdkResponseError()
      const rawList = data.result
      if (!Array.isArray(rawList)) {
        if (total === 0 && rawList == null) return { list: [], total: 0, page, limit, source: 'mg' }
        throw new MusicSdkResponseError()
      }
      const list = rawList.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        const id = parseValidCatalogId(item.id)
        const name = parseNonEmptyString(item.name)
        if (!id || !name) throw new MusicSdkResponseError()
        return {
          id,
          name,
          img: normalizeMiguImg(item.singerPicUrl),
          songCount: parseNonNegativeInt(item.songCount),
          albumCount: parseNonNegativeInt(item.albumCount),
          source: 'mg',
        }
      })
      return {
        list,
        total,
        page,
        limit,
        source: 'mg',
      }
    })
    promise.cancel = () => req.cancel?.()
    return promise
  },
}
