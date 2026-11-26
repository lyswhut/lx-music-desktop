import { isDomesticOnlineSource } from '@common/constants'
import { qualityList, userApi } from '@renderer/store'
import musicSdk from '@renderer/utils/musicSdk'
import {
  // getOtherSource as getOtherSourceFromStore,
  // saveOtherSource as saveOtherSourceFromStore,
  getMusicUrl as getStoreMusicUrl,
  getMusicUrlInfo,
  getPlayerLyric as getStoreLyric,
} from '@renderer/utils/ipc'
import { appSetting } from '@renderer/store/setting'
import { langS2T, toNewMusicInfo, toOldMusicInfo } from '@renderer/utils'
import { apis } from '@renderer/utils/musicSdk/api-source'
import { buildBackupApiIds, isProviderServable } from './sourceRotation'
import { BUILTIN_YTM_QUALITIES, sourceRotationEnv } from './sourceCapabilities'
import { isYtmStreamUrlExpired } from '@renderer/utils/musicSdk/ytm/streamUtils'
import { hasExactArtistSetMatch, isStrictSameRecording, matchSeed, parseIntervalSec } from '../recommend/seedMatch'


const getOtherSourcePromises = new Map()
const otherSourceCache = new Map<LX.Music.MusicInfo | LX.Download.ListItem, { ytmEnabled: boolean, list: LX.Music.MusicInfoOnline[] }>()
export const existTimeExp = /\[\d{1,2}:.*\d{1,4}\]/

export const isDomesticSourceServable = (source: LX.Source): boolean => (
  isDomesticOnlineSource(source) && isProviderServable(sourceRotationEnv(), source)
)

const isYtmFallbackEnabledForSource = (source: string): boolean => (
  source === 'ytm' || appSetting['recommend.ytm.enable'] !== false
)

export const getOtherSource = async(musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, isRefresh = false): Promise<LX.Music.MusicInfoOnline[]> => {
  const sourceKind = 'progress' in musicInfo ? musicInfo.metadata.musicInfo.source : musicInfo.source
  const ytmEnabled = isYtmFallbackEnabledForSource(sourceKind)
  if (!isRefresh && otherSourceCache.has(musicInfo)) {
    const cached = otherSourceCache.get(musicInfo)!
    if (sourceKind === 'ytm' || cached.ytmEnabled === ytmEnabled) return cached.list
    otherSourceCache.delete(musicInfo)
  }
  let key: string
  let searchMusicInfo: {
    name: string
    singer: string
    source: string
    albumName: string
    interval: string
  }
  if ('progress' in musicInfo) {
    key = `local_${musicInfo.id}_${ytmEnabled ? '1' : '0'}`
    searchMusicInfo = {
      name: musicInfo.metadata.musicInfo.name,
      singer: musicInfo.metadata.musicInfo.singer,
      source: musicInfo.metadata.musicInfo.source,
      albumName: musicInfo.metadata.musicInfo.meta.albumName,
      interval: musicInfo.metadata.musicInfo.interval ?? '',
    }
  } else {
    key = `${musicInfo.source}_${musicInfo.id}_${ytmEnabled ? '1' : '0'}`
    searchMusicInfo = {
      name: musicInfo.name,
      singer: musicInfo.singer,
      source: musicInfo.source,
      albumName: musicInfo.meta.albumName,
      interval: musicInfo.interval ?? '',
    }
  }
  if (!isRefresh && getOtherSourcePromises.has(key)) return getOtherSourcePromises.get(key)

  const promise = new Promise<LX.Music.MusicInfoOnline[]>((resolve, reject) => {
    let timedOut = false
    let timeout: null | NodeJS.Timeout = setTimeout(() => {
      timeout = null
      timedOut = true
      reject(new Error('find music timeout'))
    }, 15_000)
    musicSdk.findMusic(searchMusicInfo).then((otherSource) => {
      const source = otherSource.map(toNewMusicInfo) as LX.Music.MusicInfoOnline[]
      // 超时后迟到结果、已被更新刷新取代的旧请求或瞬时失败产生的空数组均不得回写缓存
      if (!timedOut && source.length && getOtherSourcePromises.get(key) === promise) {
        if (otherSourceCache.size > 10) otherSourceCache.clear()
        otherSourceCache.set(musicInfo, { ytmEnabled, list: source })
      }
      resolve(source)
    }).catch(reject).finally(() => {
      if (timeout) clearTimeout(timeout)
    })
  }).finally(() => {
    if (getOtherSourcePromises.get(key) === promise) getOtherSourcePromises.delete(key)
  })
  getOtherSourcePromises.set(key, promise)
  return promise
}


