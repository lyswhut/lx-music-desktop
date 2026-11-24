/**
 * YouTube Music 原始曲目 → 国内可播 MusicInfoOnline 严格桥接编排（纯逻辑，可注入搜索/时钟做单测）。
 *
 * 核心不变量：
 * 1. L1 类型隔离：只输出经严格 `matchSeed`（含繁简统一）验证的真实国内可播 `LX.Music.MusicInfoOnline`；
 * 2. 零额外请求重叠复用：先以本轮既有国内候选作 `matchSeed` 候选集（拒绝宽松 sameSong 合作者误投 RRF 票）；
 * 3. 预过滤返回淘汰分类计数，防止末页全被预过滤时丢失 `exhausted` / `empty-after-filter` 语义；
 * 4. 桥接缓存按 `(videoId, domesticProvider)` 独立存储，切换可播源立即可用且不受其他源负缓存遮蔽；
 * 5. 并发受控（<= YTM_BRIDGE_CONCURRENCY）+ 共享截止时间预算 + 取消即时中止在途搜索。
 */

import { YTM_BRIDGE_CONCURRENCY, YTM_BRIDGE_TARGET_EXTRA } from '@common/recommendationConfig'
import { normalizeArtistTokens, sameSong, type SongRef } from './sameSong'
import { isStrictSameRecording, matchSeed, parseIntervalSec } from './seedMatch'
import { songRefs, type SongIdentity } from './songIdentity'
import type { CachedSimilarItem, SimilarCandidateCache } from './similarCache'
import { simplifyForMatch, type RankedYtmTrack, type YtmRawTrack } from './ytmParser'

export const DOMESTIC_BRIDGE_PROVIDERS = ['wy', 'tx', 'kw', 'kg', 'mg'] as const
export type DomesticBridgeProvider = typeof DOMESTIC_BRIDGE_PROVIDERS[number]

export type BridgeFilterRule = 'anchor' | 'session' | 'queue' | 'loved' | 'disliked'

export type DomesticSearchPromise = Promise<LX.Music.MusicInfoOnline[]> & {
  cancel?: () => void
  cancelHttp?: () => void
}

export type DomesticSearchFn = (
  provider: DomesticBridgeProvider,
  keyword: string,
  timeoutMs: number,
  isCancelled: () => boolean,
  signal?: AbortSignal,
) => DomesticSearchPromise

export interface PlayableCandidateLike {
  id: string | null
  musicInfo?: LX.Music.MusicInfoOnline
  alternativeMusicInfos?: LX.Music.MusicInfoOnline[]
  sources: Array<{ provider: string, rank: number, musicInfo: LX.Music.MusicInfoOnline }>
}

/**
 * 提交前复核所有含 YTM 证据的候选实时播放能力（platformEngine 与 session 唯一共用实现）：
 * - 只要候选包含 `ytm` 票（含 `wy+ytm` 等跨源融合条目），即校验当前可播性；
 * - 主源不可播时按顺序晋升仍可播的备用国内源；全部源均不可播则剔除并计入 droppedForPlayback。
 */
export const verifyYtmPlaybackSupport = <T extends PlayableCandidateLike>(
  candidates: T[],
  canPlaySource?: (source: LX.Source) => boolean,
): { kept: T[], droppedForPlayback: number } => {
  if (!canPlaySource) return { kept: candidates, droppedForPlayback: 0 }
  const kept: T[] = []
  let droppedForPlayback = 0
  for (const item of candidates) {
    const hasYtmEvidence = item.sources.some(s => s.provider === 'ytm')
    if (!hasYtmEvidence) {
      kept.push(item)
      continue
    }
    const seen = new Set<LX.Music.MusicInfoOnline>()
    const allInfos: LX.Music.MusicInfoOnline[] = []
    const addInfo = (info?: LX.Music.MusicInfoOnline) => {
      if (!info || seen.has(info)) return
      seen.add(info)
      allInfos.push(info)
    }
    addInfo(item.musicInfo)
    for (const alt of item.alternativeMusicInfos ?? []) addInfo(alt)
    for (const src of item.sources) addInfo(src.musicInfo)
    const playable = allInfos.filter(info => canPlaySource(info.source))
    if (!playable.length) {
      droppedForPlayback++
      continue
    }
    kept.push({
      ...item,
      id: playable[0].id ?? item.id,
      musicInfo: playable[0],
      alternativeMusicInfos: playable.slice(1),
    })
  }
  return { kept, droppedForPlayback }
}

