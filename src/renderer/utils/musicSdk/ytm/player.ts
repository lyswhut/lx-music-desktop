/**
 * YouTube Music 原生音频流与封面解析引擎（InnerTube /youtubei/v1/player）：
 * 使 YouTube Music 成为与 QQ音乐、网易云音乐完全平权的一等音源——
 * 无需第三方脚本即可直接播放与下载（IOS 客户端直出未加密音频流，TV 嵌入式客户端兜底）。
 */

import { YTM_REQUEST_TIMEOUT_MS } from '@common/recommendationConfig'
import {
  markYtmContextReachable,
  postInnerTubeWithClient,
  resolveLiveYtmProxy,
  YTM_IOS_CLIENT,
  YTM_IOS_HEADERS,
  YTM_TV_EMBED_CLIENT,
  YTM_TV_EMBED_HEADERS,
} from './client'
import type { YtmCancellablePromise } from './paginationCache'
import { isYtmRegionBlockedError } from './parser'
export { BUILTIN_YTM_QUALITIES, isYtmStreamUrlExpired } from './streamUtils'

export interface YtmAudioFormat {
  url: string
  itag: number
  mimeType: string
  bitrate: number
  contentLength: number | null
}

export interface YtmResolvedAudioStream {
  url: string
  type: LX.Quality
  mimeType: string
  bitrate: number
  itag: number
  ext: 'm4a' | 'webm'
}

export interface YtmMusicUrlOptions {
  /** 下载 .m4a 时强制优先 audio/mp4 (AAC) 容器，确保 macOS/Windows/本地播放器通用可播。 */
  preferMp4?: boolean
  timeoutMs?: number
}

const VALID_VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,32}$/

/** 从 InnerTube player 响应提取全部未加密直链音频流。 */
export const extractYtmAudioFormats = (body: Record<string, any>): YtmAudioFormat[] => {
  const streamingData = body?.streamingData
  if (!streamingData || typeof streamingData !== 'object') return []
  const rawList: any[] = [
    ...(Array.isArray(streamingData.adaptiveFormats) ? streamingData.adaptiveFormats : []),
    ...(Array.isArray(streamingData.formats) ? streamingData.formats : []),
  ]
  const seen = new Set<string>()
  const formats: YtmAudioFormat[] = []
  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue
    const url = typeof item.url === 'string' ? item.url.trim() : ''
    const mimeType = typeof item.mimeType === 'string' ? item.mimeType : ''
    if (!url || !/^https?:\/\//i.test(url)) continue
    if (!mimeType.toLowerCase().startsWith('audio/')) continue
    if (seen.has(url)) continue
    seen.add(url)
    const itag = Number(item.itag) || 0
    const bitrate = Number(item.averageBitrate || item.bitrate) || 0
    const lenNum = Number(item.contentLength)
    formats.push({
      url,
      itag,
      mimeType,
      bitrate,
      contentLength: Number.isFinite(lenNum) && lenNum > 0 ? lenNum : null,
    })
  }
  return formats
}

const isMp4Audio = (f: YtmAudioFormat): boolean => f.mimeType.toLowerCase().startsWith('audio/mp4')

/** 按目标音质与容器偏好从音频流中择优（128k 优先 itag 140 AAC；320k/高品优先最高码率 Opus/AAC；preferMp4 锁定 audio/mp4）。 */
export const selectYtmAudioStream = (
  formats: YtmAudioFormat[],
  requestedQuality: LX.Quality = '128k',
  options?: { preferMp4?: boolean },
): YtmResolvedAudioStream | null => {
  if (!formats.length) return null
  const byBitrateDesc = [...formats].sort((a, b) => b.bitrate - a.bitrate)
  const mp4Desc = byBitrateDesc.filter(isMp4Audio)

  let chosen: YtmAudioFormat | undefined
  if (options?.preferMp4) {
    // 下载 .m4a：严格锁定 audio/mp4 (AAC) 容器，绝不把 webm/opus 字节误存为 .m4a
    chosen = mp4Desc.find(f => f.itag === 141) ??
      mp4Desc.find(f => f.itag === 140) ??
      mp4Desc[0]
  } else if (requestedQuality === '128k') {
    // 标准档位：优先 AAC-LC 128k (itag 140)，次选 audio/mp4，再次选 Opus 128k+
    chosen = mp4Desc.find(f => f.itag === 140) ??
      mp4Desc[0] ??
      byBitrateDesc.find(f => f.itag === 251) ??
      byBitrateDesc[0]
  } else {
    // 高品档位（320k / flac / flac24bit 自动降档至此）：优先最高码率音频（Opus 251/774 或 AAC 141/140）
    chosen = byBitrateDesc.find(f => f.itag === 774) ??
      byBitrateDesc.find(f => f.itag === 141) ??
      byBitrateDesc.find(f => f.itag === 251) ??
      byBitrateDesc[0]
  }
  if (!chosen) return null
  const ext: 'm4a' | 'webm' = isMp4Audio(chosen) ? 'm4a' : 'webm'
  const resolvedType: LX.Quality = requestedQuality === '128k' ? '128k' : '320k'
  return {
    url: chosen.url,
    type: resolvedType,
    mimeType: chosen.mimeType,
    bitrate: chosen.bitrate,
    itag: chosen.itag,
    ext,
  }
}

