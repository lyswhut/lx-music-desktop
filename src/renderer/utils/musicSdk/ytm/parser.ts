/**
 * YouTube Music InnerTube 纯解析模块（零网络/Electron 运行时依赖，vitest 直测）。
 *
 * 位于 `utils/musicSdk/ytm/` 下，供搜索、歌单、排行榜、目录弹窗与 `core/recommend` 统一复用，
 * 避免双解析器漂移与层级倒置。
 */

import { simplify } from '@renderer/utils/simplify-chinese-main'
import { formatPlayTime } from '@common/utils/common'

/** YTM 原始曲目元数据。 */
export interface YtmRawTrack {
  videoId: string
  title: string
  artist: string
  album: string
  intervalSec: number | null
  picUrl: string | null
  artists?: Array<{ id: string, name: string }>
  albumId?: string
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

export interface YtmCatalogArtistItem {
  id: string
  name: string
  img: string
  source: 'ytm'
  sub?: string
}

export interface YtmCatalogAlbumItem {
  id: string
  name: string
  img: string
  source: 'ytm'
  singer: string
  publishTime: string
}

export interface YtmPlaylistItem {
  id: string
  name: string
  author: string
  img: string
  play_count: string
  desc: string
  source: 'ytm'
}

export interface YtmPlaylistDetailInfo {
  name: string
  img: string
  desc: string
  author: string
  play_count: string
}

export interface YtmLegacySongRow {
  name: string
  singer: string
  artists?: Array<{ id: string, name: string }>
  albumName: string
  albumId: string
  source: 'ytm'
  interval: string | null
  songmid: string
  img: string
  types: Array<{ type: '128k' | '320k', size: null }>
  _types: { '128k': { size: null }, '320k': { size: null } }
  typeUrl: Record<string, never>
}

export interface YtmTagItem {
  parent_id: string
  parent_name: string
  id: string
  name: string
  source: 'ytm'
}

export interface YtmTagGroup {
  name: string
  list: YtmTagItem[]
}

export interface YtmBoardItem {
  id: string
  name: string
  bangid: string
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

/** InnerTube 或主页返回明确地区受限信号时的类型化错误。 */
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

const isPlainObject = (v: unknown): v is Record<string, any> => v != null && typeof v === 'object' && !Array.isArray(v)

const joinRuns = (node: any): string => {
  const runs = node?.runs
  if (!Array.isArray(runs)) return typeof node?.simpleText === 'string' ? node.simpleText.trim() : ''
  return runs.map((r: any) => String(r?.text ?? '')).join('').trim()
}

const bestThumbnailUrl = (node: any): string | null => {
  const list = node?.thumbnails ?? node?.musicThumbnailRenderer?.thumbnail?.thumbnails ?? node?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails
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
  'song', 'video', 'single', 'ep', 'album', 'playlist', 'podcast', 'episode', 'artist',
  '歌曲', '视频', '單曲', '单曲', '專輯', '专辑', '影片', '播放列表', '播放清單', '歌单', '音乐人', '藝人', '艺人',
])

/** 仅接受含冒号的 `m:ss` / `h:mm:ss` 时长文本（避免把年份 "2004" 或数字专辑名 "1989" 误当秒数）。 */
const parseColonDurationSec = (text: string): number | null => {
  const trimmed = text.trim()
  if (!trimmed.includes(':')) return null
  const parts = trimmed.split(':').map(p => Number(p))
  if (parts.length < 2 || parts.length > 3 || parts.some(p => !Number.isInteger(p) || p < 0)) return null
  let total = 0
  for (let i = 0; i < parts.length; i++) {
    if (i > 0 && parts[i] >= 60) return null
    total = total * 60 + parts[i]
  }
  return total > 0 ? total : null
}

const parseLooseDurationSec = (text: string): number | null => {
  const colon = parseColonDurationSec(text)
  if (colon != null) return colon
  const trimmed = text.trim()
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return null
}

const isMetaNoiseSegment = (seg: string): boolean => {
  const t = seg.trim()
  if (!t) return true
  if (TYPE_BADGE_TOKENS.has(t.toLowerCase())) return true
  if (parseColonDurationSec(t) != null) return true
  if (/^\d{4}(?:年)?$/.test(t)) return true
  if (/^(?:[\d.,]+\s*[kmb万亿萬億]?\s*(?:plays?|views?|次播放|次观看|次觀看|songs?|首歌曲|tracks?)|views?)$/i.test(t)) return true
  if (/^(?:<|不到|少于|少於)\s*[\d.,]+/i.test(t)) return true
  return false
}

const PURE_CONNECTOR_RE = /^[\s,、，/&;；|+]+$|^\s*(?:and|和|与|與)\s*$/i

interface ParsedByline {
  artist: string
  artists: Array<{ id: string, name: string }>
  album: string
  albumId: string
  intervalSec: number | null
  year: string
}

/** 从 runs 数组（按 ` • ` 分段）提取艺人（含 browseId）、专辑（含 browseId）、年份与时长。 */
const parseBylineRuns = (runs: any[]): ParsedByline => {
  if (!Array.isArray(runs) || !runs.length) {
    return { artist: '', artists: [], album: '', albumId: '', intervalSec: null, year: '' }
  }
  const segments: Array<{ text: string, browsePageType: string, browseId: string }> = []
  let currentTexts: string[] = []

  const flush = () => {
    const joined = currentTexts.join('').trim()
    if (joined) segments.push({ text: joined, browsePageType: '', browseId: '' })
    currentTexts = []
  }

  for (const run of runs) {
    const text = String(run?.text ?? '')
    const browseEp = run?.navigationEndpoint?.browseEndpoint
    const pageType = browseEp?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType ?? ''
    const browseId = typeof browseEp?.browseId === 'string' ? browseEp.browseId.trim() : ''
    if (pageType || /^(?:UC|MPREb_)/i.test(browseId)) {
      flush()
      const trimmed = text.trim()
      if (trimmed) segments.push({ text: trimmed, browsePageType: pageType, browseId })
      continue
    }
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
  const artistRefs: Array<{ id: string, name: string }> = []
  let album = ''
  let albumId = ''
  let hasExplicitAlbum = false
  let year = ''

  for (const seg of segments) {
    const isAlbumRun = seg.browsePageType === 'MUSIC_PAGE_TYPE_ALBUM' || (!seg.browsePageType && /^MPREb_/i.test(seg.browseId))
    if (isAlbumRun) {
      if (!hasExplicitAlbum) {
        album = seg.text
        albumId = seg.browseId
        hasExplicitAlbum = true
      }
      continue
    }
    const isArtistRun =
      seg.browsePageType === 'MUSIC_PAGE_TYPE_ARTIST' ||
      seg.browsePageType === 'MUSIC_PAGE_TYPE_USER_CHANNEL' ||
      (!seg.browsePageType && /^UC/i.test(seg.browseId))
    if (isArtistRun) {
      const cleaned = cleanArtistName(seg.text)
      if (cleaned) {
        artists.push(cleaned)
        if (seg.browseId) artistRefs.push({ id: seg.browseId, name: cleaned })
      }
      continue
    }
    if (PURE_CONNECTOR_RE.test(seg.text)) continue
    const dur = parseColonDurationSec(seg.text)
    if (dur != null && intervalSec == null) {
      intervalSec = dur
      continue
    }
    if (!year && /^\d{4}(?:年)?$/.test(seg.text)) {
      year = seg.text.replace(/年$/, '')
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
    artists: artistRefs,
    album,
    albumId,
    intervalSec,
    year,
  }
}

const extractContinuationToken = (node: any): string | null => {
  if (!isPlainObject(node)) return null
  const tok =
    node.nextContinuationData?.continuation ??
    node.nextRadioContinuationData?.continuation ??
    node.continuationEndpoint?.continuationCommand?.token ??
    node.continuationCommand?.token
  return typeof tok === 'string' && tok.trim() ? tok.trim() : null
}

const extractResponsiveListItem = (r: any): YtmRawTrack | null => {
  if (!isPlainObject(r)) return null
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
  let albumId = parsed.albumId
  let hasExplicitAlbum = Boolean(albumId)
  let fallbackAlbum = ''
  for (let i = 2; i < cols.length && !hasExplicitAlbum; i++) {
    const colTextNode = cols[i]?.musicResponsiveListItemFlexColumnRenderer?.text
    if (!colTextNode) continue
    const colParsed = parseBylineRuns(colTextNode?.runs ?? [])
    if (colParsed.album && colParsed.albumId) {
      album = colParsed.album
      albumId = colParsed.albumId
      hasExplicitAlbum = true
      break
    }
    if (!album && !fallbackAlbum) {
      if (colParsed.album) {
        fallbackAlbum = colParsed.album
      } else if (!colParsed.artists.length) {
        const colText = joinRuns(colTextNode)
        if (colText && !isMetaNoiseSegment(colText)) {
          fallbackAlbum = colText
        }
      }
    }
  }
  if (!album && fallbackAlbum) album = fallbackAlbum

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
    ...(parsed.artists.length ? { artists: parsed.artists } : {}),
    ...(albumId ? { albumId } : {}),
  }
}

const extractCardShelfItem = (card: any): YtmRawTrack | null => {
  if (!isPlainObject(card)) return null
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
    ...(parsed.artists.length ? { artists: parsed.artists } : {}),
    ...(parsed.albumId ? { albumId: parsed.albumId } : {}),
  }
}

/** 校验并规范化 YTM 歌单 ID（统一输出 `VL<listId>`；拒绝非 `RDCLAK5uy_` 的 `RD*` 自动混音）。 */
export const isUnsupportedYtmMixId = (raw: string): boolean => {
  const cleaned = raw.trim().replace(/^VL/i, '')
  if (!cleaned) return false
  return /^RD/i.test(cleaned) && !/^RDCLAK5uy_/i.test(cleaned)
}

export const extractYtmListParam = (input: string): string | null => {
  const value = input.trim()
  if (!value) return null
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    const host = url.hostname.toLowerCase()
    if (!/(^|\.)(?:youtube\.com|youtu\.be)$/.test(host)) return null
    const list = url.searchParams.get('list')?.trim() ?? ''
    return list || null
  } catch {
    return null
  }
}