export const buildLyricInfo = async(lyricInfo: MakeOptional<LX.Player.LyricInfo, 'rawlrcInfo'>): Promise<LX.Player.LyricInfo> => {
  if (!appSetting['player.isS2t']) {
    // @ts-expect-error
    if (lyricInfo.rawlrcInfo) return lyricInfo
    return { ...lyricInfo, rawlrcInfo: { ...lyricInfo } }
  }

  if (appSetting['player.isS2t']) {
    const tasks = [
      lyricInfo.lyric ? langS2T(lyricInfo.lyric) : Promise.resolve(''),
      lyricInfo.tlyric ? langS2T(lyricInfo.tlyric) : Promise.resolve(''),
      lyricInfo.rlyric ? langS2T(lyricInfo.rlyric) : Promise.resolve(''),
      lyricInfo.lxlyric ? langS2T(lyricInfo.lxlyric) : Promise.resolve(''),
    ]
    if (lyricInfo.rawlrcInfo) {
      tasks.push(lyricInfo.lyric ? langS2T(lyricInfo.lyric) : Promise.resolve(''))
      tasks.push(lyricInfo.tlyric ? langS2T(lyricInfo.tlyric) : Promise.resolve(''))
      tasks.push(lyricInfo.rlyric ? langS2T(lyricInfo.rlyric) : Promise.resolve(''))
      tasks.push(lyricInfo.lxlyric ? langS2T(lyricInfo.lxlyric) : Promise.resolve(''))
    }
    return Promise.all(tasks).then(([lyric, tlyric, rlyric, lxlyric, lyric_raw, tlyric_raw, rlyric_raw, lxlyric_raw]) => {
      const rawlrcInfo = lyric_raw ? {
        lyric: lyric_raw,
        tlyric: tlyric_raw,
        rlyric: rlyric_raw,
        lxlyric: lxlyric_raw,
      } : {
        lyric,
        tlyric,
        rlyric,
        lxlyric,
      }
      return {
        lyric,
        tlyric,
        rlyric,
        lxlyric,
        rawlrcInfo,
      }
    })
  }

  // @ts-expect-error
  return lyricInfo.rawlrcInfo ? lyricInfo : { ...lyricInfo, rawlrcInfo: { ...lyricInfo } }
}

export const getCachedLyricInfo = async(musicInfo: LX.Music.MusicInfo): Promise<LX.Player.LyricInfo | null> => {
  let lrcInfo = await getStoreLyric(musicInfo)
  // lrcInfo = {} as unknown as LX.Player.LyricInfo
  if (existTimeExp.test(lrcInfo.lyric)) {
    if (musicInfo.source == 'ytm' || musicInfo.source == 'local') return lrcInfo
    if (lrcInfo.tlyric != null) {
      if (lrcInfo.lxlyric == null) {
        switch (musicInfo.source) { // 以下源支持lxlyric 重新获取
          case 'kg':
          case 'kw':
          case 'mg':
          case 'wy':
          case 'tx':
            break
          default:
            return lrcInfo
        }
      } else if (lrcInfo.rlyric == null) {
        // 以下源支持 rlyric 重新获取
        if (!['wy', 'kg', 'tx'].includes(musicInfo.source)) return lrcInfo
      } else return lrcInfo
    }
  }
  return null
}

export const getOnlineOtherSourceMusicUrlByLocal = async(musicInfo: LX.Music.MusicInfoLocal, isRefresh: boolean): Promise<{
  url: string
  quality: LX.Quality
  isFromCache: boolean
}> => {
  if (!await window.lx.apiInitPromise[0]) throw new Error('source init failed')

  const quality = '128k'

  const cachedUrl = await getStoreMusicUrl(musicInfo, quality)
  if (cachedUrl && !isRefresh) return { url: cachedUrl, quality, isFromCache: true }

  let reqPromise
  try {
    reqPromise = apis('local').getMusicUrl(toOldMusicInfo(musicInfo), null).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }

  return reqPromise.then(({ url }: { url: string }) => {
    return { url, quality, isFromCache: false }
  })
}

