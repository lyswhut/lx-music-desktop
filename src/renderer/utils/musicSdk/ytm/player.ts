/**
 * YouTube Music 原生音频流与封面解析引擎（InnerTube /youtubei/v1/player）：
 * 使 YouTube Music 成为与 QQ音乐、网易云音乐完全平权的一等音源——
 * 主路径使用 ANDROID 客户端豁免 PO Token 的渐进式 MP4 音频流（itag 18，AAC-LC，支持开放 Range 206 与全曲下载），
 * 缺失时回退 IOS 自适应音频并强制做开放 Range（bytes=0-）响应头探测，杜绝把 403 坏链交给播放器。
 */

import { YTM_REQUEST_TIMEOUT_MS } from '@common/recommendationConfig'
import { request as rawNodeRequest } from '@common/utils/download/request'
import { getRequestAgent } from '@common/utils/download/util'
import type { YtmProxyAddress } from '@renderer/core/recommend/ytmProxy'
import {
  markYtmContextReachable,
  postInnerTubeWithClient,
  resolveLiveYtmProxy,
  YTM_ANDROID_CLIENT,
  YTM_ANDROID_FALLBACK_CLIENT,
  YTM_ANDROID_FALLBACK_HEADERS,
  YTM_ANDROID_HEADERS,
  YTM_HEADERS,
  YTM_IOS_CLIENT,
  YTM_IOS_HEADERS,
  type YtmHttpProxyOption,
} from './client'
import { isYtmRegionBlockedError } from './parser'
export { BUILTIN_YTM_QUALITIES, isYtmStreamUrlExpired } from './streamUtils'

export interface YtmAudioFormat {
  url: string
  itag: number
  mimeType: string
  bitrate: number
  contentLength: number | null
  /** true 表示来自 streamingData.formats 的渐进式音视频容器（如 itag 18，豁免 GVS PO Token 403）。 */
  isProgressive?: boolean
}

export interface YtmResolvedAudioStream {
  url: string
  type: LX.Quality
  mimeType: string
  bitrate: number
  itag: number
  ext: 'm4a' | 'webm'
}

export interface YtmStreamProbeResult {
  ok: boolean
  statusCode?: number
  reason?: string
}

export type YtmStreamProbeFn = (
  url: string,
  proxyOption: YtmHttpProxyOption,
  timeoutMs: number,
) => { promise: Promise<YtmStreamProbeResult>, cancel: () => void }

export interface YtmMusicUrlOptions {
  /** 下载 .m4a 时强制优先 MP4 (AAC) 容器，确保 macOS/Windows/本地播放器通用可播。 */
  preferMp4?: boolean
  /** 刷新重试或下载前显式校验开放 Range（bytes=0-）返回 200/206，拦截 403 坏链并触发跨源救回。 */
  verifyOpenRange?: boolean
  timeoutMs?: number
  /** 测试注入用探针（默认走真实 HTTP `Range: bytes=0-` 响应头检测）。 */
  probeStreamUrl?: YtmStreamProbeFn
}

const VALID_VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,32}$/
const MAX_PROBE_REDIRECTS = 2
const PROGRESSIVE_AUDIO_ITAGS = new Set([18, 22])

const isProgressivePlayableMp4 = (item: Record<string, any>, mimeType: string, itag: number): boolean => {
  const lower = mimeType.toLowerCase()
  if (!lower.startsWith('video/mp4')) return false
  if (PROGRESSIVE_AUDIO_ITAGS.has(itag)) return true
  if (lower.includes('mp4a')) return true
  return Number(item.audioChannels) > 0
}