export const normalizeYtmPlaylistId = (raw: string): string | null => {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return null
  const fromUrl = extractYtmListParam(trimmed)
  const candidate = (fromUrl ?? trimmed).trim()
  if (!candidate) return null
  const withoutVl = candidate.replace(/^VL/i, '')
  if (!/^[A-Za-z0-9_-]{8,}$/.test(withoutVl)) return null
  // 拒绝明显非歌单的 YouTube browseId 前缀（频道 UC* / 专辑或主页 MP* / 浏览入口 FE*）
  if (/^(?:UC|MP|FE)/i.test(withoutVl)) return null
  if (isUnsupportedYtmMixId(withoutVl)) return null
  return `VL${withoutVl}`
}

/** 将 `YtmRawTrack` 转为旧格式 SDK 曲目行对象（由 store/`catalog/adapter` 统一经 `toNewMusicInfo` 转换）。 */
export const toLegacyYtmSong = (track: YtmRawTrack): YtmLegacySongRow => {
  return {
    name: track.title,
    singer: track.artist,
    ...(track.artists?.length ? { artists: track.artists.map(a => ({ id: a.id, name: a.name })) } : {}),
    albumName: track.album,
    albumId: track.albumId ?? '',
    source: 'ytm',
    interval: track.intervalSec != null && track.intervalSec > 0 ? formatPlayTime(track.intervalSec) : null,
    songmid: track.videoId,
    img: track.picUrl ?? '',
    types: [
      { type: '128k', size: null },
      { type: '320k', size: null },
    ],
    _types: {
      '128k': { size: null },
      '320k': { size: null },
    },
    typeUrl: {},
  }
}