export interface BridgeYtmOptions {
  anchor: SongIdentity
  /** 本轮已拉回且满足当前播放能力的国内推荐候选（用于严格重叠复用，0 额外请求）。 */
  existingDomestic: LX.Music.MusicInfoOnline[]
  /** 可选动态读取最新已就绪国内候选（用于并行阶段迟到但未超时的国内结果零请求复用）。 */
  getExistingDomestic?: () => LX.Music.MusicInfoOnline[]
  /** 按当前播放能力筛选出的可播国内目标源（严禁空能力盲目回落）。 */
  playableTargets: DomesticBridgeProvider[]
  searchDomestic: DomesticSearchFn
  cache: SimilarCandidateCache
  excludeIds?: string[]
  excludeTracks?: SongIdentity[]
  queueTracks?: SongIdentity[]
  lovedTracks?: SongIdentity[]
  dislikedTracks?: SongIdentity[]
  isExcluded?: (musicInfo: LX.Music.MusicInfo) => boolean
  /** 期望桥接得到的最多条数（默认 maxItems + YTM_BRIDGE_TARGET_EXTRA）。 */
  targetCount: number
  /** 共享截止时间时间戳（毫秒）。 */
  deadlineAt: number
  now?: () => number
  isCancelled?: () => boolean
  /** 外部预算/取消信号：触发时立即中止在途国内桥接搜索。 */
  signal?: AbortSignal
}

export interface BridgeYtmResult {
  items: CachedSimilarItem[]
  /** 预过滤淘汰计数（需与融合后 filterFused 计数合并，保障 exhausted/empty-after-filter 分类准确）。 */
  prefiltered: Partial<Record<BridgeFilterRule, number>>
  /** 明确搜索后无法匹配的曲目数。 */
  unmatchedCount: number
  /** 明确搜索后未匹配的原始排名曲目（供并行国内源迟到收敛后做零请求重叠补匹配）。 */
  unmatchedTracks: RankedYtmTrack[]
  /** 所有待搜可播目标源均发生网络/传输失败的曲目数。 */
  bridgeErrorCount: number
  /** 最近一条桥接网络/传输错误信息。 */
  lastBridgeError: string | null
  /** 尚有未处理的页内尾部曲目（例如达到 targetCount 或预算耗尽提前停止）。 */
  hasUnprocessed: boolean
  /** 是否因共享预算耗尽提前停止。 */
  timedOut: boolean
}

const simplifiedRef = (ref: SongRef): SongRef => ({
  artist: simplifyForMatch(ref.artist),
  title: simplifyForMatch(ref.title),
})

