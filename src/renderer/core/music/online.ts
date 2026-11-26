import { requestMsg } from '@renderer/utils/message'
import { getPreferredMusicInfo } from './version'
import { appSetting } from '@renderer/store/setting'
import {
  saveLyric,
  saveMusicUrl,
  getMusicUrlInfo,
} from '@renderer/utils/ipc'
import {
  buildLyricInfo,
  getPlayQuality,
  handleGetOnlineLyricInfo,
  handleGetOnlineMusicUrl,
  handleGetOnlinePicUrl,
  getCachedLyricInfo,
  isDomesticSourceServable,
} from './utils'
import { isYtmStreamUrlExpired } from '@renderer/utils/musicSdk/ytm/streamUtils'

/* export const setMusicUrl = ({ musicInfo, type, url }: {
  musicInfo: LX.Music.MusicInfo
  type: LX.Quality
  url: string
}) => {
  saveMusicUrl(musicInfo, type, url)
}

export const setPic = (datas: {
  listId: string
  musicInfo: LX.Music.MusicInfo
  url: string
}) => {
  datas.musicInfo.img = datas.url
  updateMusicInfo({
    listId: datas.listId,
    id: datas.musicInfo.songmid,
    data: { img: datas.url },
    musicInfo: datas.musicInfo,
  })
}
 */


export const getMusicUrl = async({ musicInfo, quality, isRefresh, allowToggleSource = true, onResolvedMusicInfo, onToggleSource = () => {}, onToggleApiSource, alternativeMusicInfos, preferMp4 = false }: {
  musicInfo: LX.Music.MusicInfoOnline
  quality?: LX.Quality
  isRefresh: boolean
  allowToggleSource?: boolean
  alternativeMusicInfos?: LX.Music.MusicInfoOnline[]
  /** 只报告实际取流条目；播放状态和歌单写回由播放器提交。 */
  onResolvedMusicInfo?: (musicInfo: LX.Music.MusicInfoOnline) => void
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
  onToggleApiSource?: () => void
  /** 下载 .m4a 时强制优先 audio/mp4 容器（跳过播放态 Opus 缓存）。 */
  preferMp4?: boolean
}): Promise<string> => {
  // if (!musicInfo._types[type]) {
  //   // 兼容旧版酷我源搜索列表过滤128k音质的bug
  //   if (!(musicInfo.source == 'kw' && type == '128k')) throw new Error('该歌曲没有可播放的音频')

  //   // return Promise.reject(new Error('该歌曲没有可播放的音频'))
  // }
  const requestedQuality = quality ?? getPlayQuality(appSetting['player.playQuality'], musicInfo)
  const cached = isRefresh ? null : await getMusicUrlInfo(musicInfo, requestedQuality)
  const isYtmNonMp4CacheBlocked = Boolean(preferMp4 && (musicInfo.source === 'ytm' || cached?.musicInfo?.source === 'ytm'))
  const isCacheValid = Boolean(cached?.url && !isYtmNonMp4CacheBlocked && !isYtmStreamUrlExpired(cached.url))
  // 旧 URL 缓存可能属于别的平台；来源不明或签名链接已过期时重新取流，不能谎报为原条目。
  // 国内曲目换源不污染原条目缓存键（保持原版下次优先重试）；YTM 曲目在允许换源且桥接目标国内源仍可服务时命中别名缓存。
  const isYtmAliasCacheHit = Boolean(
    musicInfo.source === 'ytm' &&
    allowToggleSource &&
    isCacheValid &&
    cached?.musicInfo &&
    cached.musicInfo.id !== musicInfo.id &&
    isDomesticSourceServable(cached.musicInfo.source),
  )
  if (isCacheValid && cached?.musicInfo && (cached.musicInfo.id === musicInfo.id || isYtmAliasCacheHit)) {
    onResolvedMusicInfo?.(cached.musicInfo)
    return cached.url
  }

  return handleGetOnlineMusicUrl({ musicInfo, quality, onToggleSource, onToggleApiSource, isRefresh, allowToggleSource, alternativeMusicInfos, preferMp4 }).then(async({ url, quality: resolvedQuality, musicInfo: targetMusicInfo, isFromCache }) => {
    const saves: Array<Promise<unknown>> = []
    if (!preferMp4 || targetMusicInfo.source !== 'ytm') {
      if (!isFromCache) {
        saves.push(saveMusicUrl(targetMusicInfo, resolvedQuality, url, targetMusicInfo))
      }
      // YTM 曲目若直连失败并桥接到国内源，按外层 requestedQuality 补写别名缓存供重播直出
      if (musicInfo.source === 'ytm' && targetMusicInfo.id !== musicInfo.id) {
        saves.push(saveMusicUrl(musicInfo, requestedQuality, url, targetMusicInfo))
      }
    }
    // 预加载完成后正式播放即可读取完整结果；写缓存失败仍允许播放有效地址。
    if (saves.length) {
      await Promise.all(saves).catch(err => { console.warn('[music] 缓存取流结果失败', err) })
    }
    onResolvedMusicInfo?.(targetMusicInfo)
    return url
  })
}