/** 解析 YTM `/youtubei/v1/search` 歌曲结果（含 continuation）。 */
export const parseYtmSearchSongsPage = (body: unknown): {
  tracks: YtmRawTrack[]
  continuation: string | null
  hasValidContainer: boolean
} => {
  if (!isValidInnerTubePayload(body)) return { tracks: [], continuation: null, hasValidContainer: false }
  const seen = new Set<string>()
  const tracks: YtmRawTrack[] = []
  let continuation: string | null = null
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
      (isPlainObject(obj.musicShelfContinuation) && Array.isArray(obj.musicShelfContinuation.contents)) ||
      (isPlainObject(obj.sectionListRenderer) && Array.isArray(obj.sectionListRenderer.contents)) ||
      (isPlainObject(obj.musicCardShelfRenderer) && (obj.musicCardShelfRenderer.title != null || Array.isArray(obj.musicCardShelfRenderer.contents)))
    ) {
      hasValidContainer = true
    }
    if (!continuation) {
      const tok = extractContinuationToken(obj)
      if (tok) continuation = tok
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
  walk(body.continuationContents)
  return { tracks, continuation, hasValidContainer }
}

/** 兼容既有推荐模块调用签名。 */
export const parseYtmSearchSongs = (body: unknown): { tracks: YtmRawTrack[], hasValidContainer: boolean } => {
  const { tracks, hasValidContainer } = parseYtmSearchSongsPage(body)
  return { tracks, hasValidContainer }
}

const getItemBrowseMeta = (r: any): { browseId: string, pageType: string } => {
  const titleEp = Array.isArray(r?.title?.runs)
    ? r.title.runs.find((x: any) => x?.navigationEndpoint?.browseEndpoint)?.navigationEndpoint?.browseEndpoint
    : undefined
  const flexTitleRuns = r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
  const flexTitleEp = Array.isArray(flexTitleRuns)
    ? flexTitleRuns.find((x: any) => x?.navigationEndpoint?.browseEndpoint)?.navigationEndpoint?.browseEndpoint
    : undefined
  const ep = r?.navigationEndpoint?.browseEndpoint ?? titleEp ?? flexTitleEp
  const browseId = typeof ep?.browseId === 'string' ? ep.browseId.trim() : ''
  const pageType = ep?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType ?? ''
  return { browseId, pageType }
}

/** 解析 YTM 歌手搜索响应（含 continuation）。 */
export const parseYtmSearchArtistsPage = (body: unknown): {
  list: YtmCatalogArtistItem[]
  continuation: string | null
  hasValidContainer: boolean
} => {
  if (!isValidInnerTubePayload(body)) return { list: [], continuation: null, hasValidContainer: false }
  const seen = new Set<string>()
  const list: YtmCatalogArtistItem[] = []
  let continuation: string | null = null
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
      (isPlainObject(obj.musicShelfContinuation) && Array.isArray(obj.musicShelfContinuation.contents)) ||
      (isPlainObject(obj.sectionListRenderer) && Array.isArray(obj.sectionListRenderer.contents))
    ) {
      hasValidContainer = true
    }
    if (!continuation) {
      const tok = extractContinuationToken(obj)
      if (tok) continuation = tok
    }
    if (isPlainObject(obj.musicResponsiveListItemRenderer)) {
      const r = obj.musicResponsiveListItemRenderer
      const { browseId, pageType } = getItemBrowseMeta(r)
      if (browseId && (!pageType || pageType === 'MUSIC_PAGE_TYPE_ARTIST' || pageType === 'MUSIC_PAGE_TYPE_USER_CHANNEL')) {
        const cols = Array.isArray(r.flexColumns) ? r.flexColumns : []
        const name = cleanArtistName(joinRuns(cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text))
        if (name && !seen.has(browseId)) {
          seen.add(browseId)
          const sub = joinRuns(cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text)
          list.push({
            id: browseId,
            name,
            img: bestThumbnailUrl(r.thumbnail) ?? '',
            source: 'ytm',
            ...(sub ? { sub } : {}),
          })
        }
      }
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.contents)
  walk(body.continuationContents)
  return { list, continuation, hasValidContainer }
}

