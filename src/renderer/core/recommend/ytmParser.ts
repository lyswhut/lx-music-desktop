/**
 * YouTube Music InnerTube 纯解析模块（零网络/Electron 运行时依赖，vitest 直测）。
 *
 * L1 类型边界：本模块只产出 `YtmRawTrack`（纯元数据，无 LX.Music.MusicInfo 字段），
 * 无法绕过桥接层直接写入播放器队列或收藏列表。
 */

import { simplify } from '@renderer/utils/simplify-chinese-main'
import { parseIntervalSec } from './seedMatch'

/** YTM 原始曲目元数据（不可直接播放，须经 ytmBridge 匹配为国内可播 MusicInfoOnline）。 */
export interface YtmRawTrack {
  videoId: string
  title: string
  artist: string
  album: string
  intervalSec: number | null
  picUrl: string | null
}

/** 带 YTM 原始来源排名的曲目条目（rank 从 1 开始递增）。 */
export interface RankedYtmTrack {
  track: YtmRawTrack
  rank: number
}

/** YTM `/youtubei/v1/next` Radio 响应解析结果。 */
export interface ParsedYtmRadioPage {
  tracks: YtmRawTrack[]
  continuation: string | null
  relatedBrowseId: string | null
  /** 原始响应中是否实际包含 playlistPanelRenderer / continuation 有效容器。 */
  hasValidContainer: boolean
}

/** 繁简统一（仅用于跨平台匹配比对，不改写页面展示原文）。 */
export const simplifyForMatch = (text?: string | null): string => {
  const s = String(text ?? '')
  return s ? simplify(s) : ''
}

const REGION_BLOCKED_PATTERNS = [
  /youtube\s+music\s+is\s+not\s+available/i,
  /youtube\s+music\s+not\s+available/i,
  /您所在的(?:国家\/地区|地区)暂不支持\s*youtube\s*music/i,
  /此地区不提供\s*youtube\s*music/i,
]

/** InnerTube 或主页返回明确地区受限信号时的类型化错误（放纯解析模块，零运行时依赖）。 */
export class YtmRegionBlockedError extends Error {
  readonly code = 'YTM_REGION_BLOCKED' as const
  constructor(message = 'YouTube Music is not available in your area') {
    super(message)
    this.name = 'YtmRegionBlockedError'
  }
}

export const isYtmRegionBlockedError = (err: unknown): err is YtmRegionBlockedError => {
  return err instanceof YtmRegionBlockedError ||
    (err != null && typeof err === 'object' && (err as { code?: unknown }).code === 'YTM_REGION_BLOCKED')
}

/** 检测主页 HTML 或响应文本是否包含明确的地区受限提示。 */
export const isYtmRegionBlockedHtml = (body: unknown): boolean => {
  if (typeof body !== 'string' || !body.trim()) return false
  return REGION_BLOCKED_PATTERNS.some(rx => rx.test(body))
}

/** 校验 InnerTube JSON 顶层结构是否合法（排除 HTML 错误页、空对象或缺失 responseContext 的畸形 200）。 */
export const isValidInnerTubePayload = (body: unknown): body is Record<string, any> => {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) return false
  const obj = body as Record<string, unknown>
  if (obj.error != null) return false
  return obj.responseContext != null && typeof obj.responseContext === 'object'
}

const joinRuns = (node: any): string => {
  const runs = node?.runs
  if (!Array.isArray(runs)) return typeof node?.simpleText === 'string' ? node.simpleText.trim() : ''
  return runs.map((r: any) => String(r?.text ?? '')).join('').trim()
}

const bestThumbnailUrl = (node: any): string | null => {
  const list = node?.thumbnails ?? node?.musicThumbnailRenderer?.thumbnail?.thumbnails
  if (!Array.isArray(list) || !list.length) return null
  let best = list[list.length - 1]
  for (const item of list) {
    if ((Number(item?.width) || 0) >= (Number(best?.width) || 0)) best = item
  }
  return typeof best?.url === 'string' && best.url.trim() ? best.url.trim() : null
}