/** Shared online-version policy; download callers invoke it only after checking the saved file. */
export const getVersionMusicUrl = async(options: Omit<Parameters<typeof getMusicUrl>[0], 'musicInfo'> & { musicInfo: LX.Music.MusicInfo }): Promise<string> => {
  const preferred = getPreferredMusicInfo(options.musicInfo)
  if (preferred.source === 'local') throw new Error('online version unavailable')
  if (preferred === options.musicInfo) return getMusicUrl({ ...options, musicInfo: preferred })
  try {
    return await getMusicUrl({ ...options, musicInfo: preferred, allowToggleSource: false })
  } catch (error) {
    if (options.allowToggleSource === false || (error instanceof Error && error.message === requestMsg.cancelRequest)) throw error
    options.onToggleSource?.()
    return getMusicUrl({ ...options, musicInfo: preferred, allowToggleSource: true })
  }
}

export const getPicUrl = async({ musicInfo, isRefresh, allowToggleSource = true, skipPrimary = false, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoOnline
  listId?: string | null
  isRefresh: boolean
  allowToggleSource?: boolean
  skipPrimary?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if (musicInfo.meta.picUrl && !isRefresh && !skipPrimary) return musicInfo.meta.picUrl
  return handleGetOnlinePicUrl({ musicInfo, onToggleSource, isRefresh, allowToggleSource, skipPrimary }).then(({ url, musicInfo: targetMusicInfo, isFromCache }) => {
    // Automatic artwork belongs to this playback request, not a full saved-list metadata update.
    // A late result must never overwrite a newer manual version or another saved entry.
    return url
  })
}
export const getLyricInfo = async({ musicInfo, isRefresh, allowToggleSource = true, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoOnline
  isRefresh: boolean
  allowToggleSource?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<LX.Player.LyricInfo> => {
  if (!isRefresh) {
    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo) return buildLyricInfo(lyricInfo)
  }

  // lrcRequest = music[musicInfo.source].getLyric(musicInfo)
  return handleGetOnlineLyricInfo({ musicInfo, onToggleSource, isRefresh, allowToggleSource }).then(async({ lyricInfo, musicInfo: targetMusicInfo, isFromCache, isUntimedFallback }) => {
    // lrcRequest = null
    // 纯文本无时间轴兜底歌词不落盘持久缓存，避免污染后续同步歌词/翻译回落
    const saves: Array<Promise<unknown>> = []
    if (!isUntimedFallback) {
      if (!isFromCache) {
        saves.push(saveLyric(targetMusicInfo.id == musicInfo.id ? musicInfo : targetMusicInfo, lyricInfo))
      }
      // YTM 跨源歌词无论目标国内源是否已缓存，均同步写入 YTM 别名缓存供重播直出
      if (musicInfo.source === 'ytm' && targetMusicInfo.id !== musicInfo.id) {
        saves.push(saveLyric(musicInfo, lyricInfo))
      }
    }
    if (saves.length) {
      await Promise.all(saves).catch(err => { console.warn('[music] 缓存歌词结果失败', err) })
    }

    return buildLyricInfo(lyricInfo)
  })
}