/** 解析 YTM 专辑搜索响应（含 continuation）。 */
export const parseYtmSearchAlbumsPage = (body: unknown): {
  list: YtmCatalogAlbumItem[]
  continuation: string | null
  hasValidContainer: boolean
} => {
  if (!isValidInnerTubePayload(body)) return { list: [], continuation: null, hasValidContainer: false }
  const seen = new Set<string>()
  const list: YtmCatalogAlbumItem[] = []
  let continuation: string | null = null
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
      (isPlainObject(obj.musicShelfContinuation) && Array.isArray(obj.musicShelfContinuation.contents)) ||
      (isPlainObject(obj.sectionListRenderer) && Array.isArray(obj.sectionListRenderer.contents))
    ) {
      hasValidContainer = true
    }
    if (!continuation) {
      const tok = extractContinuationToken(obj)
      if (tok) continuation = tok
    }
    if (isPlainObject(obj.musicResponsiveListItemRenderer)) {
      const r = obj.musicResponsiveListItemRenderer
      const { browseId, pageType } = getItemBrowseMeta(r)
      if (browseId && (!pageType || pageType === 'MUSIC_PAGE_TYPE_ALBUM')) {
        const cols = Array.isArray(r.flexColumns) ? r.flexColumns : []
        const name = joinRuns(cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text)
        const parsedSub = parseBylineRuns(cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? [])
        if (name && !seen.has(browseId)) {
          seen.add(browseId)
          list.push({
            id: browseId,
            name,
            img: bestThumbnailUrl(r.thumbnail) ?? '',
            source: 'ytm',
            singer: parsedSub.artist,
            publishTime: parsedSub.year,
          })
        }
      }
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.contents)
  walk(body.continuationContents)
  return { list, continuation, hasValidContainer }
}

const parsePlaylistSubtitleMeta = (subtitleText: string): { author: string, playCount: string } => {
  const parts = subtitleText.split(/\s*[•·]\s*/).map(s => s.trim()).filter(Boolean)
  let author = ''
  let playCount = ''
  for (const part of parts) {
    if (TYPE_BADGE_TOKENS.has(part.toLowerCase())) continue
    if (/^(?:[\d.,]+\s*[kmb万亿萬億]?\s*(?:views?|次观看|次觀看|plays?|次播放|首歌曲|songs?|tracks?))$/i.test(part)) {
      if (!playCount) playCount = part
      continue
    }
    if (!author) author = part
  }
  return { author, playCount }
}

/** 解析 YTM 歌单搜索响应（含 continuation）。 */
export const parseYtmSearchPlaylistsPage = (body: unknown): {
  list: YtmPlaylistItem[]
  continuation: string | null
  hasValidContainer: boolean
} => {
  if (!isValidInnerTubePayload(body)) return { list: [], continuation: null, hasValidContainer: false }
  const seen = new Set<string>()
  const list: YtmPlaylistItem[] = []
  let continuation: string | null = null
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
      (isPlainObject(obj.musicShelfContinuation) && Array.isArray(obj.musicShelfContinuation.contents)) ||
      (isPlainObject(obj.sectionListRenderer) && Array.isArray(obj.sectionListRenderer.contents))
    ) {
      hasValidContainer = true
    }
    if (!continuation) {
      const tok = extractContinuationToken(obj)
      if (tok) continuation = tok
    }
    if (isPlainObject(obj.musicResponsiveListItemRenderer)) {
      const r = obj.musicResponsiveListItemRenderer
      const cols = Array.isArray(r.flexColumns) ? r.flexColumns : []
      const { browseId, pageType } = getItemBrowseMeta(r)
      const canonicalId = normalizeYtmPlaylistId(browseId)
      if (canonicalId && (!pageType || pageType === 'MUSIC_PAGE_TYPE_PLAYLIST')) {
        const name = joinRuns(cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text)
        const subText = joinRuns(cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text)
        const { author, playCount } = parsePlaylistSubtitleMeta(subText)
        if (name && !seen.has(canonicalId)) {
          seen.add(canonicalId)
          list.push({
            id: canonicalId,
            name,
            author: author || 'YouTube Music',
            img: bestThumbnailUrl(r.thumbnail) ?? '',
            play_count: playCount,
            desc: subText,
            source: 'ytm',
          })
        }
      }
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.contents)
  walk(body.continuationContents)
  return { list, continuation, hasValidContainer }
}

/** 解析 `FEmusic_moods_and_genres` 为歌单分类标签。 */
export const parseYtmMoodsAndGenres = (body: unknown): {
  tags: YtmTagGroup[]
  hotTag: YtmTagItem[]
  source: 'ytm'
  hasValidContainer: boolean
} => {
  if (!isValidInnerTubePayload(body)) return { tags: [], hotTag: [], source: 'ytm', hasValidContainer: false }
  const groups: YtmTagGroup[] = []
  let hasValidContainer = false

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (isPlainObject(obj.gridRenderer) && Array.isArray(obj.gridRenderer.items)) {
      hasValidContainer = true
      const groupName = joinRuns(obj.gridRenderer.header?.gridHeaderRenderer?.title) || '分类'
      const items: YtmTagItem[] = []
      const seen = new Set<string>()
      for (const entry of obj.gridRenderer.items) {
        const btn = entry?.musicNavigationButtonRenderer
        if (!isPlainObject(btn)) continue
        const name = joinRuns(btn.buttonText)
        const params = btn.clickCommand?.browseEndpoint?.params
        if (!name || typeof params !== 'string' || !params.trim() || seen.has(params.trim())) continue
        seen.add(params.trim())
        items.push({
          parent_id: groupName,
          parent_name: groupName,
          id: params.trim(),
          name,
          source: 'ytm',
        })
      }
      if (items.length) groups.push({ name: groupName, list: items })
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.contents)
  const hotTag = groups.flatMap(g => g.list.slice(0, 6)).slice(0, 12)
  return { tags: groups, hotTag, source: 'ytm', hasValidContainer }
}