export const getOnlineOtherSourceLyricByLocal = async(musicInfo: LX.Music.MusicInfoLocal, isRefresh: boolean): Promise<{
  lyricInfo: LX.Music.LyricInfo
  isFromCache: boolean
}> => {
  if (!await window.lx.apiInitPromise[0]) throw new Error('source init failed')

  const lyricInfo = await getCachedLyricInfo(musicInfo)
  if (lyricInfo && !isRefresh) return { lyricInfo, isFromCache: true }

  let reqPromise
  try {
    reqPromise = apis('local').getLyric(toOldMusicInfo(musicInfo)).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }

  return reqPromise.then((lyricInfo: LX.Music.LyricInfo) => {
    return { lyricInfo, isFromCache: false }
  })
}

export const getOnlineOtherSourcePicByLocal = async(musicInfo: LX.Music.MusicInfoLocal): Promise<{
  url: string
}> => {
  if (!await window.lx.apiInitPromise[0]) throw new Error('source init failed')

  let reqPromise
  try {
    reqPromise = apis('local').getPic(toOldMusicInfo(musicInfo)).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }

  return reqPromise.then((url: string) => {
    return { url }
  })
}

export const TRY_QUALITYS_LIST = ['flac24bit', 'flac', '320k'] as const
type TryQualityType = typeof TRY_QUALITYS_LIST[number]
export const getPlayQuality = (highQuality: LX.Quality, musicInfo: LX.Music.MusicInfoOnline, apiId?: string): LX.Quality => {
  let type: LX.Quality = '128k'
  if (TRY_QUALITYS_LIST.includes(highQuality as TryQualityType)) {
    // 指定 apiId 时按该音源自己的可用音质取档（备源与主源支持的档位可能不同）；ytm 内置直连默认提供 ['128k', '320k']
    let list = apiId == null
      ? (qualityList.value[musicInfo.source] ?? (musicInfo.source === 'ytm' ? BUILTIN_YTM_QUALITIES : undefined))
      : userApi.qualityLists[apiId]?.[musicInfo.source]

    let t = TRY_QUALITYS_LIST
      .slice(TRY_QUALITYS_LIST.indexOf(highQuality as TryQualityType))
      .find(q => musicInfo.meta._qualitys[q] && list?.includes(q))

    if (t) type = t
  }
  return type
}

