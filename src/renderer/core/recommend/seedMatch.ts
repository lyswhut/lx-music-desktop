/**
 * 跨平台种子定位纯函数（平台相似推荐 4.1）。
 *
 * 语义：在目标平台的搜索结果中为起点歌曲定位「确认是同一录音/版本」的条目。
 * 与 sameSong 的宽松同曲判定不同——本模块是种子匹配规则，要求更严：
 * - 标题（含版本标记）归一化后必须一致：清洗后同名但版本标记不同（Live/DJ/伴奏/翻唱标注等）不算匹配；
 * - 起点主艺人（首个艺人 token）必须出现在候选艺人 token 中（大小写不敏感；
 *   起点艺人缺失时无匹配证据，直接无匹配，不取搜索第一条充数）；
 * - 时长（有数据时）用于甄别版本差异：全部候选与起点时长差超过容差 → 视为版本不符，无匹配；
 *   多个通过主门禁的候选按（专辑一致 > 时长最接近 > 搜索序）择优。
 * 本模块无 lx 运行时依赖，由 vitest 直接测试。
 */

import { SEED_MATCH_DURATION_TOLERANCE_SEC } from '@common/recommendationConfig'
import { simplify } from '@renderer/utils/simplify-chinese-main'
import { normalizeTitle as normalizeSeedTitle, normalizeText, normalizeArtistTokens, primaryArtistVariants, sameSong, type SongRef } from './sameSong'

export { normalizeSeedTitle, SEED_MATCH_DURATION_TOLERANCE_SEC }

/** 种子匹配的目标（起点歌曲）。 */
export interface SeedMatchTarget {
  artist: string
  title: string
  album?: string | null
  /** 起点时长（秒；未知为 null/undefined）。 */
  intervalSec?: number | null
}

/** 参与匹配的候选行（平台搜索结果行的最小投影；泛型保留原始行）。 */
export interface SeedMatchRowLike {
  artist: string
  title: string
  album?: string | null
  /** 候选时长（秒；SDK 行的 interval 为 "mm:ss" 字符串，先用 parseIntervalSec 转换）。 */
  intervalSec?: number | null
}

/** "mm:ss"（或 "h:mm:ss"）/数字时长 → 秒；无效返回 null。 */
export const parseIntervalSec = (interval?: string | number | null): number | null => {
  if (interval == null) return null
  if (typeof interval === 'number') return Number.isFinite(interval) && interval > 0 ? interval : null
  const text = String(interval).trim()
  if (/^\d+$/.test(text)) {
    const n = Number(text)
    return n > 0 ? n : null
  }
  const m = /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(text)
  if (!m) return null
  const seg1 = Number(m[1] ?? 0)
  const seg2 = Number(m[2] ?? 0)
  const seg3 = m[3] != null ? Number(m[3]) : null
  const seconds = seg3 != null ? seg1 * 3600 + seg2 * 60 + seg3 : seg1 * 60 + seg2
  return seconds > 0 ? seconds : null
}

/** 严格匹配可选项：simplifyChinese=true 时仅在比对期做繁简统一，用于 YTM ↔ 国内源跨平台桥接与种子匹配。 */
export interface SeedMatchOptions {
  simplifyChinese?: boolean
}

const normTitle = (title?: string | null, simplifyChinese = false): string => {
  const t = normalizeSeedTitle(title)
  return simplifyChinese ? simplify(t) : t
}

const normText = (text?: string | null, simplifyChinese = false): string => {
  const t = normalizeText(text)
  return simplifyChinese ? simplify(t) : t
}

const normArtistTokens = (artist?: string | null, simplifyChinese = false): string[] => {
  const tokens = normalizeArtistTokens(artist)
  return simplifyChinese ? [...new Set(tokens.map(simplify))] : tokens
}

const normPrimaryVariants = (artist?: string | null, simplifyChinese = false): string[] => {
  const variants = primaryArtistVariants(artist)
  return simplifyChinese ? [...new Set(variants.map(simplify))] : variants
}