/** 解析 `FEmusic_home` / `FEmusic_moods_and_genres_category` / `FEmusic_charts` 的歌单卡片。 */
export const parseYtmBrowsePlaylists = (body: unknown): {
  list: YtmPlaylistItem[]
  hasValidContainer: boolean
} => {
  if (!isValidInnerTubePayload(body)) return { list: [], hasValidContainer: false }
  const seen = new Set<string>()
  const list: YtmPlaylistItem[] = []
  let hasValidContainer = false

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (
      (isPlainObject(obj.musicCarouselShelfRenderer) && Array.isArray(obj.musicCarouselShelfRenderer.contents)) ||
      (isPlainObject(obj.musicShelfRenderer) && Array.isArray(obj.musicShelfRenderer.contents)) ||
      (isPlainObject(obj.gridRenderer) && Array.isArray(obj.gridRenderer.items))
    ) {
      hasValidContainer = true
    }
    if (isPlainObject(obj.musicTwoRowItemRenderer)) {
      const t = obj.musicTwoRowItemRenderer
      const { browseId, pageType } = getItemBrowseMeta(t)
      const canonicalId = normalizeYtmPlaylistId(browseId)
      if (canonicalId && (!pageType || pageType === 'MUSIC_PAGE_TYPE_PLAYLIST')) {
        const name = joinRuns(t.title)
        const subText = joinRuns(t.subtitle)
        const { author, playCount } = parsePlaylistSubtitleMeta(subText)
        if (name && !seen.has(canonicalId)) {
          seen.add(canonicalId)
          list.push({
            id: canonicalId,
            name,
            author: author || 'YouTube Music',
            img: bestThumbnailUrl(t.thumbnailRenderer) ?? bestThumbnailUrl(t.thumbnail) ?? '',
            play_count: playCount,
            desc: subText,
            source: 'ytm',
          })
        }
      }
      return
    }
    if (isPlainObject(obj.musicResponsiveListItemRenderer)) {
      const r = obj.musicResponsiveListItemRenderer
      const cols = Array.isArray(r.flexColumns) ? r.flexColumns : []
      const { browseId, pageType } = getItemBrowseMeta(r)
      const canonicalId = normalizeYtmPlaylistId(browseId)
      if (canonicalId && (!pageType || pageType === 'MUSIC_PAGE_TYPE_PLAYLIST')) {
        const name = joinRuns(cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text)
        const subText = joinRuns(cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text)
        const { author, playCount } = parsePlaylistSubtitleMeta(subText)
        if (name && !seen.has(canonicalId)) {
          seen.add(canonicalId)
          list.push({
            id: canonicalId,
            name,
            author: author || 'YouTube Music',
            img: bestThumbnailUrl(r.thumbnail) ?? '',
            play_count: playCount,
            desc: subText,
            source: 'ytm',
          })
        }
      }
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.contents)
  return { list, hasValidContainer }
}

/**
 * 从单个已定位的曲目栏位节点内提取曲目与专属续页游标（绝不读取外层 sectionListRenderer 的推荐续页）。
 * 同时区分「无续页节点」与「存在续页节点但 token 损坏/为空」，防止静默截断。
 */
const extractScopedTrackShelf = (shelf: Record<string, any>): {
  tracks: YtmRawTrack[]
  continuation: string | null
  hasMalformedContinuation: boolean
} => {
  const seen = new Set<string>()
  const tracks: YtmRawTrack[] = []
  let continuation: string | null = null
  let hasMalformedContinuation = false

  const walkShelf = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walkShelf(item)
      return
    }
    const obj = node as Record<string, any>
    const hasContinuationNode =
      obj.nextContinuationData !== undefined ||
      obj.nextRadioContinuationData !== undefined ||
      obj.continuationEndpoint !== undefined ||
      obj.continuationCommand !== undefined ||
      obj.continuationItemRenderer !== undefined
    if (hasContinuationNode) {
      const tok = extractContinuationToken(obj)
      if (tok) {
        if (!continuation) continuation = tok
      } else {
        hasMalformedContinuation = true
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
    for (const val of Object.values(obj)) walkShelf(val)
  }

  walkShelf(shelf)
  return { tracks, continuation, hasMalformedContinuation }
}