/** 通过指定音源取流（apiId 为空走主源默认路径；ytm 自定义源失败时自动兜底至内置直链引擎） */
const fetchMusicUrlByApi = async(
  musicInfo: LX.Music.MusicInfoOnline,
  quality: LX.Quality,
  apiId?: string,
  preferMp4 = false,
  verifyOpenRange = false,
): Promise<{ url: string, type: LX.Quality }> => {
  let reqPromise: Promise<{ url: string, type: LX.Quality }> | null = null
  try {
    if (apiId) {
      // 下载 .m4a 时跳过自定义 ytm 备源脚本（避免未知容器写入 .m4a），与主源策略保持一致
      if (musicInfo.source === 'ytm' && preferMp4) {
        return Promise.reject(new Error('skip custom ytm backup for mp4 download'))
      }
      const handler = apis(musicInfo.source, apiId)
      if (handler?.getMusicUrl) reqPromise = handler.getMusicUrl(toOldMusicInfo(musicInfo), quality).promise
    } else if (musicInfo.source === 'ytm') {
      const ytmOptions = preferMp4 || verifyOpenRange
        ? { ...(preferMp4 ? { preferMp4: true } : {}), ...(verifyOpenRange ? { verifyOpenRange: true } : {}) }
        : undefined
      let customHandler: any = null
      if (!preferMp4 && appSetting['common.apiSource'] !== 'ytm_builtin') {
        try {
          customHandler = apis('ytm')
        } catch {}
      }
      if (customHandler && typeof customHandler.getMusicUrl === 'function') {
        reqPromise = customHandler.getMusicUrl(toOldMusicInfo(musicInfo), quality).promise.catch(() => (
          musicSdk.ytm.getMusicUrl(toOldMusicInfo(musicInfo), quality, ytmOptions).promise
        ))
      } else {
        reqPromise = musicSdk.ytm.getMusicUrl(toOldMusicInfo(musicInfo), quality, ytmOptions).promise
      }
    } else {
      reqPromise = musicSdk[musicInfo.source].getMusicUrl(toOldMusicInfo(musicInfo), quality).promise
    }
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise ?? Promise.reject(new Error('api is not found'))
}

/**
 * 主源失败后按序轮换备源（提供方内层）。429 限流与普通失败同样立即切下一个源，不做同源等待重试。
 * allowToggleSource 为 false 时不轮换（保持既有语义：换源重放分支与关闭自动换源的下载不切换）。
 */
const fetchMusicUrlWithRotation = async({ musicInfo, quality, onToggleApiSource, allowToggleSource, preferMp4 = false, isRefresh = false }: {
  musicInfo: LX.Music.MusicInfoOnline
  quality?: LX.Quality
  onToggleApiSource?: () => void
  allowToggleSource: boolean
  preferMp4?: boolean
  isRefresh?: boolean
}): Promise<{ url: string, quality: LX.Quality }> => {
  let firstError: any
  try {
    const apiReady = await window.lx.apiInitPromise[0]
    // ytm 内置直链引擎不依赖第三方自定义源初始化成功，即使未装国内脚本仍可直接播放/下载
    if (!apiReady && musicInfo.source !== 'ytm') throw new Error('source init failed')
    const primaryQuality = quality ?? getPlayQuality(appSetting['player.playQuality'], musicInfo)
    const { url, type } = await fetchMusicUrlByApi(musicInfo, primaryQuality, undefined, preferMp4, isRefresh)
    return { url, quality: type }
  } catch (err: any) {
    firstError = err
    console.log(err)
  }
  if (!allowToggleSource) throw firstError
  for (const apiId of buildBackupApiIds(sourceRotationEnv(), musicInfo.source)) {
    const itemQuality = quality ?? getPlayQuality(appSetting['player.playQuality'], musicInfo, apiId)
    // 自动选档允许与主源一致的 128k 兜底，平台元数据缺失不代表无法取流；显式音质仍须校验。
    if (quality != null && !musicInfo.meta._qualitys[itemQuality]) continue
    onToggleApiSource?.()
    try {
      const { url, type } = await fetchMusicUrlByApi(musicInfo, itemQuality, apiId, preferMp4, isRefresh)
      return { url, quality: type }
    } catch (err: any) {
      console.log(err)
    }
  }
  throw firstError
}

export const getOnlineOtherSourceMusicUrl = async({ musicInfos, quality, onToggleSource, onToggleApiSource, isRefresh, retryedSource = [], preferMp4 = false, allowYtm = true }: {
  musicInfos: LX.Music.MusicInfoOnline[]
  quality?: LX.Quality
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  onToggleApiSource?: () => void
  isRefresh: boolean
  retryedSource?: LX.OnlineSource[]
  preferMp4?: boolean
  allowYtm?: boolean
}): Promise<{
  url: string
  musicInfo: LX.Music.MusicInfoOnline
  quality: LX.Quality
  isFromCache: boolean
}> => {
  await window.lx.apiInitPromise[0]

  const env = sourceRotationEnv()
  let musicInfo: LX.Music.MusicInfoOnline | null = null
  // eslint-disable-next-line no-cond-assign
  while (musicInfo = (musicInfos.shift()!)) {
    if (retryedSource.includes(musicInfo.source)) continue
    retryedSource.push(musicInfo.source)
    if (!allowYtm && musicInfo.source === 'ytm') continue
    // 主源或任一备源可服务即不跳过（仅主源不支持的平台可能由备源救回）
    if (!isProviderServable(env, musicInfo.source)) continue

    console.log('try toggle to: ', musicInfo.source, musicInfo.name, musicInfo.singer, musicInfo.interval)
    onToggleSource(musicInfo)
    break
  }
  if (!musicInfo) throw new Error(window.i18n.t('toggle_source_failed'))

  // 主源音质仅用于查询缓存，不能据此淘汰提供方；取流时各音源独立选档。
  const itemQuality = quality ?? getPlayQuality(appSetting['player.playQuality'], musicInfo)
  const skipCacheForMp4 = Boolean(preferMp4 && musicInfo.source === 'ytm')
  const cached = (isRefresh || skipCacheForMp4) ? null : await getMusicUrlInfo(musicInfo, itemQuality)
  if (cached?.musicInfo?.id === musicInfo.id && !isYtmStreamUrlExpired(cached.url)) {
    return { url: cached.url, musicInfo: cached.musicInfo, quality: itemQuality, isFromCache: true }
  }

  // 提供方内层：主源 → 备源按序轮换；穷尽后递归下一个候选提供方
  try {
    const { url, quality: type } = await fetchMusicUrlWithRotation({ musicInfo, quality, onToggleApiSource, allowToggleSource: true, preferMp4, isRefresh })
    return { musicInfo, url, quality: type, isFromCache: false }
  } catch (err: any) {
    console.log(err)
    return getOnlineOtherSourceMusicUrl({ musicInfos, quality, onToggleSource, onToggleApiSource, isRefresh, retryedSource, preferMp4, allowYtm })
  }
}

/**
 * 获取在线音乐URL
 */
export const handleGetOnlineMusicUrl = async({ musicInfo, quality, onToggleSource, onToggleApiSource, isRefresh, allowToggleSource, alternativeMusicInfos = [], preferMp4 = false }: {
  musicInfo: LX.Music.MusicInfoOnline
  quality?: LX.Quality
  isRefresh: boolean
  allowToggleSource: boolean
  alternativeMusicInfos?: LX.Music.MusicInfoOnline[]
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  onToggleApiSource?: () => void
  preferMp4?: boolean
}): Promise<{
  url: string
  musicInfo: LX.Music.MusicInfoOnline
  quality: LX.Quality
  isFromCache: boolean
}> => {
  // console.log(musicInfo.source)
  // 提供方内层：先穷尽本提供方的所有启用音源（主源 → 备源按序）
  try {
    const { url, quality: type } = await fetchMusicUrlWithRotation({ musicInfo, quality, onToggleApiSource, allowToggleSource, preferMp4, isRefresh })
    return { musicInfo, url, quality: type, isFromCache: false }
  } catch (err: any) {
    console.log(err)
    if (!allowToggleSource) throw err
    const allowYtmFallback = isYtmFallbackEnabledForSource(musicInfo.source)
    // 聚合的同作品去重不等于同录音：先校验标题/艺人/版本，并沿用换源的 ±5 秒时长限制。
    const toTrack = (info: LX.Music.MusicInfoOnline) => ({
      artist: info.singer, title: info.name, album: info.meta.albumName, intervalSec: parseIntervalSec(info.interval),
    })
    const target = toTrack(musicInfo)
    const known = alternativeMusicInfos.filter(info => {
      if (info.source === musicInfo.source) return false
      if (!allowYtmFallback && info.source === 'ytm') return false
      const track = toTrack(info)
      if (target.intervalSec != null && track.intervalSec != null && Math.abs(target.intervalSec - track.intervalSec) > 5) return false
      if (musicInfo.source === 'ytm' || info.source === 'ytm') {
        return isStrictSameRecording(target, track, { simplifyChinese: true }) &&
          hasExactArtistSetMatch(target.artist, track.artist, true) &&
          matchSeed(target, [track], { simplifyChinese: true }) != null
      }
      return matchSeed(target, [track]) != null
    })
    const retryedSource = [musicInfo.source]
    if (known.length) {
      try {
        return await getOnlineOtherSourceMusicUrl({ musicInfos: known, quality, onToggleSource, onToggleApiSource, isRefresh, retryedSource, preferMp4, allowYtm: allowYtmFallback })
      } catch {}
    }
    // 提供方外层：切换到其他提供方的同曲变体（findMusic 候选，按音质丰富度排序）
    onToggleSource()
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    return getOtherSource(musicInfo, isRefresh).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        return getOnlineOtherSourceMusicUrl({
          musicInfos: [...otherSource],
          onToggleSource,
          onToggleApiSource,
          quality,
          isRefresh,
          retryedSource,
          preferMp4,
          allowYtm: allowYtmFallback,
        })
      }
      throw err
    })
  }
}


