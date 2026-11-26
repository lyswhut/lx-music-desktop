import kw from './kw/index'
import kg from './kg/index'
import tx from './tx/index'
import wy from './wy/index'
import mg from './mg/index'
import bd from './bd/index'
import xm from './xm'
import ytm from './ytm'
import { DOMESTIC_ONLINE_SOURCES } from '@common/constants'
import { YTM_AGGREGATE_SEARCH_TIMEOUT_MS } from '@common/recommendationConfig'
import { simplify } from '@renderer/utils/simplify-chinese-main'
import { hasExactArtistSetMatch, isStrictSameRecording, matchSeed, parseIntervalSec } from '@renderer/core/recommend/seedMatch'
import { getLiveYtmContextKey, isYtmAggregateSearchEnabled } from './ytm/runtimeContext'
import { sharedYtmRegionCache } from './ytm/regionCache'
import { supportQuality } from './api-source'
import { versionChars } from './versionChars'


const sources = {
  sources: [
    {
      name: '酷我音乐',
      id: 'kw',
    },
    {
      name: '酷狗音乐',
      id: 'kg',
    },
    {
      name: 'QQ音乐',
      id: 'tx',
    },
    {
      name: '网易云音乐',
      id: 'wy',
    },
    {
      name: '咪咕音乐',
      id: 'mg',
    },
    {
      name: 'YouTube Music',
      id: 'ytm',
    },
    {
      name: '虾米音乐',
      id: 'xm',
    },
    // {
    //   name: '百度音乐',
    //   id: 'bd',
    // },
  ],
  kw,
  kg,
  tx,
  wy,
  mg,
  ytm,
  bd,
  xm,
}
export default {
  ...sources,
  init() {
    const tasks = []
    for (let source of sources.sources) {
      let sm = sources[source.id]
      sm && sm.init && tasks.push(sm.init())
    }
    return Promise.all(tasks)
  },
  supportQuality,

  async searchMusic({ name, singer, source: s, limit = 25 }) {
    const trimStr = str => typeof str == 'string' ? str.trim() : str
    const isYtmOrigin = s === 'ytm'
    const musicName = isYtmOrigin ? simplify(trimStr(name) || '') : trimStr(name)
    const musicSinger = isYtmOrigin ? simplify(trimStr(singer) || '') : singer
    const tasks = []
    // 正向遍历国内音源白名单；国内源保留原有关键词拼接
    for (const sourceId of DOMESTIC_ONLINE_SOURCES) {
      if (!sources[sourceId]?.musicSearch || sourceId == s) continue
      const keyword = isYtmOrigin ? `${musicName} ${musicSinger}`.trim() : `${musicName} ${musicSinger || ''}`.trim()
      tasks.push(sources[sourceId].musicSearch.search(keyword, 1, limit).catch(_ => null))
    }
    // 双向平权：国内曲目换源时，若已开启 YouTube Music 且当前代理上下文未地区受限，
    // 以 4s 软超时并行纳入 ytm 候选，VIP/版权受限国内歌曲亦可自动回落至 YouTube Music 播放
    if (
      !isYtmOrigin &&
      sources.ytm?.musicSearch &&
      isYtmAggregateSearchEnabled() &&
      sharedYtmRegionCache.get(getLiveYtmContextKey()) !== true
    ) {
      const ytmKeyword = `${trimStr(name) || ''} ${trimStr(singer) || ''}`.trim()
      if (ytmKeyword) {
        tasks.push(new Promise((resolve) => {
          const req = sources.ytm.musicSearch.search(ytmKeyword, 1, Math.min(limit, 20))
          const timer = setTimeout(() => {
            req?.cancel?.()
            resolve(null)
          }, YTM_AGGREGATE_SEARCH_TIMEOUT_MS)
          Promise.resolve(req).then(res => {
            clearTimeout(timer)
            resolve(res)
          }).catch(() => {
            clearTimeout(timer)
            resolve(null)
          })
        }))
      }
    }
    return (await Promise.all(tasks)).filter(s => s)
  },

  async findMusic({ name, singer, albumName, interval, source: s }) {
    const lists = await this.searchMusic({ name, singer, source: s, limit: 25 })
    // console.log(lists)
    // console.log({ name, singer, albumName, interval, source: s })

    if (s === 'ytm') {
      const target = {
        artist: String(singer ?? ''),
        title: String(name ?? ''),
        album: String(albumName ?? ''),
        intervalSec: parseIntervalSec(interval),
      }
      const strictPerSource = lists.map(source => {
        const rows = (Array.isArray(source.list) ? source.list : [])
          .map(item => ({
            artist: String(item.singer ?? ''),
            title: String(item.name ?? ''),
            album: String(item.albumName ?? ''),
            intervalSec: parseIntervalSec(item.interval),
            raw: item,
          }))
          .filter(row => (
            isStrictSameRecording(target, row, { simplifyChinese: true }) &&
            hasExactArtistSetMatch(target.artist, row.artist, true)
          ))
        if (!rows.length) return null
        const matched = matchSeed(target, rows, { simplifyChinese: true })
        return matched ? matched.raw : null
      }).filter(Boolean)
      return strictPerSource
    }

    const singersRxp = /、|&|;|；|\/|,|，|\|/
    const sortSingle = singer => singersRxp.test(singer)
      ? singer.split(singersRxp).sort((a, b) => a.localeCompare(b)).join('、')
      : (singer || '')
    const sortMusic = (arr, callback) => {
      const tempResult = []
      for (let i = arr.length - 1; i > -1; i--) {
        const item = arr[i]
        if (callback(item)) {
          delete item.fSinger
          delete item.fMusicName
          delete item.fAlbumName
          delete item.fInterval
          tempResult.push(item)
          arr.splice(i, 1)
        }
      }
      tempResult.reverse()
      return tempResult
    }
    const getIntv = (interval) => {
      if (!interval) return 0
      // if (musicInfo._interval) return musicInfo._interval
      let intvArr = interval.split(':')
      let intv = 0
      let unit = 1
      while (intvArr.length) {
        intv += parseInt(intvArr.pop()) * unit
        unit *= 60
      }
      return intv
    }
    const trimStr = str => typeof str == 'string' ? str.trim() : (str || '')
    const filterStr = str => typeof str == 'string'
      ? str.replace(/\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[|!|！/g, '')
      : String(str || '')
    const fMusicName = filterStr(name).toLowerCase()
    const fSinger = filterStr(sortSingle(singer)).toLowerCase()
    const fAlbumName = filterStr(albumName).toLowerCase()
    const fInterval = getIntv(interval)
    const isEqualsInterval = (intv) => Math.abs((fInterval || intv) - (intv || fInterval)) <= 5
    const isEqualsVersionMusicNameChar = (name) => {
      for (const char of versionChars) {
        if (name.includes(char) != fMusicName.includes(char)) return false
      }
      return true
    }
    const isIncludesName = (name) => (fMusicName.includes(name) || name.includes(fMusicName)) && isEqualsVersionMusicNameChar(name)
    const isIncludesSinger = (singer) => fSinger ? (fSinger.includes(singer) || singer.includes(fSinger)) : true
    const isEqualsAlbum = (album) => fAlbumName ? fAlbumName == album : true

    const domesticLists = lists.filter(item => item.source !== 'ytm')
    const ytmLists = lists.filter(item => item.source === 'ytm')

    const result = domesticLists.map(source => {
      for (const item of source.list) {
        item.name = trimStr(item.name)
        item.singer = trimStr(item.singer)
        item.fSinger = filterStr(sortSingle(item.singer).toLowerCase())
        item.fMusicName = filterStr(String(item.name ?? '').toLowerCase())
        item.fAlbumName = filterStr(String(item.albumName ?? '').toLowerCase())
        item.fInterval = getIntv(item.interval)
        // console.log(fMusicName, item.fMusicName, item.source)
        if (!isEqualsInterval(item.fInterval)) {
          item.name = null
          continue
        }
        if (item.fMusicName == fMusicName && isIncludesSinger(item.fSinger)) return item
      }
      for (const item of source.list) {
        if (item.name == null) continue
        if (item.fSinger == fSinger && isIncludesName(item.fMusicName)) return item
      }
      for (const item of source.list) {
        if (item.name == null) continue
        if (isEqualsAlbum(item.fAlbumName) && isIncludesSinger(item.fSinger) && isIncludesName(item.fMusicName)) return item
      }
      return null
    }).filter(s => s)
    const newResult = []
    if (result.length) {
      newResult.push(...sortMusic(result, item => item.fSinger == fSinger && item.fMusicName == fMusicName && item.interval == interval))
      newResult.push(...sortMusic(result, item => item.fMusicName == fMusicName && item.fSinger == fSinger && item.fAlbumName == fAlbumName))
      newResult.push(...sortMusic(result, item => item.fSinger == fSinger && item.fMusicName == fMusicName))
      newResult.push(...sortMusic(result, item => item.fMusicName == fMusicName && item.interval == interval))
      newResult.push(...sortMusic(result, item => item.fSinger == fSinger && item.interval == interval))
      newResult.push(...sortMusic(result, item => item.interval == interval))
      newResult.push(...sortMusic(result, item => item.fMusicName == fMusicName))
      newResult.push(...sortMusic(result, item => item.fSinger == fSinger))
      newResult.push(...sortMusic(result, item => item.fAlbumName == fAlbumName))
      for (const item of result) {
        delete item.fSinger
        delete item.fMusicName
        delete item.fAlbumName
        delete item.fInterval
      }
      newResult.push(...result)
    }
    if (ytmLists.length) {
      const target = {
        artist: String(singer ?? ''),
        title: String(name ?? ''),
        album: String(albumName ?? ''),
        intervalSec: parseIntervalSec(interval),
      }
      for (const ytmSource of ytmLists) {
        const rows = (Array.isArray(ytmSource.list) ? ytmSource.list : [])
          .map(item => ({
            artist: String(item.singer ?? ''),
            title: String(item.name ?? ''),
            album: String(item.albumName ?? ''),
            intervalSec: parseIntervalSec(item.interval),
            raw: item,
          }))
          .filter(row => (
            isStrictSameRecording(target, row, { simplifyChinese: true }) &&
            hasExactArtistSetMatch(target.artist, row.artist, true)
          ))
        if (!rows.length) continue
        const matched = matchSeed(target, rows, { simplifyChinese: true })
        if (matched) newResult.push(matched.raw)
      }
    }
    // console.log(newResult)
    return newResult
  },
}