/** 解析 YTM 歌单 / 榜单详情页（含首屏 header 与 continuation 续页；严格限定在目标曲目栏内）。 */
export const parseYtmPlaylistDetailPage = (
  body: unknown,
  options: { allowGenericShelf?: boolean } = {},
): {
  info: YtmPlaylistDetailInfo
  tracks: YtmRawTrack[]
  continuation: string | null
  hasValidContainer: boolean
} => {
  const emptyInfo: YtmPlaylistDetailInfo = { name: '', img: '', desc: '', author: '', play_count: '' }
  if (!isValidInnerTubePayload(body)) {
    return { info: emptyInfo, tracks: [], continuation: null, hasValidContainer: false }
  }
  const info: YtmPlaylistDetailInfo = { ...emptyInfo }
  let primaryPlaylistShelf: Record<string, any> | null = null
  let fallbackTrackShelf: Record<string, any> | null = null

  const extractHeader = (h: any) => {
    if (!isPlainObject(h)) return
    if (!info.name) info.name = joinRuns(h.title)
    if (!info.img) info.img = bestThumbnailUrl(h.thumbnail) ?? ''
    if (!info.desc) {
      info.desc = joinRuns(h.description?.musicDescriptionShelfRenderer?.description ?? h.description) || joinRuns(h.secondSubtitle)
    }
    const subText = joinRuns(h.subtitle)
    const secondSubText = joinRuns(h.secondSubtitle)
    const meta = parsePlaylistSubtitleMeta(`${subText} • ${secondSubText}`)
    if (!info.author) info.author = joinRuns(h.straplineTextOne) || meta.author || 'YouTube Music'
    if (!info.play_count) info.play_count = meta.playCount
  }

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (isPlainObject(obj.musicResponsiveHeaderRenderer)) extractHeader(obj.musicResponsiveHeaderRenderer)
    if (isPlainObject(obj.musicDetailHeaderRenderer)) extractHeader(obj.musicDetailHeaderRenderer)
    if (isPlainObject(obj.musicEditablePlaylistDetailHeaderRenderer)) {
      extractHeader(obj.musicEditablePlaylistDetailHeaderRenderer.header?.musicDetailHeaderRenderer ?? obj.musicEditablePlaylistDetailHeaderRenderer.header?.musicResponsiveHeaderRenderer)
    }
    // 优先定位专属歌单曲目栏（歌单/榜单同步绝不把缺失主栏时残存的推荐 musicShelfRenderer 误认作歌单正文）
    if (isPlainObject(obj.musicPlaylistShelfRenderer) && Array.isArray(obj.musicPlaylistShelfRenderer.contents)) {
      primaryPlaylistShelf ??= obj.musicPlaylistShelfRenderer
      return
    }
    if (isPlainObject(obj.musicPlaylistShelfContinuation) && Array.isArray(obj.musicPlaylistShelfContinuation.contents)) {
      primaryPlaylistShelf ??= obj.musicPlaylistShelfContinuation
      return
    }
    if (isPlainObject(obj.appendContinuationItemsAction) && Array.isArray(obj.appendContinuationItemsAction.continuationItems)) {
      primaryPlaylistShelf ??= obj.appendContinuationItemsAction
      return
    }
    if (isPlainObject(obj.musicShelfContinuation) && Array.isArray(obj.musicShelfContinuation.contents)) {
      fallbackTrackShelf ??= obj.musicShelfContinuation
      return
    }
    if (
      options.allowGenericShelf &&
      isPlainObject(obj.musicShelfRenderer) &&
      Array.isArray(obj.musicShelfRenderer.contents) &&
      !joinRuns(obj.musicShelfRenderer.title)
    ) {
      fallbackTrackShelf ??= obj.musicShelfRenderer
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.header)
  walk(body.contents)
  walk(body.continuationContents)
  walk(body.onResponseReceivedActions)

  const targetShelf = primaryPlaylistShelf ?? fallbackTrackShelf
  if (!targetShelf) {
    return { info, tracks: [], continuation: null, hasValidContainer: false }
  }
  const { tracks, continuation, hasMalformedContinuation } = extractScopedTrackShelf(targetShelf)
  if (hasMalformedContinuation && !continuation) {
    return { info, tracks: [], continuation: null, hasValidContainer: false }
  }
  return { info, tracks, continuation, hasValidContainer: true }
}