export const getOnlineOtherSourcePicUrl = async({ musicInfos, onToggleSource, isRefresh, retryedSource = [] }: {
  musicInfos: LX.Music.MusicInfoOnline[]
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  isRefresh: boolean
  retryedSource?: LX.OnlineSource[]
}): Promise<{
  url: string
  musicInfo: LX.Music.MusicInfoOnline
  isFromCache: boolean
}> => {
  let musicInfo: LX.Music.MusicInfoOnline | null = null
  // eslint-disable-next-line no-cond-assign
  while (musicInfo = (musicInfos.shift()!)) {
    if (retryedSource.includes(musicInfo.source)) continue
    retryedSource.push(musicInfo.source)
    // if (!assertApiSupport(musicInfo.source)) continue
    console.log('try toggle to: ', musicInfo.source, musicInfo.name, musicInfo.singer, musicInfo.interval)
    onToggleSource(musicInfo)
    break
  }
  if (!musicInfo) throw new Error(window.i18n.t('toggle_source_failed'))

  if (musicInfo.meta.picUrl && !isRefresh) return { musicInfo, url: musicInfo.meta.picUrl, isFromCache: true }

  let reqPromise
  try {
    reqPromise = musicSdk[musicInfo.source].getPic(toOldMusicInfo(musicInfo))
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }
  // retryedSource.includes(musicInfo.source)
  return reqPromise.then((url: string) => {
    return { musicInfo, url, isFromCache: false }
    // eslint-disable-next-line @typescript-eslint/promise-function-async
  }).catch((err: any) => {
    console.log(err)
    return getOnlineOtherSourcePicUrl({ musicInfos, onToggleSource, isRefresh, retryedSource })
  })
}