/** 清理 YouTube 自动生成的 " - Topic" 频道后缀。 */
const cleanArtistName = (raw: string): string => {
  return raw.replace(/\s*-\s*Topic$/i, '').trim()
}

const TYPE_BADGE_TOKENS = new Set([
  'song', 'video', 'single', 'ep', 'album', 'playlist', 'podcast', 'episode',
  '歌曲', '视频', '單曲', '单曲', '專輯', '专辑', '影片',
])

/** 仅接受含冒号的 `m:ss` / `h:mm:ss` 时长文本（避免把年份 "2004" 或数字专辑名 "1989" 误当秒数）。 */
const parseColonDurationSec = (text: string): number | null => {
  const trimmed = text.trim()
  if (!trimmed.includes(':')) return null
  return parseIntervalSec(trimmed)
}

const isMetaNoiseSegment = (seg: string): boolean => {
  const t = seg.trim()
  if (!t) return true
  if (TYPE_BADGE_TOKENS.has(t.toLowerCase())) return true
  if (parseColonDurationSec(t) != null) return true
  if (/^\d{4}$/.test(t)) return true
  if (/^(?:[\d.,]+\s*[kmb万亿]?\s*(?:plays?|views?|次播放|次观看|次觀看)|views?)$/i.test(t)) return true
  return false
}

const PURE_CONNECTOR_RE = /^[\s,、，/&;；|+]+$|^\s*(?:and|和|与|與)\s*$/i

/** 从 runs 数组（按 ` • ` 分段）提取艺人、专辑与时长。 */
const parseBylineRuns = (runs: any[]): { artist: string, album: string, intervalSec: number | null } => {
  if (!Array.isArray(runs) || !runs.length) return { artist: '', album: '', intervalSec: null }
  const segments: Array<{ text: string, browsePageType: string }> = []
  let currentTexts: string[] = []

  const flush = () => {
    const joined = currentTexts.join('').trim()
    if (joined) segments.push({ text: joined, browsePageType: '' })
    currentTexts = []
  }

  for (const run of runs) {
    const text = String(run?.text ?? '')
    const pageType = run?.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType ?? ''
    // 带显式 browseEndpoint pageType 的 run（如艺人“迈克尔·杰克逊”/“A·Lin”/多艺人“周杰伦”+“ 和 ”+“费玉清”/专辑）前后均独立成段
    if (pageType) {
      flush()
      const trimmed = text.trim()
      if (trimmed) segments.push({ text: trimmed, browsePageType: pageType })
      continue
    }
    // 无链接 run 仅按独立分隔符（•、纯间隔号或两侧有空白的 ·）切分，绝不切词内间隔号（如“迈克尔·杰克逊”）
    if (/^\s*[•·]\s*$/.test(text)) {
      flush()
      continue
    }
    if (text.includes('•') || /\s+·\s+/.test(text)) {
      const parts = text.split(/\s*•\s*|\s+·\s+/)
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].trim()) currentTexts.push(parts[i])
        if (i < parts.length - 1) flush()
      }
      continue
    }
    currentTexts.push(text)
  }
  flush()

  let intervalSec: number | null = null
  const artists: string[] = []
  let album = ''

  for (const seg of segments) {
    // 优先尊重显式类型标注（如专辑名 "1989" 带 MUSIC_PAGE_TYPE_ALBUM 时不得被当作年份/时长）
    if (seg.browsePageType === 'MUSIC_PAGE_TYPE_ALBUM') {
      if (!album) album = seg.text
      continue
    }
    if (seg.browsePageType === 'MUSIC_PAGE_TYPE_ARTIST' || seg.browsePageType === 'MUSIC_PAGE_TYPE_USER_CHANNEL') {
      const cleaned = cleanArtistName(seg.text)
      if (cleaned) artists.push(cleaned)
      continue
    }
    // 跳过连接多位带链接艺人的纯语言连接词（如 " 和 " / " and " / " & " / ", "），避免污染艺人或专辑名
    if (PURE_CONNECTOR_RE.test(seg.text)) continue
    const dur = parseColonDurationSec(seg.text)
    if (dur != null && intervalSec == null) {
      intervalSec = dur
      continue
    }
    if (isMetaNoiseSegment(seg.text)) continue
    if (!artists.length) {
      const cleaned = cleanArtistName(seg.text)
      if (cleaned) artists.push(cleaned)
    } else if (!album) {
      album = seg.text
    }
  }

  return {
    artist: artists.join('、'),
    album,
    intervalSec,
  }
}