/** 解析 YTM 专辑详情页（含续页游标；优先主轨曲目栏，单艺人专辑曲目缺失艺人/专辑/封面时自动从 header 回填）。 */
export const parseYtmAlbumDetail = (body: unknown, albumBrowseId = ''): {
  info: { name: string, artist: string, artists: Array<{ id: string, name: string }>, img: string, desc: string }
  tracks: YtmRawTrack[]
  continuation: string | null
  hasValidContainer: boolean
} => {
  const info: { name: string, artist: string, artists: Array<{ id: string, name: string }>, img: string, desc: string } = {
    name: '', artist: '', artists: [], img: '', desc: '',
  }
  if (!isValidInnerTubePayload(body)) return { info, tracks: [], continuation: null, hasValidContainer: false }
  let primaryShelf: Record<string, any> | null = null

  const extractHeader = (h: any) => {
    if (!isPlainObject(h)) return
    if (!info.name) info.name = joinRuns(h.title)
    if (!info.img) info.img = bestThumbnailUrl(h.thumbnail) ?? ''
    if (!info.desc) info.desc = joinRuns(h.description?.musicDescriptionShelfRenderer?.description ?? h.description)
    const strap = parseBylineRuns(h.straplineTextOne?.runs ?? [])
    const sub = parseBylineRuns(h.subtitle?.runs ?? [])
    if (!info.artist) info.artist = strap.artist || sub.artist
    if (!info.artists.length) info.artists = strap.artists.length ? strap.artists : sub.artists
  }

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (isPlainObject(obj.musicResponsiveHeaderRenderer)) extractHeader(obj.musicResponsiveHeaderRenderer)
    if (isPlainObject(obj.musicDetailHeaderRenderer)) extractHeader(obj.musicDetailHeaderRenderer)
    if (isPlainObject(obj.musicShelfRenderer) && Array.isArray(obj.musicShelfRenderer.contents)) {
      // 专辑主曲目栏无标题；绝不将带标题的「其他版本/推荐歌曲」栏当作专辑正文
      if (!joinRuns(obj.musicShelfRenderer.title)) primaryShelf ??= obj.musicShelfRenderer
      return
    }
    if (isPlainObject(obj.musicShelfContinuation) && Array.isArray(obj.musicShelfContinuation.contents)) {
      primaryShelf ??= obj.musicShelfContinuation
      return
    }
    if (isPlainObject(obj.musicPlaylistShelfRenderer) && Array.isArray(obj.musicPlaylistShelfRenderer.contents)) {
      primaryShelf ??= obj.musicPlaylistShelfRenderer
      return
    }
    if (isPlainObject(obj.musicPlaylistShelfContinuation) && Array.isArray(obj.musicPlaylistShelfContinuation.contents)) {
      primaryShelf ??= obj.musicPlaylistShelfContinuation
      return
    }
    if (isPlainObject(obj.appendContinuationItemsAction) && Array.isArray(obj.appendContinuationItemsAction.continuationItems)) {
      primaryShelf ??= obj.appendContinuationItemsAction
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.header)
  // 双栏布局优先扫描 secondaryContents（正片曲目栏所在区域），再扫其余内容提取 header 信息
  const secondary = body.contents?.twoColumnBrowseResultsRenderer?.secondaryContents
  if (secondary) walk(secondary)
  walk(body.contents)
  walk(body.continuationContents)
  walk(body.onResponseReceivedActions)

  if (!primaryShelf) {
    return { info, tracks: [], continuation: null, hasValidContainer: false }
  }
  const { tracks: rawTracks, continuation, hasMalformedContinuation } = extractScopedTrackShelf(primaryShelf)
  if (hasMalformedContinuation && !continuation) {
    return { info, tracks: [], continuation: null, hasValidContainer: false }
  }
  const tracks = rawTracks.map(t => {
    const resolvedAlbumId = (t.albumId ?? '') || albumBrowseId
    const resolvedPicUrl = (t.picUrl ?? '') || info.img
    return {
      ...t,
      artist: t.artist || info.artist,
      artists: t.artists?.length ? t.artists : (!t.artist && info.artists.length ? info.artists : undefined),
      album: t.album || info.name,
      albumId: resolvedAlbumId.length > 0 ? resolvedAlbumId : undefined,
      picUrl: resolvedPicUrl.length > 0 ? resolvedPicUrl : null,
    }
  })
  return { info, tracks, continuation, hasValidContainer: true }
}

/** 解析 YTM 歌手主页（提取热门歌曲栏位的完整歌单 `moreBrowseId` 与内联回退曲目）。 */
export const parseYtmArtistPage = (body: unknown, artistBrowseId = ''): {
  name: string
  img: string
  inlineTracks: YtmRawTrack[]
  topSongsBrowseId: string | null
  topSongsParams: string | null
  hasValidContainer: boolean
} => {
  if (!isValidInnerTubePayload(body)) {
    return { name: '', img: '', inlineTracks: [], topSongsBrowseId: null, topSongsParams: null, hasValidContainer: false }
  }
  let name = ''
  let img = ''
  let hasValidContainer = false
  const songShelves: Array<{
    title: string
    browseId: string | null
    params: string | null
    tracks: YtmRawTrack[]
  }> = []

  const extractHeader = (h: any) => {
    if (!isPlainObject(h)) return
    if (!name) name = cleanArtistName(joinRuns(h.title))
    if (!img) img = bestThumbnailUrl(h.thumbnail) ?? ''
  }

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (isPlainObject(obj.musicImmersiveHeaderRenderer)) extractHeader(obj.musicImmersiveHeaderRenderer)
    if (isPlainObject(obj.musicVisualHeaderRenderer)) extractHeader(obj.musicVisualHeaderRenderer)
    if (isPlainObject(obj.musicHeaderRenderer)) extractHeader(obj.musicHeaderRenderer)
    if (isPlainObject(obj.musicShelfRenderer) && Array.isArray(obj.musicShelfRenderer.contents)) {
      hasValidContainer = true
      const shelf = obj.musicShelfRenderer
      const ep = shelf.bottomEndpoint?.browseEndpoint ?? shelf.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint
      let browseId: string | null = null
      let params: string | null = null
      if (typeof ep?.browseId === 'string' && ep.browseId.trim()) {
        const normalized = normalizeYtmPlaylistId(ep.browseId.trim())
        if (normalized) {
          browseId = normalized
          params = typeof ep.params === 'string' && ep.params.trim() ? ep.params.trim() : null
        }
      }
      const shelfSeen = new Set<string>()
      const shelfTracks: YtmRawTrack[] = []
      for (const item of shelf.contents) {
        if (isPlainObject(item?.musicResponsiveListItemRenderer)) {
          const t = extractResponsiveListItem(item.musicResponsiveListItemRenderer)
          if (t && !shelfSeen.has(t.videoId)) {
            shelfSeen.add(t.videoId)
            shelfTracks.push(t)
          }
        }
      }
      if (browseId != null || shelfTracks.length > 0) {
        songShelves.push({
          title: joinRuns(shelf.title),
          browseId,
          params,
          tracks: shelfTracks,
        })
      }
      return
    }
    if (isPlainObject(obj.sectionListRenderer) && Array.isArray(obj.sectionListRenderer.contents)) {
      hasValidContainer = true
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.header)
  walk(body.contents)

  // 优先定位「热门歌曲 / Songs」栏，再按同一栏提取完整歌单入口与内联预览曲目，避免混入其他曲目栏
  const SONGS_SHELF_RE = /^(?:top\s+songs|songs|热门歌曲|熱門歌曲|歌曲)$/i
  const targetShelf =
    songShelves.find(s => SONGS_SHELF_RE.test(s.title) && Boolean(s.browseId)) ??
    songShelves.find(s => SONGS_SHELF_RE.test(s.title)) ??
    songShelves.find(s => Boolean(s.browseId)) ??
    songShelves[0]

  const topSongsBrowseId = targetShelf?.browseId ?? null
  const topSongsParams = targetShelf?.params ?? null
  const inlineTracks = (targetShelf?.tracks ?? []).map(t => ({
    ...t,
    artist: t.artist || name,
    // 仅在曲目未携带歌手名时回填歌手主页主艺人 ID，防止无链接客席歌手错误继承主艺人 ID
    artists: t.artists?.length ? t.artists : (!t.artist && artistBrowseId && name ? [{ id: artistBrowseId, name }] : undefined),
  }))
  return { name, img, inlineTracks, topSongsBrowseId, topSongsParams, hasValidContainer }
}

