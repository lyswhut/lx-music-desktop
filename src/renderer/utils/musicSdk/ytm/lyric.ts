/**
 * YouTube Music 原生歌词抓取与解析（InnerTube /next → MPLYt_* → /browse）：
 * - 优先通过 ANDROID_MUSIC 客户端解析带 cueRange.startTimeMilliseconds 的同步时间轴歌词（标准 [mm:ss.xx] LRC）；
 * - 若该曲仅提供无时间轴纯文本歌词，同步返回 untimedLyric 供上层在无国内同步歌词时兜底展示，确保 YouTube 独有曲目也能显示歌词。
 */

import { YTM_REQUEST_TIMEOUT_MS } from '@common/recommendationConfig'
import {
  markYtmContextReachable,
  postInnerTube,
  postInnerTubeWithClient,
  resolveLiveYtmProxy,
  YTM_ANDROID_MUSIC_CLIENT,
  YTM_ANDROID_MUSIC_HEADERS,
} from './client'
import type { YtmCancellablePromise } from './paginationCache'
import { isYtmRegionBlockedError } from './parser'

export interface YtmLyricResult extends LX.Music.LyricInfo {
  /** 当 YTM 仅提供纯文本无时间戳歌词时的兜底 LRC（[00:00.00] 行格式）。 */
  untimedLyric?: string
}

const VALID_VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,32}$/