/**
 * 获取在线歌曲封面
 */
export const handleGetOnlinePicUrl = async({ musicInfo, isRefresh, onToggleSource, allowToggleSource, skipPrimary = false }: {
  musicInfo: LX.Music.MusicInfoOnline
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  isRefresh: boolean
  allowToggleSource: boolean
  /** 当 <img> 加载原平台封面失败时，跳过原平台 getPic 直达跨源回落（避免重复返回同一失效缩略图）。 */
  skipPrimary?: boolean
}): Promise<{
  url: string
  musicInfo: LX.Music.MusicInfoOnline
  isFromCache: boolean
}> => {
  // console.log(musicInfo.source)
  let reqPromise
  if (skipPrimary) {
    reqPromise = Promise.reject(new Error('skip primary pic'))
  } else {
    try {
      reqPromise = musicSdk[musicInfo.source].getPic(toOldMusicInfo(musicInfo))
    } catch (err) {
      reqPromise = Promise.reject(err)
    }
  }
  return reqPromise.then((url: string) => {
    return { musicInfo, url, isFromCache: false }
  }).catch(async(err: any) => {
    console.log(err)
    if (!allowToggleSource) throw err
    onToggleSource()
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    return getOtherSource(musicInfo, isRefresh).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        return getOnlineOtherSourcePicUrl({
          musicInfos: [...otherSource],
          onToggleSource,
          // YTM 封面回落时 isRefresh 仅用于跳过失效 YTM 封面，允许直接复用已严格匹配国内候选自带的有效 meta.picUrl
          isRefresh: musicInfo.source === 'ytm' ? false : isRefresh,
          retryedSource: [musicInfo.source],
        })
      }
      throw err
    })
  })
}