/** 解析 `FEmusic_charts` 官方榜单入口列表。 */
export const parseYtmCharts = (body: unknown): {
  list: YtmBoardItem[]
  hasValidContainer: boolean
} => {
  const { list: playlists, hasValidContainer } = parseYtmBrowsePlaylists(body)
  return {
    hasValidContainer,
    list: playlists.map(pl => ({
      id: `ytm__${pl.id}`,
      name: pl.name,
      bangid: pl.id,
    })),
  }
}

const extractPlaylistPanelItem = (p: any): YtmRawTrack | null => {
  if (!isPlainObject(p)) return null
  const videoId = p.videoId
  if (typeof videoId !== 'string' || !videoId.trim()) return null
  const title = joinRuns(p.title)
  if (!title) return null

  const longRuns = p.longBylineText?.runs ?? []
  const shortRuns = p.shortBylineText?.runs ?? []
  const parsedLong = parseBylineRuns(longRuns)
  const parsedShort = parseBylineRuns(shortRuns)

  const artist = parsedLong.artist || parsedShort.artist || cleanArtistName(joinRuns(p.shortBylineText))
  const artists = parsedLong.artists.length ? parsedLong.artists : parsedShort.artists
  const album = parsedLong.album || parsedShort.album
  const albumId = parsedLong.albumId || parsedShort.albumId
  const intervalSec = parseColonDurationSec(joinRuns(p.lengthText)) ?? parseLooseDurationSec(joinRuns(p.lengthText)) ?? parsedLong.intervalSec ?? parsedShort.intervalSec

  return {
    videoId: videoId.trim(),
    title,
    artist,
    album,
    intervalSec,
    picUrl: bestThumbnailUrl(p.thumbnail),
    ...(artists.length ? { artists } : {}),
    ...(albumId ? { albumId } : {}),
  }
}

/**
 * 解析 YTM `/youtubei/v1/next`（含首次 `RDAMVM<videoId>` 与后续 `continuation` 响应）。
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
      const tok = extractContinuationToken(obj)
      if (tok) {
        if (!continuation) continuation = tok
      } else {
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

/** 解析 YTM `/youtubei/v1/music/get_search_suggestions` 自动补全联想词。 */
export const parseYtmSearchSuggestions = (body: unknown): string[] => {
  if (!isValidInnerTubePayload(body)) return []
  const seen = new Set<string>()
  const list: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, any>
    if (isPlainObject(obj.searchSuggestionRenderer)) {
      const r = obj.searchSuggestionRenderer
      const query = typeof r.navigationEndpoint?.searchEndpoint?.query === 'string'
        ? r.navigationEndpoint.searchEndpoint.query.trim()
        : joinRuns(r.suggestion)
      if (query && !seen.has(query)) {
        seen.add(query)
        list.push(query)
      }
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }
  walk(body.contents)
  return list
}

/** 从 `FEmusic_charts` 响应中提取热门曲目/艺人关键词供热搜面板展示。 */
export const parseYtmHotSearchTerms = (body: unknown): { list: string[], hasValidContainer: boolean } => {
  if (!isValidInnerTubePayload(body)) return { list: [], hasValidContainer: false }
  const seen = new Set<string>()
  const list: string[] = []
  let hasValidContainer = false

  const pushTerm = (raw: string) => {
    const text = raw.trim()
    if (!text || text.length > 60 || seen.has(text)) return
    seen.add(text)
    list.push(text)
  }

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
      const cols = Array.isArray(obj.musicResponsiveListItemRenderer.flexColumns)
        ? obj.musicResponsiveListItemRenderer.flexColumns
        : []
      const title = joinRuns(cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text)
      if (title) pushTerm(title)
      return
    }
    if (isPlainObject(obj.musicTwoRowItemRenderer)) {
      const title = joinRuns(obj.musicTwoRowItemRenderer.title)
      if (title) pushTerm(title)
      return
    }
    for (const val of Object.values(obj)) walk(val)
  }

  walk(body.contents)
  return { list: list.slice(0, 20), hasValidContainer }
}