const extractResponsiveListItem = (r: any): YtmRawTrack | null => {
  if (!r || typeof r !== 'object') return null
  const videoId =
    r.playlistItemData?.videoId ??
    r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ??
    r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.find((x: any) => x?.navigationEndpoint?.watchEndpoint?.videoId)?.navigationEndpoint?.watchEndpoint?.videoId
  if (typeof videoId !== 'string' || !videoId.trim()) return null

  const cols = Array.isArray(r.flexColumns) ? r.flexColumns : []
  const title = joinRuns(cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text)
  if (!title) return null

  const secondRuns = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? []
  const parsed = parseBylineRuns(secondRuns)
  let album = parsed.album
  if (!album && cols[2]) {
    const thirdText = joinRuns(cols[2]?.musicResponsiveListItemFlexColumnRenderer?.text)
    if (thirdText && !isMetaNoiseSegment(thirdText)) album = thirdText
  }

  // fixedColumns 中的显式时长优先于 byline 派生值
  let fixedIntervalSec: number | null = null
  if (Array.isArray(r.fixedColumns)) {
    for (const fc of r.fixedColumns) {
      const dur = parseColonDurationSec(joinRuns(fc?.musicResponsiveListItemFixedColumnRenderer?.text))
      if (dur != null) { fixedIntervalSec = dur; break }
    }
  }
  const intervalSec = fixedIntervalSec ?? parsed.intervalSec

  return {
    videoId: videoId.trim(),
    title,
    artist: parsed.artist,
    album,
    intervalSec,
    picUrl: bestThumbnailUrl(r.thumbnail),
  }
}

const extractCardShelfItem = (card: any): YtmRawTrack | null => {
  if (!card || typeof card !== 'object') return null
  const watchEp =
    card.title?.runs?.find((x: any) => x?.navigationEndpoint?.watchEndpoint?.videoId)?.navigationEndpoint?.watchEndpoint ??
    card.onTap?.watchEndpoint
  const videoId = watchEp?.videoId
  if (typeof videoId !== 'string' || !videoId.trim()) return null
  const title = joinRuns(card.title)
  if (!title) return null
  const subtitleRuns = card.subtitle?.runs ?? []
  const parsed = parseBylineRuns(subtitleRuns)
  return {
    videoId: videoId.trim(),
    title,
    artist: parsed.artist,
    album: parsed.album,
    intervalSec: parsed.intervalSec,
    picUrl: bestThumbnailUrl(card.thumbnail),
  }
}

const isPlainObject = (v: unknown): v is Record<string, any> => v != null && typeof v === 'object' && !Array.isArray(v)

/**
 * 解析 YTM `/youtubei/v1/search` 歌曲结果（支持 `musicResponsiveListItemRenderer` 与 `musicCardShelfRenderer`）。
 */