/** 主门禁：标题（含版本标记）一致 + 起点主艺人（含括号别名变体）命中候选艺人 token。 */
const passesPrimaryGate = (target: SeedMatchTarget, row: SeedMatchRowLike, simplifyChinese = false): boolean => {
  if (normTitle(target.title, simplifyChinese) !== normTitle(row.title, simplifyChinese)) return false
  const primaryVariants = normPrimaryVariants(target.artist, simplifyChinese)
  if (!primaryVariants.length) return false
  const rowTokens = normArtistTokens(row.artist, simplifyChinese)
  if (!rowTokens.length) return false
  return rowTokens.some(token => primaryVariants.includes(token))
}

/**
 * 严格种子匹配：在平台搜索结果行中定位与起点「确认是同一录音/版本」的条目。
 * 返回命中的原始行（泛型透传），无可靠匹配返回 null。
 * 择优顺序：时长容差过滤 → 专辑一致优先 → 时长最接近 → 搜索序（先出现者）。
 */
export const matchSeed = <T extends SeedMatchRowLike>(target: SeedMatchTarget, rows: T[], options?: SeedMatchOptions): T | null => {
  const sc = options?.simplifyChinese === true
  const gated = rows.filter(row => passesPrimaryGate(target, row, sc))
  if (!gated.length) return null

  // 时长甄别（有起点时长数据时）：全部候选超容差 → 版本不符（如只剩 Live/DJ 版），无匹配
  const targetSec = parseIntervalSec(target.intervalSec)
  let candidates = gated
  if (targetSec != null) {
    const within = gated.filter(row => {
      const rowSec = parseIntervalSec(row.intervalSec)
      return rowSec != null && Math.abs(rowSec - targetSec) <= SEED_MATCH_DURATION_TOLERANCE_SEC
    })
    if (within.length) candidates = within
    else return null
  }

  const targetAlbum = normText(target.album, sc)
  const score = (row: SeedMatchRowLike): number => {
    const albumMatch = targetAlbum && normText(row.album, sc) === targetAlbum ? 0 : 1
    const rowSec = parseIntervalSec(row.intervalSec)
    const durationDelta = targetSec != null && rowSec != null ? Math.abs(rowSec - targetSec) : Number.MAX_SAFE_INTEGER
    return albumMatch * 1e9 + durationDelta
  }
  let best = candidates[0]
  let bestScore = Number.POSITIVE_INFINITY
  for (const row of candidates) {
    const s = score(row)
    if (s < bestScore) {
      best = row
      bestScore = s
    }
  }
  return best
}

/** 双向严格同录音判定：用于跨源换源/融合/锚点重放，避免宽松合作者交集放行不同录音（单侧缺失时长时不误杀）。 */
export const isStrictSameRecording = (a: SeedMatchTarget, b: SeedMatchTarget, options?: SeedMatchOptions): boolean => {
  const sc = options?.simplifyChinese === true
  if (!passesPrimaryGate(a, b, sc) || !passesPrimaryGate(b, a, sc)) return false
  const aSec = parseIntervalSec(a.intervalSec)
  const bSec = parseIntervalSec(b.intervalSec)
  if (aSec != null && bSec != null) {
    return Math.abs(aSec - bSec) <= SEED_MATCH_DURATION_TOLERANCE_SEC
  }
  return true
}

/** 繁简归一版同曲判定：供反馈互斥与当前曲目状态比对，避免繁简切换后状态失配。 */
export const sameSongSimplified = (a: SongRef, b: SongRef): boolean => {
  if (sameSong(a, b)) return true
  return sameSong(
    { artist: simplify(String(a.artist ?? '')), title: simplify(String(a.title ?? '')) },
    { artist: simplify(String(b.artist ?? '')), title: simplify(String(b.title ?? '')) },
  )
}