/** 从 InnerTube player 响应提取全部未加密直链音频流（兼容渐进式 MP4 formats 与纯音频 adaptiveFormats）。 */
export const extractYtmAudioFormats = (body: Record<string, any>): YtmAudioFormat[] => {
  const streamingData = body?.streamingData
  if (!streamingData || typeof streamingData !== 'object') return []
  const seen = new Set<string>()
  const formats: YtmAudioFormat[] = []

  const pushItems = (rawList: unknown, fromProgressiveFormats: boolean) => {
    if (!Array.isArray(rawList)) return
    for (const item of rawList) {
      if (!item || typeof item !== 'object') continue
      const url = typeof item.url === 'string' ? item.url.trim() : ''
      const mimeType = typeof item.mimeType === 'string' ? item.mimeType : ''
      if (!url || !/^https?:\/\//i.test(url)) continue
      const itag = Number(item.itag) || 0
      const lowerMime = mimeType.toLowerCase()
      const isAudioOnly = lowerMime.startsWith('audio/')
      const isProgressiveMp4 = fromProgressiveFormats && isProgressivePlayableMp4(item, mimeType, itag)
      if (!isAudioOnly && !isProgressiveMp4) continue
      if (seen.has(url)) continue
      seen.add(url)
      const bitrate = Number(item.averageBitrate || item.bitrate) || 0
      const lenNum = Number(item.contentLength)
      formats.push({
        url,
        itag,
        mimeType,
        bitrate,
        contentLength: Number.isFinite(lenNum) && lenNum > 0 ? lenNum : null,
        isProgressive: isProgressiveMp4,
      })
    }
  }

  pushItems(streamingData.formats, true)
  pushItems(streamingData.adaptiveFormats, false)
  return formats
}

const isMp4Audio = (f: YtmAudioFormat): boolean => {
  const lower = f.mimeType.toLowerCase()
  return lower.startsWith('audio/mp4') || (Boolean(f.isProgressive) && lower.startsWith('video/mp4'))
}

/**
 * 按目标音质与容器偏好从音频流中择优：
 * - `preferProgressive`: 锁定渐进式 MP4（优先 itag 18，文件小、无 PO Token 403、首帧快且兼容 .m4a）；
 * - `preferMp4`: 锁定 MP4/AAC 容器（绝不把 webm/opus 字节误存为 .m4a）；
 * - 普通自适应档位：128k 优先 itag 140 AAC；高品优先 Opus 774/251 或 AAC 141。
 */
export const selectYtmAudioStream = (
  formats: YtmAudioFormat[],
  requestedQuality: LX.Quality = '128k',
  options?: { preferMp4?: boolean, preferProgressive?: boolean },
): YtmResolvedAudioStream | null => {
  if (!formats.length) return null
  const progressiveMp4 = formats.filter(f => Boolean(f.isProgressive) && isMp4Audio(f))
  const byBitrateDesc = [...formats].sort((a, b) => b.bitrate - a.bitrate)
  const adaptiveOnlyDesc = byBitrateDesc.filter(f => !f.isProgressive)
  const adaptiveMp4Desc = adaptiveOnlyDesc.filter(isMp4Audio)
  const allMp4Desc = byBitrateDesc.filter(isMp4Audio)

  let chosen: YtmAudioFormat | undefined
  if (options?.preferProgressive) {
    // 渐进式优先 itag 18（专辑封面曲通常 3-5MB，远小于 720p itag 22 且稳定支持开放 Range 206）
    chosen = progressiveMp4.find(f => f.itag === 18) ??
      progressiveMp4.find(f => f.itag === 22) ??
      progressiveMp4[0]
  } else if (options?.preferMp4) {
    // 下载 .m4a：严格锁定 MP4/AAC 容器，绝不把 webm/opus 字节误存为 .m4a
    chosen = adaptiveMp4Desc.find(f => f.itag === 141) ??
      adaptiveMp4Desc.find(f => f.itag === 140) ??
      progressiveMp4.find(f => f.itag === 18) ??
      allMp4Desc[0]
  } else if (requestedQuality === '128k') {
    chosen = adaptiveMp4Desc.find(f => f.itag === 140) ??
      adaptiveMp4Desc[0] ??
      progressiveMp4.find(f => f.itag === 18) ??
      adaptiveOnlyDesc.find(f => f.itag === 251) ??
      byBitrateDesc[0]
  } else {
    chosen = adaptiveOnlyDesc.find(f => f.itag === 774) ??
      adaptiveOnlyDesc.find(f => f.itag === 141) ??
      adaptiveOnlyDesc.find(f => f.itag === 251) ??
      adaptiveOnlyDesc[0] ??
      progressiveMp4.find(f => f.itag === 18) ??
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

/**
 * 发起真实开放范围请求（`Range: bytes=0-`），收到响应头后立刻销毁连接：
 * 只有状态码 200/206、非空正文且非 `text/*` 错误页才判定可播放，能准确识别 GVS PO Token 403（避免 `0-1023` 假阳性）。
 * 整条重定向链共享单一总超时定时器，且在完成、失败、关闭与取消时立即清理，零 timer 泄漏。
 */
export const probeYtmOpenRangeStream: YtmStreamProbeFn = (url, proxyOption, timeoutMs) => {
  let cancelled = false
  let finished = false
  let activeReq: ReturnType<typeof rawNodeRequest> | null = null
  let resolveOuter: ((res: YtmStreamProbeResult) => void) | null = null
  let rejectOuter: ((err: Error) => void) | null = null
  const proxyAddr: YtmProxyAddress | undefined = proxyOption && typeof proxyOption === 'object' ? proxyOption : undefined
  const numericTimeout = Number.isFinite(timeoutMs) ? timeoutMs : 8000
  const safeTimeout = Math.max(100, Math.min(numericTimeout, 8000))
  let deadlineTimer: NodeJS.Timeout | null = null

  const clearDeadline = () => {
    if (deadlineTimer) {
      clearTimeout(deadlineTimer)
      deadlineTimer = null
    }
  }
  const settleResolve = (res: YtmStreamProbeResult) => {
    if (finished) return
    finished = true
    clearDeadline()
    activeReq = null
    resolveOuter?.(res)
  }
  const settleReject = (err: Error) => {
    if (finished) return
    finished = true
    clearDeadline()
    activeReq = null
    rejectOuter?.(err)
  }

  const startHop = (rawTargetUrl: string, redirectsLeft: number) => {
    if (finished || cancelled) return
    let targetUrl: string
    try {
      const parsed = new URL(rawTargetUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        settleResolve({ ok: false, reason: 'non-http url' })
        return
      }
      targetUrl = parsed.toString()
    } catch {
      settleResolve({ ok: false, reason: 'invalid url' })
      return
    }

    let req: ReturnType<typeof rawNodeRequest>
    try {
      // 不传 rawNodeRequest 的 timeout（其 applyTimeout 仅在 response 时清理，取消/早失败会泄漏 timer 且每跳叠加），
      // 统一由外层 deadlineTimer 管控整条重定向链。
      req = rawNodeRequest(targetUrl, {
        method: 'get',
        agent: getRequestAgent(targetUrl, proxyAddr),
        headers: {
          Range: 'bytes=0-',
          'User-Agent': YTM_HEADERS['User-Agent'],
          Accept: '*/*',
        },
      })
    } catch (err: any) {
      settleResolve({ ok: false, reason: err instanceof Error ? err.message : String(err) })
      return
    }
    activeReq = req
    let responded = false
    req.on('response', (res) => {
      responded = true
      const statusCode = res.statusCode ?? 0
      const location = typeof res.headers.location === 'string' ? res.headers.location : ''
      const contentLength = String(res.headers['content-length'] ?? '').trim()
      const contentType = String(res.headers['content-type'] ?? '').trim().toLowerCase()
      res.on('error', () => {})
      res.destroy()
      req.destroy()
      if (finished || cancelled) return
      if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
        if (redirectsLeft <= 0) {
          settleResolve({ ok: false, statusCode, reason: 'too many redirects' })
          return
        }
        let nextUrl: string
        try {
          nextUrl = new URL(location, targetUrl).toString()
        } catch {
          settleResolve({ ok: false, statusCode, reason: 'invalid redirect url' })
          return
        }
        startHop(nextUrl, redirectsLeft - 1)
        return
      }
      if (statusCode === 200 || statusCode === 206) {
        if (contentLength === '0') {
          settleResolve({ ok: false, statusCode, reason: `empty response (HTTP ${statusCode})` })
          return
        }
        if (contentType.startsWith('text/')) {
          settleResolve({ ok: false, statusCode, reason: `unexpected content-type (${contentType})` })
          return
        }
        settleResolve({ ok: true, statusCode })
        return
      }
      settleResolve({ ok: false, statusCode, reason: `HTTP ${statusCode || 'unknown'}` })
    })
    req.on('error', (err) => {
      if (responded || finished) return
      if (cancelled) {
        settleReject(new Error('request cancelled'))
        return
      }
      settleResolve({ ok: false, reason: err?.message || 'probe error' })
    })
    req.on('close', () => {
      if (responded || finished) return
      if (cancelled) {
        settleReject(new Error('request cancelled'))
        return
      }
      settleResolve({ ok: false, reason: 'connection closed' })
    })
    req.end()
  }

  const promise = new Promise<YtmStreamProbeResult>((resolve, reject) => {
    resolveOuter = resolve
    rejectOuter = reject
    deadlineTimer = setTimeout(() => {
      const req = activeReq
      settleResolve({ ok: false, reason: 'probe timeout' })
      try { req?.destroy() } catch {}
    }, safeTimeout)
    startHop(url, MAX_PROBE_REDIRECTS)
  })

  return {
    promise,
    cancel: () => {
      cancelled = true
      const req = activeReq
      settleReject(new Error('request cancelled'))
      try { req?.destroy() } catch {}
    },
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
    name: 'ANDROID',
    client: YTM_ANDROID_CLIENT,
    headers: YTM_ANDROID_HEADERS,
    contextExtra: undefined as Record<string, unknown> | undefined,
    preferProgressive: true,
    requireOpenRangeProbe: false,
  },
  {
    name: 'ANDROID_FALLBACK',
    client: YTM_ANDROID_FALLBACK_CLIENT,
    headers: YTM_ANDROID_FALLBACK_HEADERS,
    contextExtra: undefined as Record<string, unknown> | undefined,
    preferProgressive: true,
    requireOpenRangeProbe: false,
  },
  {
    name: 'IOS_VERIFIED',
    client: YTM_IOS_CLIENT,
    headers: YTM_IOS_HEADERS,
    contextExtra: undefined as Record<string, unknown> | undefined,
    preferProgressive: false,
    requireOpenRangeProbe: true,
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
  const probeFn = options?.probeStreamUrl ?? probeYtmOpenRangeStream
  let cancelled = false
  let activeCancel: (() => void) | null = null

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
        const cancelReq = () => { req.cancel?.() }
        activeCancel = cancelReq
        let body: Record<string, any>
        try {
          body = await req
        } finally {
          if (activeCancel === cancelReq) activeCancel = null
        }
        if (cancelled) throw new Error('request cancelled')

        const playStatus = body?.playabilityStatus?.status
        const formats = extractYtmAudioFormats(body)
        if (playStatus === 'OK' && formats.length) {
          const selected = selectYtmAudioStream(formats, type, {
            preferMp4: options?.preferMp4,
            preferProgressive: profile.preferProgressive,
          })
          if (selected) {
            if (profile.requireOpenRangeProbe || options?.verifyOpenRange) {
              const probe = probeFn(selected.url, ctx.lockedProxy, timeoutMs)
              activeCancel = probe.cancel
              let probeRes: YtmStreamProbeResult
              try {
                probeRes = await probe.promise
              } finally {
                if (activeCancel === probe.cancel) activeCancel = null
              }
              if (cancelled) throw new Error('request cancelled')
              if (!probeRes.ok) {
                lastError = new Error(`YouTube Music stream rejected (${profile.name}): ${probeRes.reason ?? `HTTP ${probeRes.statusCode ?? 'unknown'}`}`)
                continue
              }
            }
            markYtmContextReachable(ctx.contextKey)
            return {
              type: selected.type,
              url: selected.url,
              ext: selected.ext,
            }
          }
        }
        const reason = body?.playabilityStatus?.reason ||
          (playStatus === 'OK'
            ? (profile.preferProgressive
                ? 'no progressive mp4 stream'
                : options?.preferMp4 ? 'no audio/mp4 stream' : 'no playable audio stream')
            : playStatus) ||
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
      activeCancel?.()
    },
  }
}

/** 原生获取 YouTube Music 曲目高清封面（优先 InnerTube videoDetails 缩略图，按客户端序回退）。 */
export const getYtmTrackPic = async(songInfo: any): Promise<string> => {
  const videoId = extractVideoId(songInfo)
  if (!videoId || !VALID_VIDEO_ID_RE.test(videoId)) {
    throw new Error('invalid YouTube Music videoId')
  }
  const ctx = resolveLiveYtmProxy()
  let lastError: Error | null = null
  for (const profile of PLAYER_PROFILES) {
    try {
      const body = await postInnerTubeWithClient(
        'player',
        { videoId, contentCheckOk: true, racyCheckOk: true },
        {
          client: profile.client,
          headers: profile.headers,
          contextExtra: profile.contextExtra,
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
      lastError = new Error(`YouTube Music cover not found (${profile.name})`)
    } catch (err: any) {
      if (isYtmRegionBlockedError(err)) throw err
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }
  throw lastError ?? new Error('YouTube Music cover not found')
}