export const parseYtmSearchSongs = (body: unknown): { tracks: YtmRawTrack[], hasValidContainer: boolean } => {
  if (!isValidInnerTubePayload(body)) return { tracks: [], hasValidContainer: false }
  const seen = new Set<string>()
  const tracks: YtmRawTrack[] = []
  let hasValidContainer = false

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (
      (isPlainObject(obj.musicShelfRenderer) && Array.isArray(obj.musicShelfRenderer.contents)) ||
      (isPlainObject(obj.sectionListRenderer) && Array.isArray(obj.sectionListRenderer.contents)) ||
      (isPlainObject(obj.musicCardShelfRenderer) && (obj.musicCardShelfRenderer.title != null || Array.isArray(obj.musicCardShelfRenderer.contents)))
    ) {
      hasValidContainer = true
    }
    if (isPlainObject(obj.musicCardShelfRenderer)) {
      const t = extractCardShelfItem(obj.musicCardShelfRenderer)
      if (t && !seen.has(t.videoId)) {
        seen.add(t.videoId)
        tracks.push(t)
      }
    }
    if (isPlainObject(obj.musicResponsiveListItemRenderer)) {
      const t = extractResponsiveListItem(obj.musicResponsiveListItemRenderer)
      if (t && !seen.has(t.videoId)) {
        seen.add(t.videoId)
        tracks.push(t)
      }
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.contents)
  return { tracks, hasValidContainer }
}

const extractPlaylistPanelItem = (p: any): YtmRawTrack | null => {
  if (!p || typeof p !== 'object') return null
  const videoId = p.videoId
  if (typeof videoId !== 'string' || !videoId.trim()) return null
  const title = joinRuns(p.title)
  if (!title) return null

  const longRuns = p.longBylineText?.runs ?? []
  const shortRuns = p.shortBylineText?.runs ?? []
  const parsedLong = parseBylineRuns(longRuns)
  const parsedShort = parseBylineRuns(shortRuns)

  const artist = parsedLong.artist || parsedShort.artist || cleanArtistName(joinRuns(p.shortBylineText))
  const album = parsedLong.album || parsedShort.album
  const intervalSec = parseColonDurationSec(joinRuns(p.lengthText)) ?? parseIntervalSec(joinRuns(p.lengthText)) ?? parsedLong.intervalSec ?? parsedShort.intervalSec

  return {
    videoId: videoId.trim(),
    title,
    artist,
    album,
    intervalSec,
    picUrl: bestThumbnailUrl(p.thumbnail),
  }
}

/**
 * 解析 YTM `/youtubei/v1/next`（含首次 `RDAMVM<videoId>` 与后续 `continuation` 响应）。
 * 自动过滤与 `seedVideoId` 相同的起点曲目，并提取 continuation token 与 `MPTRt_*` Related Tab ID；
 * 按端点严格校验容器及 `contents` 数组形状，防止畸形响应伪装为合法空末页清空游标。
 */