const stripVersionMarkers = (title?: string | null): string => {
  return simplifyForMatch(title)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[（(][^（）()]*[)）]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const sameWorkSimplified = (a: SongRef, b: SongRef): boolean => {
  const sa = simplifiedRef(a)
  const sb = simplifiedRef(b)
  if (sameSong(sa, sb)) return true
  const ta = stripVersionMarkers(a.title)
  const tb = stripVersionMarkers(b.title)
  if (!ta || !tb || ta !== tb) return false
  const aTokens = normalizeArtistTokens(sa.artist)
  const bTokens = normalizeArtistTokens(sb.artist)
  if (!aTokens.length || !bTokens.length) return false
  return aTokens.some(t => bTokens.includes(t))
}

const sameSongSimplifiedIn = (list: SongIdentity[] | undefined, track: YtmRawTrack): boolean => {
  if (!list?.length) return false
  const target = simplifiedRef({ artist: track.artist, title: track.title })
  return list.some(item => songRefs(item).some(ref => sameSong(simplifiedRef(ref), target)))
}

const primaryArtistForSearch = (artist?: string | null): string => {
  return String(artist ?? '').split(/[,、，/&;；|]+/)[0]?.trim() ?? ''
}

export const matchYtmToInfos = (track: YtmRawTrack, infos: LX.Music.MusicInfoOnline[]): LX.Music.MusicInfoOnline | null => {
  if (!infos.length) return null
  const target = {
    artist: track.artist,
    title: track.title,
    album: track.album,
    intervalSec: track.intervalSec,
  }
  // 双向主艺人+版本门禁：防止 YTM 独唱 "A" 单向误匹配国内合唱 "B、A"
  const strictRows = infos
    .map(info => ({
      artist: info.singer,
      title: info.name,
      album: info.meta?.albumName ?? '',
      intervalSec: parseIntervalSec(info.interval),
      info,
    }))
    .filter(row => isStrictSameRecording(target, row, { simplifyChinese: true }))
  if (!strictRows.length) return null
  const matched = matchSeed(target, strictRows, { simplifyChinese: true })
  return matched ? matched.info : null
}

/** 预过滤单条 YTM 原始曲目，返回命中淘汰规则（未淘汰返回 null）。 */
const checkPrefilter = (
  track: YtmRawTrack,
  anchorRefs: Array<SongRef & { id?: string | null }>,
  options: BridgeYtmOptions,
): BridgeFilterRule | null => {
  const trackRef: SongRef = { artist: track.artist, title: track.title }
  if (anchorRefs.some(anchorRef => sameWorkSimplified(trackRef, anchorRef))) return 'anchor'
  if (sameSongSimplifiedIn(options.excludeTracks, track)) return 'session'
  if (sameSongSimplifiedIn(options.queueTracks, track)) return 'queue'
  if (sameSongSimplifiedIn(options.lovedTracks, track)) return 'loved'
  if (sameSongSimplifiedIn(options.dislikedTracks, track)) return 'disliked'
  return null
}

type ResolveOutcome =
  | { status: 'matched', musicInfo: LX.Music.MusicInfoOnline }
  | { status: 'no-match' }
  | { status: 'error', error: string }
  | { status: 'budget-exhausted' }
  | { status: 'aborted' }

const ABORT_SENTINEL = Symbol('ytm-bridge-abort')

const resolveSingleTrack = async(
  track: YtmRawTrack,
  options: BridgeYtmOptions,
  getNow: () => number,
  isStopped: () => boolean,
  signal: AbortSignal,
  donePromise: Promise<void>,
  activeCancels: Set<() => void>,
): Promise<ResolveOutcome> => {
  const { playableTargets, cache, searchDomestic, deadlineAt } = options
  // 1) 先查所有当前可播目标源的桥接缓存：命中正缓存直接返回（0 网络请求）
  const uncachedTargets: DomesticBridgeProvider[] = []
  for (const provider of playableTargets) {
    const cached = cache.getBridge(track.videoId, provider)
    if (cached.hit) {
      if (cached.musicInfo) return { status: 'matched', musicInfo: cached.musicInfo }
      continue
    }
    uncachedTargets.push(provider)
  }
  if (!uncachedTargets.length) return { status: 'no-match' }
  const artist = primaryArtistForSearch(simplifyForMatch(track.artist))
  const title = simplifyForMatch(track.title).trim()
  if (!title || !artist) return { status: 'no-match' }

  const keyword = `${title} ${artist}`
  let hadError = false
  let lastError = ''
  let hitBudgetLimit = false

  for (const provider of uncachedTargets) {
    if (isStopped()) return { status: 'aborted' }
    const remaining = deadlineAt - getNow()
    if (remaining <= 200) {
      hitBudgetLimit = true
      break
    }
    let cancelHandle: (() => void) | null = null
    try {
      const req = searchDomestic(provider, keyword, remaining, isStopped, signal)
      // 防止取消后慢请求延迟 reject 触发 UnhandledRejection
      req.catch(() => {})
      let handleCancelled = false
      cancelHandle = () => {
        if (handleCancelled) return
        handleCancelled = true
        try {
          if (req.cancel) req.cancel()
          else req.cancelHttp?.()
        } catch {}
      }
      activeCancels.add(cancelHandle)
      const raced = await Promise.race([
        req,
        donePromise.then(() => ABORT_SENTINEL),
      ])
      if (typeof raced === 'symbol' || isStopped()) {
        cancelHandle()
        return { status: 'aborted' }
      }
      const matched = matchYtmToInfos(track, raced)
      // 仅在搜索成功返回且未取消时写正/负缓存；异常或取消绝不写缓存
      cache.setBridge(track.videoId, provider, matched)
      if (matched) return { status: 'matched', musicInfo: matched }
    } catch (err) {
      // 单目标源搜索失败不写负缓存，继续尝试下一个可播目标源
      if (isStopped()) return { status: 'aborted' }
      hadError = true
      lastError = (err as Error)?.message ?? String(err)
    } finally {
      if (cancelHandle) activeCancels.delete(cancelHandle)
    }
  }
  if (hitBudgetLimit) return { status: 'budget-exhausted' }
  if (hadError) return { status: 'error', error: lastError || '国内桥接搜索失败' }
  return { status: 'no-match' }
}

/**
 * 将一页（或多页合并后的）YTM 原始排名曲目桥接为国内可播 `CachedSimilarItem[]`：
 * - 先严格匹配本轮既有国内候选（0 额外请求，且保留 YTM 原始排名）；
 * - 其余曲目预过滤（并精确累计淘汰原因）后，按并发 ≤3、槽位预留防超额、共享截止时间、达标即时取消收束。
 */
export const bridgeYtmTracks = async(
  rankedTracks: RankedYtmTrack[],
  options: BridgeYtmOptions,
): Promise<BridgeYtmResult> => {
  const getNow = options.now ?? (() => Date.now())
  const isTimedOut = (): boolean => getNow() >= options.deadlineAt
  const isAborted = (): boolean => Boolean(options.isCancelled?.()) || Boolean(options.signal?.aborted) || isTimedOut()

  const prefiltered: Partial<Record<BridgeFilterRule, number>> = {}
  const bump = (rule: BridgeFilterRule) => { prefiltered[rule] = (prefiltered[rule] ?? 0) + 1 }

  const anchorRefs = songRefs(options.anchor)
  const excludeIdSet = new Set((options.excludeIds ?? []).map(id => String(id)))
  const playableSet = new Set<string>(options.playableTargets)
  const getEligibleDomestic = (): LX.Music.MusicInfoOnline[] => {
    const source = options.getExistingDomestic ? options.getExistingDomestic() : options.existingDomestic
    return source.filter(info => playableSet.has(info.source))
  }
  const initialDomestic = getEligibleDomestic()
  const targetCount = Math.max(1, options.targetCount || (8 + YTM_BRIDGE_TARGET_EXTRA))

  const resolved: CachedSimilarItem[] = []
  const toResolve: RankedYtmTrack[] = []
  const unmatchedTracks: RankedYtmTrack[] = []
  let unmatchedCount = 0
  let bridgeErrorCount = 0
  let lastBridgeError: string | null = null
  let budgetExhausted = Boolean(options.signal?.aborted) && !options.isCancelled?.()
  let abortedInFlight = false

  for (const entry of rankedTracks) {
    // 1) 严格重叠复用：在既有国内候选中找严格同录音（不预过滤，交由后续 filterFused 统一统计，保证与国内候选口径一致）
    const overlap = matchYtmToInfos(entry.track, initialDomestic)
    if (overlap) {
      resolved.push({ musicInfo: overlap, rank: entry.rank })
      continue
    }
    // 2) 预过滤明显不入队的 YTM 独有曲目（保留淘汰分类计数）
    const killedBy = checkPrefilter(entry.track, anchorRefs, options)
    if (killedBy) {
      bump(killedBy)
      continue
    }
    toResolve.push(entry)
  }

  let cursor = 0
  let resolvedUniqueCount = 0
  // 对本轮重用命中但未在排除集里的计数，与独有解析共同计入 targetCount 避免过度搜索
  const usableOverlapCount = resolved.filter(item => {
    if (item.musicInfo.id != null && excludeIdSet.has(String(item.musicInfo.id))) return false
    if (options.isExcluded?.(item.musicInfo)) return false
    const killedBy = checkPrefilter(
      {
        videoId: item.musicInfo.id,
        title: item.musicInfo.name,
        artist: item.musicInfo.singer,
        album: item.musicInfo.meta?.albumName ?? '',
        intervalSec: parseIntervalSec(item.musicInfo.interval),
        picUrl: null,
      },
      anchorRefs,
      options,
    )
    return killedBy == null
  }).length
  const neededUnique = Math.max(0, targetCount - usableOverlapCount)

  const bridgeController = new AbortController()
  const activeCancels = new Set<() => void>()
  const activeIndices = new Set<number>()
  let resolveDone!: () => void
  const donePromise = new Promise<void>(resolve => { resolveDone = resolve })
  const slotWaiters = new Set<() => void>()

  const notifySlots = () => {
    for (const wake of slotWaiters) wake()
    slotWaiters.clear()
  }

  const waitForSlot = async(): Promise<void> => new Promise<void>(resolve => {
    slotWaiters.add(resolve)
  })

  const stopBridge = () => {
    if (!bridgeController.signal.aborted) {
      bridgeController.abort()
      for (const fn of activeCancels) {
        try { fn() } catch {}
      }
      activeCancels.clear()
      resolveDone()
    }
    notifySlots()
  }

  const isStopped = (): boolean => isAborted() || bridgeController.signal.aborted || resolvedUniqueCount >= neededUnique

  const worker = async() => {
    while (!isStopped()) {
      if (resolvedUniqueCount >= neededUnique) {
        stopBridge()
        return
      }
      const availableSlots = neededUnique - resolvedUniqueCount - activeIndices.size
      if (availableSlots <= 0) {
        if (activeIndices.size === 0) return
        await waitForSlot()
        continue
      }
      const index = cursor++
      if (index >= toResolve.length) {
        notifySlots()
        return
      }
      activeIndices.add(index)
      const entry = toResolve[index]
      let outcome: ResolveOutcome
      try {
        // 复查动态到达的国内重叠候选（0 网络开销）
        const lateOverlap = options.getExistingDomestic
          ? matchYtmToInfos(entry.track, getEligibleDomestic())
          : null
        if (lateOverlap) {
          outcome = { status: 'matched', musicInfo: lateOverlap }
        } else {
          outcome = await resolveSingleTrack(
            entry.track,
            options,
            getNow,
            isStopped,
            bridgeController.signal,
            donePromise,
            activeCancels,
          )
        }
      } finally {
        activeIndices.delete(index)
      }

      if (outcome.status === 'aborted') {
        if (resolvedUniqueCount < neededUnique) abortedInFlight = true
        notifySlots()
        return
      }
      if (outcome.status === 'budget-exhausted') {
        budgetExhausted = true
        stopBridge()
        return
      }
      if (outcome.status === 'error') {
        bridgeErrorCount++
        lastBridgeError = outcome.error
        notifySlots()
        continue
      }
      if (outcome.status === 'no-match') {
        unmatchedCount++
        unmatchedTracks.push(entry)
        notifySlots()
        continue
      }
      const matched = outcome.musicInfo
      if (matched.id != null && excludeIdSet.has(String(matched.id))) {
        bump('session')
        notifySlots()
        continue
      }
      if (options.isExcluded?.(matched)) {
        bump('disliked')
        notifySlots()
        continue
      }
      if (resolvedUniqueCount < neededUnique) {
        resolved.push({ musicInfo: matched, rank: entry.rank })
        resolvedUniqueCount++
        if (resolvedUniqueCount >= neededUnique) {
          stopBridge()
          return
        }
      }
      notifySlots()
    }
  }

  // 若未注入自定义时钟且使用系统时钟/虚拟时钟，到达 deadlineAt 自动取消在途请求；同时响应外部 budgetSignal
  let deadlineTimer: ReturnType<typeof setTimeout> | null = null
  const externalSignal = options.signal
  const onExternalAbort = () => {
    if (!options.isCancelled?.()) budgetExhausted = true
    stopBridge()
  }
  if (neededUnique > 0 && toResolve.length > 0 && options.playableTargets.length > 0 && !isAborted()) {
    const initialRemaining = options.deadlineAt - getNow()
    if (options.now == null && initialRemaining > 0) {
      deadlineTimer = setTimeout(() => {
        budgetExhausted = true
        stopBridge()
      }, initialRemaining)
    }
    if (externalSignal) externalSignal.addEventListener('abort', onExternalAbort, { once: true })
    try {
      const concurrency = Math.min(YTM_BRIDGE_CONCURRENCY, toResolve.length, neededUnique)
      await Promise.all(Array.from({ length: concurrency }, async() => worker()))
    } finally {
      if (deadlineTimer != null) clearTimeout(deadlineTimer)
      if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort)
    }
  }

  resolved.sort((a, b) => a.rank - b.rank)
  const timedOut = isTimedOut() || budgetExhausted
  const hasUnprocessed = cursor < toResolve.length || abortedInFlight || budgetExhausted
  return {
    items: resolved,
    prefiltered,
    unmatchedCount,
    unmatchedTracks,
    bridgeErrorCount,
    lastBridgeError,
    hasUnprocessed,
    timedOut,
  }
}