const bestPlayerThumbnail = (body: Record<string, any>): string | null => {
  const thumbs = body?.videoDetails?.thumbnail?.thumbnails
  if (!Array.isArray(thumbs) || !thumbs.length) return null
  let best = thumbs[thumbs.length - 1]
  for (const item of thumbs) {
    if ((Number(item?.width) || 0) >= (Number(best?.width) || 0)) best = item
  }
  return typeof best?.url === 'string' && best.url.trim() ? best.url.trim() : null
}

const PLAYER_PROFILES = [
  {
    name: 'IOS',
    client: YTM_IOS_CLIENT,
    headers: YTM_IOS_HEADERS,
    contextExtra: undefined as Record<string, unknown> | undefined,
  },
  {
    name: 'TV_EMBED',
    client: YTM_TV_EMBED_CLIENT,
    headers: YTM_TV_EMBED_HEADERS,
    contextExtra: { thirdParty: { embedUrl: 'https://www.youtube.com/' } },
  },
] as const

const extractVideoId = (songInfo: any): string => {
  const raw = songInfo?.songmid ?? songInfo?.meta?.songId ?? ''
  return String(raw).trim()
}

/**
 * 原生解析 YouTube Music 音频直链（兼容 musicSdk[source].getMusicUrl 返回 `{ promise, cancelHttp }` 契约）。
 */
export const getYtmMusicUrl = (
  songInfo: any,
  type: LX.Quality = '128k',
  options?: YtmMusicUrlOptions,
): { promise: Promise<{ type: LX.Quality, url: string, ext?: 'm4a' | 'webm' }>, cancelHttp: () => void } => {
  const videoId = extractVideoId(songInfo)
  if (!videoId || !VALID_VIDEO_ID_RE.test(videoId)) {
    return {
      promise: Promise.reject(new Error('invalid YouTube Music videoId')),
      cancelHttp: () => {},
    }
  }
  const ctx = resolveLiveYtmProxy()
  const timeoutMs = options?.timeoutMs ?? Math.max(YTM_REQUEST_TIMEOUT_MS, 10_000)
  let cancelled = false
  let activeReq: YtmCancellablePromise<Record<string, any>> | null = null

  const promise = (async() => {
    let lastError: Error | null = null
    for (const profile of PLAYER_PROFILES) {
      if (cancelled) throw new Error('request cancelled')
      try {
        const req = postInnerTubeWithClient(
          'player',
          {
            videoId,
            contentCheckOk: true,
            racyCheckOk: true,
          },
          {
            client: profile.client,
            headers: profile.headers,
            contextExtra: profile.contextExtra,
            proxyOption: ctx.lockedProxy,
            timeoutMs,
            contextKey: ctx.contextKey,
          },
        )
        activeReq = req
        const body = await req
        if (activeReq === req) activeReq = null
        if (cancelled) throw new Error('request cancelled')

        const playStatus = body?.playabilityStatus?.status
        const formats = extractYtmAudioFormats(body)
        if (playStatus === 'OK' && formats.length) {
          const selected = selectYtmAudioStream(formats, type, { preferMp4: options?.preferMp4 })
          if (selected) {
            markYtmContextReachable(ctx.contextKey)
            return {
              type: selected.type,
              url: selected.url,
              ext: selected.ext,
            }
          }
        }
        const reason = body?.playabilityStatus?.reason ||
          (playStatus === 'OK' ? (options?.preferMp4 ? 'no audio/mp4 stream' : 'no playable audio stream') : playStatus) ||
          'no playable audio stream'
        lastError = new Error(`YouTube Music unavailable (${profile.name}): ${String(reason)}`)
      } catch (err: any) {
        if (cancelled || (err instanceof Error && /cancel/i.test(err.message))) throw err
        if (isYtmRegionBlockedError(err)) throw err
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }
    throw lastError ?? new Error('YouTube Music audio stream unavailable')
  })()

  return {
    promise,
    cancelHttp: () => {
      cancelled = true
      activeReq?.cancel?.()
    },
  }
}

/** 原生获取 YouTube Music 曲目高清封面（优先 InnerTube videoDetails 缩略图）。 */
export const getYtmTrackPic = async(songInfo: any): Promise<string> => {
  const videoId = extractVideoId(songInfo)
  if (!videoId || !VALID_VIDEO_ID_RE.test(videoId)) {
    throw new Error('invalid YouTube Music videoId')
  }
  const ctx = resolveLiveYtmProxy()
  const body = await postInnerTubeWithClient(
    'player',
    { videoId, contentCheckOk: true, racyCheckOk: true },
    {
      client: YTM_IOS_CLIENT,
      headers: YTM_IOS_HEADERS,
      proxyOption: ctx.lockedProxy,
      timeoutMs: YTM_REQUEST_TIMEOUT_MS,
      contextKey: ctx.contextKey,
    },
  )
  const thumb = bestPlayerThumbnail(body)
  if (thumb) {
    markYtmContextReachable(ctx.contextKey)
    return thumb
  }
  throw new Error('YouTube Music cover not found')
}