export const parseYtmNextRadio = (
  body: unknown,
  seedVideoId?: string | null,
  options?: { isContinuation?: boolean },
): ParsedYtmRadioPage => {
  if (!isValidInnerTubePayload(body)) {
    return { tracks: [], continuation: null, relatedBrowseId: null, hasValidContainer: false }
  }
  const isContinuation = options?.isContinuation === true
  const seen = new Set<string>()
  if (seedVideoId) seen.add(String(seedVideoId).trim())
  const tracks: YtmRawTrack[] = []
  let continuation: string | null = null
  let relatedBrowseId: string | null = null
  let hasValidContainer = false
  let hasMalformedContinuation = false
  let hasMalformedItem = false

  if (isContinuation) {
    const panel = body.continuationContents?.playlistPanelContinuation
    if (!isPlainObject(panel) || !Array.isArray(panel.contents) || !panel.contents.every(isPlainObject)) {
      return { tracks: [], continuation: null, relatedBrowseId: null, hasValidContainer: false }
    }
    hasValidContainer = true
  }

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (!isContinuation) {
      if (
        (isPlainObject(obj.playlistPanelRenderer) && Array.isArray(obj.playlistPanelRenderer.contents) && obj.playlistPanelRenderer.contents.every(isPlainObject)) ||
        (isPlainObject(obj.playlistPanelContinuation) && Array.isArray(obj.playlistPanelContinuation.contents) && obj.playlistPanelContinuation.contents.every(isPlainObject))
      ) {
        hasValidContainer = true
      }
    }
    // 真实 YTM Radio 将音频+MV 双载体曲目包在 playlistPanelVideoWrapperRenderer，仅走 primaryRenderer，禁止递归 counterpart 导致同曲 MV 重复计票及漏过 seedVideoId
    if (isPlainObject(obj.playlistPanelVideoWrapperRenderer)) {
      if (obj.playlistPanelVideoWrapperRenderer.primaryRenderer !== undefined) {
        walk(obj.playlistPanelVideoWrapperRenderer.primaryRenderer)
      } else {
        hasMalformedItem = true
      }
      return
    }
    if (isPlainObject(obj.playlistPanelVideoRenderer)) {
      const t = extractPlaylistPanelItem(obj.playlistPanelVideoRenderer)
      if (!t) {
        hasMalformedItem = true
        return
      }
      if (!seen.has(t.videoId)) {
        seen.add(t.videoId)
        tracks.push(t)
      }
      return
    }
    if (obj.nextRadioContinuationData !== undefined || obj.nextContinuationData !== undefined || obj.continuationEndpoint !== undefined) {
      const tok =
        obj.nextRadioContinuationData?.continuation ??
        obj.nextContinuationData?.continuation ??
        obj.continuationEndpoint?.continuationCommand?.token
      if (typeof tok === 'string' && tok.trim()) {
        if (!continuation) continuation = tok.trim()
      } else {
        // 已声明 continuation 包装对象但 token 缺失或非字符串（如数字/null）：视为载荷损坏，绝不覆盖旧游标
        hasMalformedContinuation = true
      }
    }
    if (!relatedBrowseId && isPlainObject(obj.tabRenderer)) {
      const browseId = obj.tabRenderer?.endpoint?.browseEndpoint?.browseId
      if (typeof browseId === 'string' && browseId.startsWith('MPTRt_')) {
        relatedBrowseId = browseId
      }
    }
    for (const val of Object.values(obj)) walk(val)
  }

  if (isContinuation) {
    walk(body.continuationContents)
  } else {
    walk(body.contents)
    walk(body.continuationContents)
  }
  if (hasMalformedContinuation || (tracks.length === 0 && !continuation && hasMalformedItem)) {
    return { tracks: [], continuation: null, relatedBrowseId: null, hasValidContainer: false }
  }
  return { tracks, continuation, relatedBrowseId, hasValidContainer }
}

/** 解析 YTM `/youtubei/v1/browse` Related Tab（`MPTRt_*`）返回的相似歌曲。 */
export const parseYtmRelatedSongs = (body: unknown, seedVideoId?: string | null): { tracks: YtmRawTrack[], hasValidContainer: boolean } => {
  if (!isValidInnerTubePayload(body)) return { tracks: [], hasValidContainer: false }
  const seen = new Set<string>()
  if (seedVideoId) seen.add(String(seedVideoId).trim())
  const tracks: YtmRawTrack[] = []
  let hasValidContainer = false

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (
      (isPlainObject(obj.sectionListRenderer) && Array.isArray(obj.sectionListRenderer.contents)) ||
      (isPlainObject(obj.musicCarouselShelfRenderer) && Array.isArray(obj.musicCarouselShelfRenderer.contents)) ||
      (isPlainObject(obj.musicShelfRenderer) && Array.isArray(obj.musicShelfRenderer.contents))
    ) {
      hasValidContainer = true
    }
    if (isPlainObject(obj.musicResponsiveListItemRenderer)) {
      const t = extractResponsiveListItem(obj.musicResponsiveListItemRenderer)
      if (t && !seen.has(t.videoId)) {
        seen.add(t.videoId)
        tracks.push(t)
      }
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.contents)
  return { tracks, hasValidContainer }
}