export const formatLrcTimestamp = (ms: number): string => {
  const safeMs = Math.max(0, Math.floor(ms))
  const totalSeconds = Math.floor(safeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const hundredths = Math.floor((safeMs % 1000) / 10)
  return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}]`
}

const formatPlainLinesAsLrc = (lines: string[]): string => {
  const cleaned = lines.map(line => line.trim()).filter(Boolean)
  if (!cleaned.length) return ''
  return cleaned.map(line => `[00:00.00]${line}`).join('\n')
}

/** 从 /next 响应的 tabs 中定位歌词页 browseId（MPLYt_*）。 */
export const extractYtmLyricsBrowseId = (body: unknown): string | null => {
  if (!body || typeof body !== 'object') return null
  let found: string | null = null
  const walk = (node: unknown) => {
    if (found != null || !node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    const browseId = obj.browseEndpoint?.browseId
    if (typeof browseId === 'string' && browseId.startsWith('MPLYt_')) {
      found = browseId.trim()
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }
  walk(body)
  return found
}

/** 解析 ANDROID_MUSIC timedLyricsModel 与 WEB_REMIX musicDescriptionShelfRenderer 歌词载荷。 */
export const parseYtmLyricsBrowse = (body: unknown): { lyric: string, untimedLyric: string } => {
  if (!body || typeof body !== 'object') return { lyric: '', untimedLyric: '' }
  let timedEntries: any[] | null = null
  let plainDesc = ''

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (!timedEntries && Array.isArray(obj.timedLyricsData) && obj.timedLyricsData.length) {
      timedEntries = obj.timedLyricsData
    }
    if (!plainDesc && obj.musicDescriptionShelfRenderer && typeof obj.musicDescriptionShelfRenderer === 'object') {
      const runs = obj.musicDescriptionShelfRenderer.description?.runs
      if (Array.isArray(runs)) {
        const text = runs.map((r: any) => String(r?.text ?? '')).join('').trim()
        if (text) plainDesc = text
      }
    }
    for (const val of Object.values(obj)) walk(val)
  }
  walk(body)

  if (timedEntries && (timedEntries as any[]).length) {
    const entries = timedEntries as any[]
    const syncedLines: string[] = []
    const plainLines: string[] = []
    let hasTiming = false
    for (const entry of entries) {
      const text = typeof entry?.lyricLine === 'string' ? entry.lyricLine.trim() : ''
      if (!text) continue
      plainLines.push(text)
      const startMsRaw = entry?.cueRange?.startTimeMilliseconds
      const startMs = startMsRaw != null ? Number(startMsRaw) : NaN
      if (Number.isFinite(startMs) && startMs >= 0) {
        hasTiming = true
        syncedLines.push(`${formatLrcTimestamp(startMs)}${text}`)
      }
    }
    if (hasTiming && syncedLines.length) {
      return { lyric: syncedLines.join('\n'), untimedLyric: '' }
    }
    if (plainLines.length) {
      return { lyric: '', untimedLyric: formatPlainLinesAsLrc(plainLines) }
    }
  }

  if (plainDesc) {
    const lines = plainDesc.split(/\r?\n/)
    return { lyric: '', untimedLyric: formatPlainLinesAsLrc(lines) }
  }

  return { lyric: '', untimedLyric: '' }
}

/** 获取 YouTube Music 曲目原生歌词（兼容 musicSdk[source].getLyric 契约）。 */
export const getYtmLyric = (songInfo: any): { promise: Promise<YtmLyricResult>, cancelHttp: () => void } => {
  const videoId = String(songInfo?.songmid ?? songInfo?.meta?.songId ?? '').trim()
  if (!videoId || !VALID_VIDEO_ID_RE.test(videoId)) {
    return {
      promise: Promise.reject(new Error('invalid YouTube Music videoId')),
      cancelHttp: () => {},
    }
  }
  const ctx = resolveLiveYtmProxy()
  let cancelled = false
  let activeReq: YtmCancellablePromise<Record<string, any>> | null = null

  const promise = (async(): Promise<YtmLyricResult> => {
    const nextReq = postInnerTube('next', { videoId, isAudioOnly: true }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
    activeReq = nextReq
    const nextBody = await nextReq
    if (activeReq === nextReq) activeReq = null
    if (cancelled) throw new Error('request cancelled')

    const browseId = extractYtmLyricsBrowseId(nextBody)
    if (!browseId) {
      throw new Error('YouTube Music lyric not available')
    }

    // 优先 ANDROID_MUSIC（返回 timedLyricsData 含 cueRange 时间轴）
    try {
      const mobReq = postInnerTubeWithClient(
        'browse',
        { browseId },
        {
          client: YTM_ANDROID_MUSIC_CLIENT,
          headers: YTM_ANDROID_MUSIC_HEADERS,
          proxyOption: ctx.lockedProxy,
          timeoutMs: YTM_REQUEST_TIMEOUT_MS,
          contextKey: ctx.contextKey,
        },
      )
      activeReq = mobReq
      const mobBody = await mobReq
      if (activeReq === mobReq) activeReq = null
      if (cancelled) throw new Error('request cancelled')

      const parsed = parseYtmLyricsBrowse(mobBody)
      if (parsed.lyric || parsed.untimedLyric) {
        markYtmContextReachable(ctx.contextKey)
        return {
          lyric: parsed.lyric,
          tlyric: '',
          rlyric: '',
          lxlyric: '',
          ...(parsed.untimedLyric ? { untimedLyric: parsed.untimedLyric } : {}),
        }
      }
    } catch (err) {
      if (cancelled || (err instanceof Error && /cancel/i.test(err.message))) throw err
      if (isYtmRegionBlockedError(err)) throw err
    }

    // 回退 WEB_REMIX 歌词页
    const webReq = postInnerTube('browse', { browseId }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
    activeReq = webReq
    const webBody = await webReq
    if (activeReq === webReq) activeReq = null
    if (cancelled) throw new Error('request cancelled')

    const parsedWeb = parseYtmLyricsBrowse(webBody)
    if (parsedWeb.lyric || parsedWeb.untimedLyric) {
      markYtmContextReachable(ctx.contextKey)
      return {
        lyric: parsedWeb.lyric,
        tlyric: '',
        rlyric: '',
        lxlyric: '',
        ...(parsedWeb.untimedLyric ? { untimedLyric: parsedWeb.untimedLyric } : {}),
      }
    }

    throw new Error('YouTube Music lyric empty')
  })()

  return {
    promise,
    cancelHttp: () => {
      cancelled = true
      activeReq?.cancel?.()
    },
  }
}