export const getOnlineOtherSourceLyricInfo = async({ musicInfos, onToggleSource, isRefresh, retryedSource = [], fallbackUntimed }: {
  musicInfos: LX.Music.MusicInfoOnline[]
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  isRefresh: boolean
  retryedSource?: LX.OnlineSource[]
  fallbackUntimed?: { lyric: string, musicInfo: LX.Music.MusicInfoOnline }
}): Promise<{
  lyricInfo: LX.Music.LyricInfo | LX.Player.LyricInfo
  musicInfo: LX.Music.MusicInfoOnline
  isFromCache: boolean
  isUntimedFallback?: boolean
}> => {
  let musicInfo: LX.Music.MusicInfoOnline | null = null
  // eslint-disable-next-line no-cond-assign
  while (musicInfo = (musicInfos.shift()!)) {
    if (retryedSource.includes(musicInfo.source)) continue
    retryedSource.push(musicInfo.source)
    // if (!assertApiSupport(musicInfo.source)) continue
    console.log('try toggle to: ', musicInfo.source, musicInfo.name, musicInfo.singer, musicInfo.interval)
    onToggleSource(musicInfo)
    break
  }
  if (!musicInfo) {
    if (fallbackUntimed) {
      return {
        musicInfo: fallbackUntimed.musicInfo,
        lyricInfo: { lyric: fallbackUntimed.lyric, tlyric: '', rlyric: '', lxlyric: '' },
        isFromCache: false,
        isUntimedFallback: true,
      }
    }
    throw new Error(window.i18n.t('toggle_source_failed'))
  }

  if (!isRefresh) {
    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo) return { musicInfo, lyricInfo, isFromCache: true }
  }

  let reqPromise
  try {
    // TODO: remove any type
    reqPromise = (musicSdk[musicInfo.source].getLyric(toOldMusicInfo(musicInfo)) as any).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }
  let nextFallback = fallbackUntimed
  // retryedSource.includes(musicInfo.source)
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return reqPromise.then((lyricInfo: LX.Music.LyricInfo & { untimedLyric?: string }) => {
    if (existTimeExp.test(lyricInfo.lyric)) {
      return {
        lyricInfo,
        musicInfo,
        isFromCache: false,
      }
    }
    if (!nextFallback && typeof lyricInfo.untimedLyric === 'string' && existTimeExp.test(lyricInfo.untimedLyric)) {
      nextFallback = { lyric: lyricInfo.untimedLyric, musicInfo }
    }
    return Promise.reject(new Error('failed'))
    // eslint-disable-next-line @typescript-eslint/promise-function-async
  }).catch((err: any) => {
    console.log(err)
    return getOnlineOtherSourceLyricInfo({ musicInfos, onToggleSource, isRefresh, retryedSource, fallbackUntimed: nextFallback })
  })
}

/**
 * 获取在线歌词信息
 */
export const handleGetOnlineLyricInfo = async({ musicInfo, onToggleSource, isRefresh, allowToggleSource }: {
  musicInfo: LX.Music.MusicInfoOnline
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  isRefresh: boolean
  allowToggleSource: boolean
}): Promise<{
  musicInfo: LX.Music.MusicInfoOnline
  lyricInfo: LX.Music.LyricInfo | LX.Player.LyricInfo
  isFromCache: boolean
  isUntimedFallback?: boolean
}> => {
  // console.log(musicInfo.source)
  let reqPromise
  try {
    // TODO: remove any type
    reqPromise = (musicSdk[musicInfo.source].getLyric(toOldMusicInfo(musicInfo)) as any).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return reqPromise.then((lyricInfo: LX.Music.LyricInfo & { untimedLyric?: string }) => {
    if (existTimeExp.test(lyricInfo.lyric)) {
      return {
        musicInfo,
        lyricInfo,
        isFromCache: false,
      }
    }
    const untimed = typeof lyricInfo.untimedLyric === 'string' && existTimeExp.test(lyricInfo.untimedLyric)
      ? lyricInfo.untimedLyric
      : ''
    if (untimed && !allowToggleSource) {
      return {
        musicInfo,
        lyricInfo: { lyric: untimed, tlyric: '', rlyric: '', lxlyric: '' },
        isFromCache: false,
        isUntimedFallback: true,
      }
    }
    const err = new Error('failed') as Error & { untimedLyric?: string }
    if (untimed) err.untimedLyric = untimed
    return Promise.reject(err)
  }).catch(async(err: any) => {
    console.log(err)
    const fallbackUntimed: string = typeof err?.untimedLyric === 'string' ? err.untimedLyric : ''
    if (!allowToggleSource) throw err

    onToggleSource()
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    return getOtherSource(musicInfo, isRefresh).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        return getOnlineOtherSourceLyricInfo({
          musicInfos: [...otherSource],
          onToggleSource,
          isRefresh,
          retryedSource: [musicInfo.source],
        })
      }
      throw err
    }).catch((toggleErr: any) => {
      if (fallbackUntimed) {
        return {
          musicInfo,
          lyricInfo: { lyric: fallbackUntimed, tlyric: '', rlyric: '', lxlyric: '' },
          isFromCache: false,
          isUntimedFallback: true,
        }
      }
      throw toggleErr
    })
  })
}
