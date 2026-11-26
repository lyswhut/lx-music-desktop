/**
 * 平台相似召回编排（平台相似推荐 4.1–4.6 + YouTube Music InnerTube 三源融合）。
 *
 * 职责：
 * - 统一适配器边界：每个平台独立「种子定位 → 相似调用 → 归一化」，可区分
 *   成功/空结果/无匹配/地区受限/无可用国内播放源/限流或失败/已取消；单源失败不影响其他源；
 * - 种子定位：优先使用起点已有的原生平台标识；其他来源按歌手+歌名搜索后经 seedMatch 严格匹配，
 *   找不到可靠匹配跳过该平台，不取搜索第一条充数；
 * - YouTube Music：与国内源并行拉取 `RDAMVM<videoId>` Radio + 按需 `continuation` 分页（≤5 页）
 *   + Related 补充；共享单次截止时间预算（YTM_TOTAL_BUDGET_MS），严禁拖慢国内结果；
 *   桥接阶段优先零请求严格复用既有国内候选，其余经繁简归一 + 严格 matchSeed 懒桥接到当前可播国内源；
 * - 有限超时 + 单层重试（国内相似调用重试一次；种子搜索复用 SDK 既有内部重试，本层不叠加）；
 * - 缓存：国内按平台+种子 id 缓存归一化结果；YTM 按 seedId+proxyContext 缓存整页原始元数据与安全游标，
 *   按 (videoId, domesticProvider) 独立缓存桥接结果，按 proxyContext 缓存区域可达性；失败/取消不写缓存；
 * - 融合与过滤：similarFusion 确定性合并排名 → 排除（起点/会话已消费/当前队列/红心/不再推荐）
 *   → 艺人多样性 → 画像有界调整；输出可区分的整体状态
 *   （ok / all-failed / no-match / empty / empty-after-filter / exhausted / no-playable-source / cancelled）。
 */

import {
  SIMILAR_REQUEST_TIMEOUT_MS,
  SIMILAR_SEED_SEARCH_TIMEOUT_MS,
  YTM_BRIDGE_TARGET_EXTRA,
  YTM_MAX_PAGES,
  YTM_REQUEST_TIMEOUT_MS,
  YTM_TOTAL_BUDGET_MS,
} from '@common/recommendationConfig'
import { toNewMusicInfo } from '@renderer/utils'
import musicSdk from '@renderer/utils/musicSdk'
import { MusicSdkResponseError } from '@renderer/utils/musicSdk/responseError'
import { toLegacyYtmSong } from '@renderer/utils/musicSdk/ytm/parser'
import { sharedYtmRegionCache } from '@renderer/utils/musicSdk/ytm/regionCache'
import { normalizeArtistTokens, sameSong } from './sameSong'
import type { SongRef } from './sameSong'
import { musicInfosOf, sameIdentity, songRefs, type SongIdentity } from './songIdentity'
import { parseIntervalSec, matchSeed } from './seedMatch'
import { applyArtistDiversity, applyProfileAdjustment, fuseSimilarCandidates, PROVIDER_ORDER } from './similarFusion'
import type { FusedCandidate, ProviderBatch, SimilarProviderId } from './similarFusion'
import { SimilarCandidateCache } from './similarCache'
import type { CachedSimilarItem, YtmPageCacheEntry } from './similarCache'
import type { YtmAdapter } from './ytmAdapter'
import {
  bridgeYtmTracks,
  matchYtmToInfos,
  type BridgeFilterRule,
  type DomesticBridgeProvider,
  type DomesticSearchFn,
  type DomesticSearchPromise,
} from './ytmBridge'
import { isYtmRegionBlockedError, simplifyForMatch, type RankedYtmTrack, type YtmRawTrack } from './ytmParser'

/** 平台相似召回的起点（携带原生平台标识，避免解析全局 id 字符串猜测平台字段）。 */
export interface PlatformRecallAnchor extends SongIdentity {
  artist: string
  title: string
  album?: string | null
  /** 起点时长（秒；未知为 null）。 */
  intervalSec?: number | null
  /** 起点歌曲 id（排除起点自身用）。 */
  id?: string | null
  /** 起点音乐来源（'wy' | 'tx' | 其他）。 */
  source?: string | null
  /** 起点在各平台的原生歌曲 id（当前歌曲来自该平台时可直接使用，免搜索定位）。 */
  seedIds?: { wy?: string, tx?: string, ytm?: string } | null
}

/** 单平台调用状态（可区分成功/空结果/无匹配/地区受限/无可用国内源/错误/已取消）。 */
export type ProviderCallStatus =
  | 'success'
  | 'empty'
  | 'no-match'
  | 'region-blocked'
  | 'no-playable-source'
  | 'error'
  | 'cancelled'

/** 单平台调用结果。 */
export interface ProviderCallResult {
  provider: SimilarProviderId
  status: ProviderCallStatus
  /** 定位到的种子原生 id（未定位为 null）。 */
  seedId: string | null
  /** 是否命中缓存（未发网络请求）。 */
  fromCache: boolean
  items: CachedSimilarItem[]
  error?: string
}

/** 整体召回状态（全部失败/无匹配/空结果/过滤完/用尽/无可用国内播放源 可区分）。 */
export type PlatformRecallState =
  | 'ok'
  | 'all-failed'
  | 'no-match'
  | 'empty'
  | 'empty-after-filter'
  | 'exhausted'
  | 'no-playable-source'
  | 'cancelled'

/** 召回选项。 */
export interface PlatformRecallOptions {
  isCancelled?: () => boolean
  /** 本轮启用的推荐提供方列表（未传时：注入 ytmAdapter 则三源，否则默认 wy+tx 保持向后兼容）。 */
  enabledProviders?: SimilarProviderId[]
  /** YouTube Music 网络适配器（启用 ytm 时由运行时/测试注入）。 */
  ytmAdapter?: YtmAdapter
  /** 规范化 YTM 有效代理上下文键（用于隔离分页/种子/区域可达性缓存）。 */
  ytmProxyContext?: string
  /** 当前经 assertPlaybackSupport 筛选出的可播国内桥接源（严禁空能力盲目回落）。 */
  playableTargets?: DomesticBridgeProvider[]
  /** 是否允许未桥接至国内源（或无国内可播源）的 YTM 原始曲目直接以原生 YTM 身份进入推荐队列。 */
  allowDirectYtmPlayback?: boolean
  /** 会话已推荐/已消费的候选 id（同 id 通道）。 */
  excludeIds?: string[]
  /** 会话已推荐/已消费的曲目（同曲通道，防同曲不同 id 变体）。 */
  excludeTracks?: SongIdentity[]
  /** 当前稍后播放队列中的曲目（避免重复插入用户手动排队的内容）。 */
  queueTracks?: SongIdentity[]
  /** 红心歌（保持现有发现新歌语义，硬排除）。 */
  lovedTracks?: SongIdentity[]
  /** 明确「不再推荐」的曲目。 */
  dislikedTracks?: SongIdentity[]
  /** 应用级屏蔽规则；在多样性与批次裁剪前执行，屏蔽项不占配额。 */
  isExcluded?: (musicInfo: LX.Music.MusicInfo) => boolean
  /** 本地画像艺人加成（有界次级调整）。 */
  profileBoost?: (artist: string) => number
  /** 单批最多入队数（默认 8）。 */
  maxItems?: number
  /** 缓存实例（默认模块级单例；测试可注入）。 */
  cache?: SimilarCandidateCache
  /** 可注入时钟（测试预算超时用）。 */
  now?: () => number
}

/** 召回结果。 */
export interface PlatformRecallResult {
  state: PlatformRecallState
  items: FusedCandidate[]
  providers: Array<Pick<ProviderCallResult, 'provider' | 'status' | 'seedId' | 'fromCache' | 'error'>>
  error: string | null
}

/** 模块级缓存单例（TTL/容量由 recommendationConfig 集中配置；YTM 地区状态与搜索/歌单 SDK 共用同一 TTL 缓存）。 */
const similarCache = new SimilarCandidateCache(
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  sharedYtmRegionCache,
)

/** 可取消 Promise：平台 SDK 适配器将底层 httpFetch.cancelHttp 暴露到此边界。 */
type CancellablePromise<T> = Promise<T> & {
  cancel?: () => void
  cancelHttp?: () => void
}

const cancelRequest = <T>(request: CancellablePromise<T>): void => {
  try {
    if (request.cancel) request.cancel()
    else request.cancelHttp?.()
  } catch {}
}

/** 有限超时包装：超时、会话取消与 AbortSignal 均即时终止底层请求，不留下后台重试或未捕获 reject。 */
const withTimeout = async <T>(
  request: CancellablePromise<T>,
  timeoutMs: number,
  isCancelled?: () => boolean,
  signal?: AbortSignal,
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let cancelTimer: ReturnType<typeof setInterval> | null = null
    const safeTimeout = Math.max(1, timeoutMs)
    const onSignalAbort = () => {
      finishReject(new Error('推荐计划已取消'), true)
    }
    const cleanup = () => {
      if (timer != null) clearTimeout(timer)
      if (cancelTimer != null) clearInterval(cancelTimer)
      if (signal) signal.removeEventListener('abort', onSignalAbort)
    }
    const finishResolve = (value: T) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(value)
    }
    const finishReject = (err: unknown, abort = false) => {
      if (settled) return
      settled = true
      cleanup()
      if (abort) cancelRequest(request)
      reject(err)
    }
    // 先挂载 rejection handler，再检查即时取消/abort，防止取消后底层 request reject 触发 UnhandledPromiseRejection
    request.then(finishResolve, finishReject)
    if (signal?.aborted === true || isCancelled?.() === true) {
      finishReject(new Error('推荐计划已取消'), true)
      return
    }
    timer = setTimeout(() => {
      finishReject(new Error(`请求超时(${safeTimeout}ms)`), true)
    }, safeTimeout)
    if (signal) {
      signal.addEventListener('abort', onSignalAbort, { once: true })
    }
    if (isCancelled) {
      cancelTimer = setInterval(() => {
        if (isCancelled()) finishReject(new Error('推荐计划已取消'), true)
      }, 50)
    }
  })
}

/** 原始条目是否具备可交给播放器的音乐标识（与 recall.rawHasId 同口径）。 */
const rawHasId = (raw: Record<string, any>): boolean => {
  return Boolean(raw && (raw.songmid || raw.hash || raw.copyrightId || raw.strMediaMid))
}

/** musicSdk 的最小类型投影（JS 模块推断类型不稳定，统一经此收窄为 any 边界）。 */
type SimilarSdk = Record<string, {
  simiSong?: { getSimiSong: (songId: string) => CancellablePromise<any> }
  musicSearch?: { search: (str: string, page: number, limit: number) => CancellablePromise<any> }
}>
const similarSdk = musicSdk as unknown as SimilarSdk

/** 主艺人（首个艺人 token）。 */
export const primaryArtist = (artist?: string | null): string => {
  return String(artist ?? '').split(/[,、，/&;；|]+/)[0]?.trim() ?? ''
}

type DomesticSimilarProvider = 'wy' | 'tx'

const TX_SEED_SEARCH_MAX_RETRIES = 2
const TX_SEED_RETRY_MIN_BUDGET_MS = 2_500
const TRANSIENT_RESET_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'EAI_AGAIN'])

const isRetryableTxSeedSearchError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false
  if (err instanceof MusicSdkResponseError) return false
  const e = err as Error & { code?: string, isTimeout?: boolean, isReset?: boolean, bodyCode?: number, reqCode?: number }
  if (e.isTimeout === true || e.code === 'ETIMEDOUT' || e.code === 'ESOCKETTIMEDOUT') return false
  if (/cancel|取消|超时|timeout/i.test(String(e.message ?? ''))) return false
  if (e.isReset === true || (typeof e.code === 'string' && TRANSIENT_RESET_CODES.has(e.code))) return true
  if (typeof e.bodyCode === 'number' || typeof e.reqCode === 'number') return true
  return String(e.message ?? '').includes('搜索失败')
}

/** 绑定取消信号与会话取消检查的退避等待：取消时立即清理定时器并 reject，不悬空挂起。 */
const waitCancellableBackoff = async(
  delayMs: number,
  isCancelled?: () => boolean,
  signal?: AbortSignal,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted === true || isCancelled?.() === true) {
      reject(new Error('推荐计划已取消'))
      return
    }
    let settled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    const cleanup = () => {
      if (timer != null) clearTimeout(timer)
      if (pollTimer != null) clearInterval(pollTimer)
      if (signal) signal.removeEventListener('abort', onAbort)
    }
    const finish = (err?: Error) => {
      if (settled) return
      settled = true
      cleanup()
      if (err) reject(err)
      else resolve()
    }
    const onAbort = () => { finish(new Error('推荐计划已取消')) }
    if (signal) signal.addEventListener('abort', onAbort, { once: true })
    if (isCancelled) {
      pollTimer = setInterval(() => {
        if (isCancelled()) finish(new Error('推荐计划已取消'))
      }, 50)
    }
    timer = setTimeout(() => { finish() }, Math.max(0, delayMs))
  })
}

/** 种子定位（国内源 wy/tx）：原生标识优先；否则繁简统一后平台搜索 + 严格匹配（tx 对偶发风控/连接重置执行预算感知有限重试）。 */
const locateSeed = async(
  provider: DomesticSimilarProvider,
  anchor: PlatformRecallAnchor,
  isCancelled?: () => boolean,
  getRemainingBudgetMs?: () => number,
  budgetSignal?: AbortSignal,
  getNow: () => number = () => Date.now(),
): Promise<{ seedId: string | null, error?: string }> => {
  const native = anchor.seedIds?.[provider]
  if (native) return { seedId: String(native) }
  const cleanTitle = simplifyForMatch(String(anchor.title ?? '').trim()).trim()
  const cleanArtist = simplifyForMatch(primaryArtist(anchor.artist)).trim()
  if (!cleanTitle || !cleanArtist) return { seedId: null }

  const keyword = `${cleanTitle} ${cleanArtist}`
  const maxRetries = provider === 'tx' ? TX_SEED_SEARCH_MAX_RETRIES : 0
  // 即使未启用 YTM 共享预算，单次 locateSeed 内多次尝试也共享同一总截止时间，防止每次重试重获满额 10s
  const localDeadline = getNow() + SIMILAR_SEED_SEARCH_TIMEOUT_MS
  const remainingBudget = (): number => (
    getRemainingBudgetMs ? getRemainingBudgetMs() : Math.max(0, localDeadline - getNow())
  )
  const isBudgetAborted = (): boolean => budgetSignal?.aborted === true
  let result: any

  for (let attempt = 0; ; attempt++) {
    const rem = remainingBudget()
    if (isBudgetAborted() || rem <= 200) {
      return { seedId: null, error: 'seed-search: 请求超时' }
    }
    const reqTimeout = Math.min(SIMILAR_SEED_SEARCH_TIMEOUT_MS, Math.max(1, rem))
    try {
      // wy SDK 内部已有有限重试（≤3）；tx SDK 保持单次快失败，由本层在预算允许时对偶发风控/重置做 ≤2 次重试
      result = await withTimeout(
        similarSdk[provider].musicSearch!.search(keyword, 1, 30),
        reqTimeout,
        isCancelled,
        budgetSignal,
      )
      break
    } catch (err) {
      if (isCancelled?.()) return { seedId: null }
      if (isBudgetAborted() || remainingBudget() <= 0) {
        return { seedId: null, error: 'seed-search: 请求超时' }
      }
      const backoffMs = 200 * (attempt + 1)
      const remBeforeBackoff = remainingBudget()
      const canRetry = attempt < maxRetries &&
        isRetryableTxSeedSearchError(err) &&
        (remBeforeBackoff - backoffMs) >= TX_SEED_RETRY_MIN_BUDGET_MS
      if (!canRetry) {
        return { seedId: null, error: `seed-search: ${(err as Error).message}` }
      }
      try {
        await waitCancellableBackoff(backoffMs, isCancelled, budgetSignal)
      } catch {
        if (isCancelled?.()) return { seedId: null }
        return { seedId: null, error: 'seed-search: 请求超时' }
      }
      // 退避结束后再次核对剩余预算，确保实际发包前仍满足最低预算门槛
      if (isCancelled?.()) return { seedId: null }
      if (isBudgetAborted() || remainingBudget() < TX_SEED_RETRY_MIN_BUDGET_MS) {
        return { seedId: null, error: `seed-search: ${(err as Error).message}` }
      }
    }
  }
  if (isCancelled?.()) return { seedId: null }
  if (isBudgetAborted() || remainingBudget() <= 0) {
    return { seedId: null, error: 'seed-search: 请求超时' }
  }
  const rows: any[] = Array.isArray(result?.list) ? result.list : []
  const matched = matchSeed(
    {
      artist: anchor.artist,
      title: anchor.title,
      album: anchor.album,
      intervalSec: anchor.intervalSec,
    },
    rows.map(r => ({
      artist: r.singer,
      title: r.name,
      album: r.albumName,
      intervalSec: parseIntervalSec(r.interval),
      raw: r,
    })),
    { simplifyChinese: true },
  )
  if (!matched) return { seedId: null }
  const raw = (matched as unknown as { raw: Record<string, any> }).raw
  const seedId = provider === 'tx' ? raw.songId : raw.songmid
  return seedId ? { seedId: String(seedId) } : { seedId: null }
}

/** 相似调用（国内源 wy/tx）：有限超时 + 单层重试（仅本层重试一次；失败/限流/取消不写缓存）。 */
const callSimilar = async(
  provider: DomesticSimilarProvider,
  seedId: string,
  isCancelled?: () => boolean,
  getRemainingBudgetMs?: () => number,
  budgetSignal?: AbortSignal,
): Promise<{ status: ProviderCallStatus, items: CachedSimilarItem[], error?: string }> => {
  let attempt = 0
  // 单层重试：最多 2 次尝试（首次 + 1 次重试）；若处于共享预算模式且剩余预算不足 2.5s 则不再发起二次重试
  for (;;) {
    const rem = getRemainingBudgetMs ? getRemainingBudgetMs() : SIMILAR_REQUEST_TIMEOUT_MS
    if (getRemainingBudgetMs && (budgetSignal?.aborted === true || rem <= 200)) {
      return { status: 'error', items: [], error: '请求超时' }
    }
    const reqTimeout = Math.min(SIMILAR_REQUEST_TIMEOUT_MS, Math.max(1, rem))
    try {
      const result = await withTimeout(
        similarSdk[provider].simiSong!.getSimiSong(seedId),
        reqTimeout,
        isCancelled,
        budgetSignal,
      )
      if (isCancelled?.()) return { status: 'cancelled', items: [] }
      if (budgetSignal?.aborted === true || (getRemainingBudgetMs && getRemainingBudgetMs() <= 0)) return { status: 'error', items: [], error: '请求超时' }
      const list: any[] = Array.isArray(result?.list) ? result.list : []
      const items = list.filter(rawHasId).map((raw, index) => ({
        musicInfo: toNewMusicInfo(raw),
        rank: index + 1,
      }))
      return { status: items.length ? 'success' : 'empty', items }
    } catch (err) {
      if (isCancelled?.()) return { status: 'cancelled', items: [] }
      if (budgetSignal?.aborted === true || (getRemainingBudgetMs && getRemainingBudgetMs() <= 0)) return { status: 'error', items: [], error: '请求超时' }
      if (++attempt > 1) return { status: 'error', items: [], error: (err as Error).message }
      if (getRemainingBudgetMs && getRemainingBudgetMs() < 2500) {
        return { status: 'error', items: [], error: (err as Error).message }
      }
    }
  }
}

/** 国内源单通道执行。 */
const runDomesticProvider = async(
  provider: DomesticSimilarProvider,
  anchor: PlatformRecallAnchor,
  anchorKey: string,
  cache: SimilarCandidateCache,
  isCancelled?: () => boolean,
  getRemainingBudgetMs?: () => number,
  budgetSignal?: AbortSignal,
  getNow: () => number = () => Date.now(),
): Promise<ProviderCallResult> => {
  const base = { provider, seedId: null as string | null, fromCache: false }
  const cancelCheck = (): boolean => Boolean(isCancelled?.())
  if (cancelCheck()) return { ...base, status: 'cancelled', items: [] }

  const knownSeed = anchor.seedIds?.[provider] ?? cache.getSeed(provider, anchorKey)
  const located = knownSeed ? { seedId: knownSeed } : await locateSeed(provider, anchor, isCancelled, getRemainingBudgetMs, budgetSignal, getNow)
  if (cancelCheck()) return { ...base, status: 'cancelled', items: [] }
  if (!located.seedId) {
    return {
      ...base,
      status: located.error ? 'error' : 'no-match',
      items: [],
      ...(located.error ? { error: located.error } : {}),
    }
  }
  const seedId = located.seedId
  if (!knownSeed) cache.setSeed(provider, anchorKey, seedId)

  // 续补先消费缓存（会话排除/偏好/队列过滤在缓存读取后由 filterFused 重新执行）
  const cached = cache.get(provider, seedId)
  if (cached) {
    return {
      provider,
      seedId,
      fromCache: true,
      status: cached.items.length ? 'success' : 'empty',
      items: cached.items,
    }
  }

  const called = await callSimilar(provider, seedId, isCancelled, getRemainingBudgetMs, budgetSignal)
  if (called.status === 'success' || called.status === 'empty') {
    // 只缓存真实成功结果（含平台真实返回的空列表）；失败/限流/取消不写缓存
    cache.set(provider, seedId, called.items)
  }
  return { provider, seedId, fromCache: false, ...called }
}

/** 过滤规则标识（用于整体状态分类：会话消费 vs 其他过滤）。 */
type FilterRule = 'anchor' | 'session' | 'queue' | 'loved' | 'disliked' | 'diversity'

const sameSongIn = (list: SongIdentity[] | undefined, ref: SongIdentity): boolean => {
  return (list ?? []).some(item => sameIdentity(item, ref))
}

/** 标题去掉括号版本标记（(Live)/(DJ版)/(伴奏) 等）后的作品名。 */
const stripVersionMarkers = (title?: string | null): string => {
  return String(title ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[（(][^（）()]*[)）]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * 同一作品判定（起点排除专用，比 sameSong 宽一档）：
 * 去版本标记后的标题一致 + 艺人 token 有交集 → 视为起点同作品变体，不入候选
 * （推荐当前歌曲的 Live/DJ 版没有意义）；不同艺人的翻唱不算同一作品。
 */
const sameWork = (a: SongRef, b: SongRef): boolean => {
  if (sameSong(a, b)) return true
  const ta = stripVersionMarkers(a.title)
  const tb = stripVersionMarkers(b.title)
  if (!ta || !tb || ta !== tb) return false
  const aTokens = normalizeArtistTokens(a.artist)
  const bTokens = normalizeArtistTokens(b.artist)
  if (!aTokens.length || !bTokens.length) return false
  return aTokens.some(t => bTokens.includes(t))
}

/**
 * 过滤融合候选（4.4 排除规则）：
 * 会话已消费（id + 同曲）→ 当前队列（同曲）→ 红心 → 不再推荐 → 艺人多样性。
 * 返回保留项与各规则淘汰计数（供 exhausted / empty-after-filter 分类）。
 * 起点自身排除（同曲变体 + 同 id）在融合后、本函数前统一执行，由调用方计数。
 */
const filterFused = (
  items: FusedCandidate[],
  options: PlatformRecallOptions,
): { kept: FusedCandidate[], killed: Partial<Record<FilterRule, number>> } => {
  const excludeIds = new Set((options.excludeIds ?? []).map(id => String(id)))
  const killed: Partial<Record<FilterRule, number>> = {}
  const count = (rule: FilterRule) => { killed[rule] = (killed[rule] ?? 0) + 1 }

  const kept: FusedCandidate[] = []
  for (const item of items) {
    const ref = item
    if (songRefs(item).some(source => source.id != null && excludeIds.has(source.id))) { count('session'); continue }
    if (sameSongIn(options.excludeTracks, ref)) { count('session'); continue }
    if (sameSongIn(options.queueTracks, ref)) { count('queue'); continue }
    if (sameSongIn(options.lovedTracks, ref)) { count('loved'); continue }
    if (sameSongIn(options.dislikedTracks, ref)) { count('disliked'); continue }
    if (options.isExcluded && musicInfosOf(item).some(options.isExcluded)) { count('disliked'); continue }
    kept.push(item)
  }
  // 已消费/收藏等条目不能占用本批配额；续补才能继续消费缓存中的后续候选。
  const diversified = applyArtistDiversity(kept)
  const diversitySkipped = kept.length - diversified.length
  if (diversitySkipped > 0) killed.diversity = diversitySkipped
  return { kept: diversified, killed }
}

/** 统计已桥接条目中排除起点/会话/队列/红心/屏蔽后的实际可用条数（供决定是否继续翻页）。 */
const countUsableBridged = (
  items: CachedSimilarItem[],
  anchorRefs: Array<SongRef & { id?: string | null }>,
  options: PlatformRecallOptions,
): number => {
  const excludeIds = new Set((options.excludeIds ?? []).map(id => String(id)))
  let count = 0
  for (const item of items) {
    const info = item.musicInfo
    // 以 { musicInfo: info } 包装，保证 songRefs/sameIdentity 正确读取 singer/name（与 filterFused 口径一致）
    const identity: SongIdentity = { musicInfo: info }
    const refs = songRefs(identity)
    if (refs.some(ref => anchorRefs.some(a => (a.id != null && ref.id === a.id) || sameWork(ref, a)))) continue
    if (refs.some(ref => ref.id != null && excludeIds.has(ref.id))) continue
    if (sameSongIn(options.excludeTracks, identity)) continue
    if (sameSongIn(options.queueTracks, identity)) continue
    if (sameSongIn(options.lovedTracks, identity)) continue
    if (sameSongIn(options.dislikedTracks, identity)) continue
    if (options.isExcluded?.(info)) continue
    count++
  }
  return count
}

type YtmStage1Outcome =
  | { kind: 'done', result: ProviderCallResult }
  | { kind: 'ready', seedId: string, fromCache: boolean, pageState: YtmPageCacheEntry, relatedError?: string }

/**
 * 地区受限探测（仅在搜索空返回或电台空返回且无缓存记录时按需执行，受共享截止时间约束）：
 * 返回 true 表示确认受限（并写入按 proxyContext 隔离的 10min 缓存）；
 * 返回 false 表示可访问或无法确认（不误标地区受限）。
 */
const probeYtmRegionBlocked = async(
  ytmAdapter: YtmAdapter,
  cache: SimilarCandidateCache,
  proxyContext: string,
  remainingMs: () => number,
  ytmCancelled: () => boolean,
  budgetSignal?: AbortSignal,
): Promise<boolean> => {
  const cached = cache.getRegionStatus(proxyContext)
  if (cached != null) return cached
  const rem = remainingMs()
  if (ytmCancelled() || rem <= 500) return false
  try {
    const reqTimeout = Math.min(YTM_REQUEST_TIMEOUT_MS, rem)
    const blocked = await withTimeout(ytmAdapter.checkRegionBlocked(reqTimeout), reqTimeout, ytmCancelled, budgetSignal)
    if (!ytmCancelled()) cache.setRegionStatus(proxyContext, blocked)
    return blocked
  } catch {
    return false
  }
}

/** 将 YtmRawTrack[] 追加到已有 RankedYtmTrack[] 后（按 videoId 去重并顺序编号）。 */
const appendRankedYtmTracks = (
  existing: RankedYtmTrack[],
  incoming: YtmRawTrack[],
): { merged: RankedYtmTrack[], added: RankedYtmTrack[] } => {
  const seen = new Set(existing.map(item => item.track.videoId))
  const added: RankedYtmTrack[] = []
  let nextRank = existing.length + 1
  for (const track of incoming) {
    if (!track.videoId || seen.has(track.videoId)) continue
    seen.add(track.videoId)
    added.push({ track, rank: nextRank++ })
  }
  return {
    merged: added.length ? [...existing, ...added] : existing,
    added,
  }
}

/** 按需补充 Related Tab（仅候选 <=3 且尚未成功拉取过时执行；成功则写回缓存）。 */
const trySupplementRelated = async(
  seedId: string,
  pageState: YtmPageCacheEntry,
  ytmAdapter: YtmAdapter,
  cache: SimilarCandidateCache,
  proxyContext: string,
  remainingMs: () => number,
  ytmCancelled: () => boolean,
  getNow: () => number,
  cancelCheck: () => boolean,
  budgetSignal?: AbortSignal,
): Promise<{ pageState: YtmPageCacheEntry, relatedError?: string, regionBlocked?: boolean, cancelled?: boolean }> => {
  if (
    pageState.relatedFetched ||
    !pageState.relatedBrowseId ||
    pageState.tracks.length > 3 ||
    ytmCancelled() ||
    remainingMs() <= 500
  ) {
    return { pageState }
  }
  try {
    const reqTimeout = Math.min(YTM_REQUEST_TIMEOUT_MS, remainingMs())
    const related = await withTimeout(ytmAdapter.getRelated(pageState.relatedBrowseId, seedId, reqTimeout), reqTimeout, ytmCancelled, budgetSignal)
    if (cancelCheck()) return { pageState, cancelled: true }
    const mergedTracks = appendRankedYtmTracks(pageState.tracks, related).merged
    const updated: Omit<YtmPageCacheEntry, 'fetchedAt'> = {
      tracks: mergedTracks,
      continuation: pageState.continuation,
      relatedBrowseId: pageState.relatedBrowseId,
      relatedFetched: true,
      pageCount: pageState.pageCount,
    }
    cache.setYtmPageState(seedId, updated, proxyContext)
    return { pageState: cache.getYtmPageState(seedId, proxyContext) ?? { ...updated, fetchedAt: getNow() } }
  } catch (err) {
    if (cancelCheck()) return { pageState, cancelled: true }
    if (isYtmRegionBlockedError(err)) {
      cache.setRegionStatus(proxyContext, true)
      return { pageState, regionBlocked: true }
    }
    const relatedError = budgetSignal?.aborted ? 'YouTube Music 请求超时' : ((err as Error)?.message ?? String(err))
    // 保留 relatedFetched=false，使下次刷新可继续重试 Related
    return { pageState, relatedError }
  }
}

/** YTM Stage 1：种子定位 + 拉取（或读缓存）原始 Radio 页面（与国内源并行执行，共享 ytmDeadline）。 */
const runYtmStage1 = async(
  anchor: PlatformRecallAnchor,
  anchorKey: string,
  cache: SimilarCandidateCache,
  ytmAdapter: YtmAdapter | undefined,
  proxyContext: string,
  playableTargets: DomesticBridgeProvider[],
  ytmDeadline: number,
  getNow: () => number,
  cancelCheck: () => boolean,
  budgetSignal?: AbortSignal,
  allowDirectYtmPlayback = false,
): Promise<YtmStage1Outcome> => {
  const base = { provider: 'ytm' as const, seedId: null as string | null, fromCache: false }
  const remainingMs = (): number => Math.max(0, ytmDeadline - getNow())
  const ytmCancelled = (): boolean => cancelCheck() || remainingMs() <= 0 || budgetSignal?.aborted === true

  if (cancelCheck()) return { kind: 'done', result: { ...base, status: 'cancelled', items: [] } }
  if (!playableTargets.length && !allowDirectYtmPlayback) {
    return {
      kind: 'done',
      result: { ...base, status: 'no-playable-source', items: [], error: '当前没有可用的国内播放源' },
    }
  }
  if (!ytmAdapter) {
    return {
      kind: 'done',
      result: { ...base, status: 'error', items: [], error: 'YouTube Music 适配器未初始化' },
    }
  }
  if (cache.getRegionStatus(proxyContext) === true) {
    return {
      kind: 'done',
      result: { ...base, fromCache: true, status: 'region-blocked', items: [] },
    }
  }

  // 1) 定位 YTM 种子 videoId（若起点本身为 YTM 曲目，直接复用原生 seedIds.ytm 免去种子搜索）
  let seedId = (anchor.seedIds?.ytm ? String(anchor.seedIds.ytm) : null) ?? cache.getSeed('ytm', anchorKey, proxyContext)
  if (!seedId) {
    const cleanTitle = String(anchor.title ?? '').trim()
    const cleanArtist = primaryArtist(anchor.artist)
    if (!cleanTitle || !cleanArtist) {
      return { kind: 'done', result: { ...base, status: 'no-match', items: [] } }
    }
    const rem = remainingMs()
    if (rem <= 300 || budgetSignal?.aborted) {
      return { kind: 'done', result: { ...base, status: 'error', items: [], error: 'YouTube Music 请求超时' } }
    }
    const keyword = `${simplifyForMatch(cleanTitle)} ${simplifyForMatch(cleanArtist)}`
    let searchRows: YtmRawTrack[]
    try {
      const reqTimeout = Math.min(YTM_REQUEST_TIMEOUT_MS, rem)
      searchRows = await withTimeout(ytmAdapter.searchSongs(keyword, reqTimeout), reqTimeout, ytmCancelled, budgetSignal)
    } catch (err) {
      if (cancelCheck()) return { kind: 'done', result: { ...base, status: 'cancelled', items: [] } }
      if (isYtmRegionBlockedError(err)) {
        cache.setRegionStatus(proxyContext, true)
        return { kind: 'done', result: { ...base, status: 'region-blocked', items: [] } }
      }
      const message = budgetSignal?.aborted ? 'YouTube Music 请求超时' : `seed-search: ${(err as Error).message}`
      return { kind: 'done', result: { ...base, status: 'error', items: [], error: message } }
    }
    if (cancelCheck()) return { kind: 'done', result: { ...base, status: 'cancelled', items: [] } }
    if (!searchRows.length) {
      const blocked = await probeYtmRegionBlocked(ytmAdapter, cache, proxyContext, remainingMs, ytmCancelled, budgetSignal)
      if (cancelCheck()) return { kind: 'done', result: { ...base, status: 'cancelled', items: [] } }
      return {
        kind: 'done',
        result: { ...base, status: blocked ? 'region-blocked' : 'no-match', items: [] },
      }
    }
    const matched = matchSeed(
      {
        artist: anchor.artist,
        title: anchor.title,
        album: anchor.album,
        intervalSec: anchor.intervalSec,
      },
      searchRows.map(track => ({
        artist: track.artist,
        title: track.title,
        album: track.album,
        intervalSec: track.intervalSec,
        track,
      })),
      { simplifyChinese: true },
    )
    if (!matched) {
      return { kind: 'done', result: { ...base, status: 'no-match', items: [] } }
    }
    seedId = matched.track.videoId
    cache.setSeed('ytm', anchorKey, seedId, proxyContext)
  }

  // 2) 读取或拉取第 1 页原始 Radio 数据（整页持久化，绝不裁剪；若上次 Related 未成功则在命中缓存时继续补拉）
  const cachedPage = cache.getYtmPageState(seedId, proxyContext)
  if (cachedPage) {
    const supplemented = await trySupplementRelated(
      seedId,
      cachedPage,
      ytmAdapter,
      cache,
      proxyContext,
      remainingMs,
      ytmCancelled,
      getNow,
      cancelCheck,
      budgetSignal,
    )
    if (supplemented.cancelled) {
      return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: true, status: 'cancelled', items: [] } }
    }
    if (supplemented.regionBlocked) {
      return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'region-blocked', items: [] } }
    }
    const nextPageState = supplemented.pageState
    if (!nextPageState.tracks.length && !nextPageState.continuation) {
      if (supplemented.relatedError) {
        return {
          kind: 'done',
          result: { provider: 'ytm', seedId, fromCache: false, status: 'error', items: [], error: supplemented.relatedError },
        }
      }
      return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: true, status: 'empty', items: [] } }
    }
    return {
      kind: 'ready',
      seedId,
      fromCache: nextPageState.relatedFetched === cachedPage.relatedFetched,
      pageState: nextPageState,
      ...(supplemented.relatedError ? { relatedError: supplemented.relatedError } : {}),
    }
  }

  const rem = remainingMs()
  if (rem <= 300 || budgetSignal?.aborted) {
    return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'error', items: [], error: 'YouTube Music 请求超时' } }
  }
  let firstPage
  try {
    const reqTimeout = Math.min(YTM_REQUEST_TIMEOUT_MS, rem)
    firstPage = await withTimeout(ytmAdapter.getRadio(seedId, reqTimeout), reqTimeout, ytmCancelled, budgetSignal)
  } catch (err) {
    if (cancelCheck()) return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'cancelled', items: [] } }
    if (isYtmRegionBlockedError(err)) {
      cache.setRegionStatus(proxyContext, true)
      return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'region-blocked', items: [] } }
    }
    const message = budgetSignal?.aborted ? 'YouTube Music 请求超时' : (err as Error).message
    return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'error', items: [], error: message } }
  }
  if (cancelCheck()) return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'cancelled', items: [] } }

  if (!firstPage.tracks.length && !firstPage.continuation && !firstPage.relatedBrowseId) {
    const blocked = await probeYtmRegionBlocked(ytmAdapter, cache, proxyContext, remainingMs, ytmCancelled, budgetSignal)
    if (cancelCheck()) return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'cancelled', items: [] } }
    if (blocked) {
      return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'region-blocked', items: [] } }
    }
    cache.setYtmPageState(seedId, {
      tracks: [],
      continuation: null,
      relatedBrowseId: null,
      relatedFetched: true,
      pageCount: 1,
    }, proxyContext)
    return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'empty', items: [] } }
  }

  const { merged: initialTracks } = appendRankedYtmTracks([], firstPage.tracks)
  const initialPageState: Omit<YtmPageCacheEntry, 'fetchedAt'> = {
    tracks: initialTracks,
    continuation: firstPage.continuation,
    relatedBrowseId: firstPage.relatedBrowseId,
    relatedFetched: false,
    pageCount: 1,
  }
  cache.setYtmPageState(seedId, initialPageState, proxyContext)
  const cachedInitial = cache.getYtmPageState(seedId, proxyContext) ?? { ...initialPageState, fetchedAt: getNow() }

  // 候选不足（<=3 首）且有 Related Tab 时按需补充一次（失败保留 relatedFetched=false，供下次重试）
  const supplemented = await trySupplementRelated(
    seedId,
    cachedInitial,
    ytmAdapter,
    cache,
    proxyContext,
    remainingMs,
    ytmCancelled,
    getNow,
    cancelCheck,
    budgetSignal,
  )
  if (supplemented.cancelled) {
    return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'cancelled', items: [] } }
  }
  if (supplemented.regionBlocked) {
    return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'region-blocked', items: [] } }
  }
  const stored = supplemented.pageState
  if (!stored.tracks.length && !stored.continuation) {
    if (supplemented.relatedError) {
      return {
        kind: 'done',
        result: { provider: 'ytm', seedId, fromCache: false, status: 'error', items: [], error: supplemented.relatedError },
      }
    }
    return { kind: 'done', result: { provider: 'ytm', seedId, fromCache: false, status: 'empty', items: [] } }
  }
  return {
    kind: 'ready',
    seedId,
    fromCache: false,
    pageState: stored,
    ...(supplemented.relatedError ? { relatedError: supplemented.relatedError } : {}),
  }
}

/* eslint-disable @typescript-eslint/promise-function-async -- 同步透传底层 SDK 的 .cancel() 能力 */
/** 国内桥接搜索实现：保留 musicSearch 接收者以兼容真实 SDK 内 this.*，并透传 .cancel() 与 AbortSignal。 */
const defaultSearchDomestic: DomesticSearchFn = (provider, keyword, timeoutMs, isAborted, signal) => {
  const musicSearch = similarSdk[provider]?.musicSearch
  if (!musicSearch?.search) return Promise.resolve([])
  const reqTimeout = Math.min(SIMILAR_SEED_SEARCH_TIMEOUT_MS, Math.max(500, timeoutMs))
  const rawReq = musicSearch.search(keyword, 1, 15)
  const promise = withTimeout(rawReq, reqTimeout, isAborted, signal).then(result => {
    if (isAborted() || signal?.aborted) return []
    // 酷我等 SDK 在 HTTP 503 非 JSON 正文时会返回 { list: [], total: NaN }，拒绝将其当作合法无匹配写入 30 分钟负缓存
    if (!result || !Array.isArray(result.list) || (result.total !== undefined && !Number.isFinite(Number(result.total)))) {
      throw new Error(`${provider} 搜索返回异常响应`)
    }
    const rows: any[] = result.list
    return rows.filter(rawHasId).map(raw => toNewMusicInfo(raw) as LX.Music.MusicInfoOnline)
  }) as DomesticSearchPromise
  promise.cancel = () => { cancelRequest(rawReq) }
  return promise
}
/* eslint-enable @typescript-eslint/promise-function-async */

interface YtmStage2Outcome {
  result: ProviderCallResult
  prefiltered: Partial<Record<BridgeFilterRule, number>>
  hasRecoverableError: boolean
  unmatchedTracks: RankedYtmTrack[]
}

const mergePrefiltered = (
  target: Partial<Record<BridgeFilterRule, number>>,
  incoming: Partial<Record<BridgeFilterRule, number>>,
): void => {
  for (const [rule, count] of Object.entries(incoming)) {
    const key = rule as BridgeFilterRule
    target[key] = (target[key] ?? 0) + (count ?? 0)
  }
}

/** YTM Stage 2：严格重叠复用既有国内候选 + 懒桥接当前页尾部 + 耗尽时安全推进 continuation 分页。 */
const runYtmStage2 = async(
  stage1: Extract<YtmStage1Outcome, { kind: 'ready' }>,
  anchor: PlatformRecallAnchor,
  anchorRefs: Array<SongRef & { id?: string | null }>,
  getExistingDomestic: () => LX.Music.MusicInfoOnline[],
  playableTargets: DomesticBridgeProvider[],
  ytmAdapter: YtmAdapter,
  cache: SimilarCandidateCache,
  proxyContext: string,
  options: PlatformRecallOptions,
  maxItems: number,
  ytmDeadline: number,
  getNow: () => number,
  cancelCheck: () => boolean,
  budgetSignal?: AbortSignal,
): Promise<YtmStage2Outcome> => {
  const remainingMs = (): number => Math.max(0, ytmDeadline - getNow())
  const ytmCancelled = (): boolean => cancelCheck() || remainingMs() <= 0 || budgetSignal?.aborted === true
  const targetCount = maxItems + YTM_BRIDGE_TARGET_EXTRA

  let currentState = stage1.pageState
  let fromCache = stage1.fromCache
  const allItems: CachedSimilarItem[] = []
  const unmatchedTracks: RankedYtmTrack[] = []
  const prefiltered: Partial<Record<BridgeFilterRule, number>> = {}
  let continuationError: string | null = null
  let hasUnfetchedContinuationError = false
  let bridgeErrorCount = 0
  let lastBridgeError: string | null = null

  const toDirectMusicInfo = options.allowDirectYtmPlayback
    ? (track: YtmRawTrack): LX.Music.MusicInfoOnline => toNewMusicInfo(toLegacyYtmSong(track)) as LX.Music.MusicInfoOnline
    : undefined

  const firstBridge = await bridgeYtmTracks(currentState.tracks, {
    anchor,
    existingDomestic: getExistingDomestic(),
    getExistingDomestic,
    playableTargets,
    searchDomestic: defaultSearchDomestic,
    cache,
    excludeIds: options.excludeIds,
    excludeTracks: options.excludeTracks,
    queueTracks: options.queueTracks,
    lovedTracks: options.lovedTracks,
    dislikedTracks: options.dislikedTracks,
    isExcluded: options.isExcluded,
    targetCount,
    deadlineAt: ytmDeadline,
    now: options.now,
    isCancelled: cancelCheck,
    signal: budgetSignal,
    ...(toDirectMusicInfo ? { toDirectMusicInfo } : {}),
  })
  if (cancelCheck()) {
    return {
      result: { provider: 'ytm', seedId: stage1.seedId, fromCache, status: 'cancelled', items: [] },
      prefiltered,
      hasRecoverableError: false,
      unmatchedTracks,
    }
  }
  allItems.push(...firstBridge.items)
  unmatchedTracks.push(...firstBridge.unmatchedTracks)
  mergePrefiltered(prefiltered, firstBridge.prefiltered)
  bridgeErrorCount += firstBridge.bridgeErrorCount
  if (firstBridge.lastBridgeError) lastBridgeError = firstBridge.lastBridgeError
  let timedOut = firstBridge.timedOut
  let lastHasUnprocessed = firstBridge.hasUnprocessed
  let usable = countUsableBridged(allItems, anchorRefs, options)

  // 仅当页内全部尾部曲目已消费完且可用条数仍不足 maxItems 时，才按 continuation 安全翻页
  while (
    !ytmCancelled() &&
    !timedOut &&
    usable < maxItems &&
    !lastHasUnprocessed &&
    currentState.continuation &&
    currentState.pageCount < YTM_MAX_PAGES &&
    remainingMs() > 500
  ) {
    let nextPage
    try {
      const reqTimeout = Math.min(YTM_REQUEST_TIMEOUT_MS, remainingMs())
      nextPage = await withTimeout(
        ytmAdapter.getRadioContinuation(stage1.seedId, currentState.continuation, reqTimeout),
        reqTimeout,
        ytmCancelled,
        budgetSignal,
      )
    } catch (err) {
      if (cancelCheck()) {
        return {
          result: { provider: 'ytm', seedId: stage1.seedId, fromCache, status: 'cancelled', items: [] },
          prefiltered,
          hasRecoverableError: false,
          unmatchedTracks,
        }
      }
      if (isYtmRegionBlockedError(err)) {
        cache.setRegionStatus(proxyContext, true)
        if (usable > 0) {
          // 已桥接成功的第 1 页可用候选保留交付，仅终止后续翻页
          continuationError = (err as Error).message
          break
        }
        return {
          result: { provider: 'ytm', seedId: stage1.seedId, fromCache, status: 'region-blocked', items: [] },
          prefiltered,
          hasRecoverableError: false,
          unmatchedTracks,
        }
      }
      // 下一页瞬时失败绝不覆写/推进缓存游标，保留原 token 供下次重试
      continuationError = budgetSignal?.aborted ? 'YouTube Music 请求超时' : (err as Error).message
      hasUnfetchedContinuationError = true
      break
    }
    if (cancelCheck()) {
      return {
        result: { provider: 'ytm', seedId: stage1.seedId, fromCache, status: 'cancelled', items: [] },
        prefiltered,
        hasRecoverableError: false,
        unmatchedTracks,
      }
    }

    fromCache = false
    const { merged, added } = appendRankedYtmTracks(currentState.tracks, nextPage.tracks)
    const nextState: Omit<YtmPageCacheEntry, 'fetchedAt'> = {
      tracks: merged,
      continuation: nextPage.continuation,
      relatedBrowseId: currentState.relatedBrowseId,
      relatedFetched: currentState.relatedFetched,
      pageCount: currentState.pageCount + 1,
    }
    // 仅在下一页请求验证成功后才推进游标与页计数
    cache.setYtmPageState(stage1.seedId, nextState, proxyContext)
    currentState = cache.getYtmPageState(stage1.seedId, proxyContext) ?? { ...nextState, fetchedAt: getNow() }

    if (!added.length) continue
    const nextBridge = await bridgeYtmTracks(added, {
      anchor,
      existingDomestic: getExistingDomestic(),
      getExistingDomestic,
      playableTargets,
      searchDomestic: defaultSearchDomestic,
      cache,
      excludeIds: options.excludeIds,
      excludeTracks: options.excludeTracks,
      queueTracks: options.queueTracks,
      lovedTracks: options.lovedTracks,
      dislikedTracks: options.dislikedTracks,
      isExcluded: options.isExcluded,
      targetCount: Math.max(1, targetCount - usable),
      deadlineAt: ytmDeadline,
      now: options.now,
      isCancelled: cancelCheck,
      signal: budgetSignal,
      ...(toDirectMusicInfo ? { toDirectMusicInfo } : {}),
    })
    if (cancelCheck()) {
      return {
        result: { provider: 'ytm', seedId: stage1.seedId, fromCache, status: 'cancelled', items: [] },
        prefiltered,
        hasRecoverableError: false,
        unmatchedTracks,
      }
    }
    allItems.push(...nextBridge.items)
    unmatchedTracks.push(...nextBridge.unmatchedTracks)
    mergePrefiltered(prefiltered, nextBridge.prefiltered)
    bridgeErrorCount += nextBridge.bridgeErrorCount
    if (nextBridge.lastBridgeError) lastBridgeError = nextBridge.lastBridgeError
    timedOut = nextBridge.timedOut
    lastHasUnprocessed = nextBridge.hasUnprocessed
    usable = countUsableBridged(allItems, anchorRefs, options)
  }

  // 预算死区防御：若有未消费曲目或合法 continuation 仅因剩余预算 <= 500ms / 预算中止而未拉完，视为超时而非耗尽
  if (
    !cancelCheck() &&
    !timedOut &&
    !hasUnfetchedContinuationError &&
    usable < maxItems &&
    (lastHasUnprocessed || (currentState.continuation && currentState.pageCount < YTM_MAX_PAGES)) &&
    (remainingMs() <= 500 || budgetSignal?.aborted === true)
  ) {
    timedOut = true
  }

  allItems.sort((a, b) => a.rank - b.rank)
  const nonAnchorPrefiltered = (prefiltered.session ?? 0) +
    (prefiltered.queue ?? 0) +
    (prefiltered.loved ?? 0) +
    (prefiltered.disliked ?? 0)

  if (usable > 0) {
    const partialError = continuationError ?? stage1.relatedError
    return {
      result: {
        provider: 'ytm',
        seedId: stage1.seedId,
        fromCache,
        status: 'success',
        items: allItems,
        ...(partialError ? { error: partialError } : {}),
      },
      prefiltered,
      // 透传可恢复错误标记：若融合后 filterFused 把唯一存活项淘汰导致最终 items 为空，仍返回 all-failed 允许重试而非误报 exhausted
      hasRecoverableError: hasUnfetchedContinuationError || Boolean(stage1.relatedError),
      unmatchedTracks,
    }
  }
  if (hasUnfetchedContinuationError) {
    return {
      result: {
        provider: 'ytm',
        seedId: stage1.seedId,
        fromCache,
        status: 'error',
        items: [],
        error: continuationError ?? 'YouTube Music 分页请求失败',
      },
      prefiltered,
      hasRecoverableError: true,
      unmatchedTracks,
    }
  }
  if (timedOut) {
    return {
      result: {
        provider: 'ytm',
        seedId: stage1.seedId,
        fromCache,
        status: 'error',
        items: [],
        error: 'YouTube Music 请求超时',
      },
      prefiltered,
      hasRecoverableError: true,
      unmatchedTracks,
    }
  }
  if (bridgeErrorCount > 0) {
    return {
      result: {
        provider: 'ytm',
        seedId: stage1.seedId,
        fromCache,
        status: 'error',
        items: [],
        error: lastBridgeError ?? 'YouTube Music 国内桥接搜索失败',
      },
      prefiltered,
      hasRecoverableError: true,
      unmatchedTracks,
    }
  }
  if (stage1.relatedError) {
    return {
      result: {
        provider: 'ytm',
        seedId: stage1.seedId,
        fromCache,
        status: 'error',
        items: [],
        error: stage1.relatedError,
      },
      prefiltered,
      hasRecoverableError: true,
      unmatchedTracks,
    }
  }
  if (allItems.length > 0) {
    return {
      result: {
        provider: 'ytm',
        seedId: stage1.seedId,
        fromCache,
        status: 'success',
        items: allItems,
      },
      prefiltered,
      hasRecoverableError: false,
      unmatchedTracks,
    }
  }
  if (nonAnchorPrefiltered > 0) {
    return {
      result: {
        provider: 'ytm',
        seedId: stage1.seedId,
        fromCache,
        status: 'success',
        items: [],
      },
      prefiltered,
      hasRecoverableError: false,
      unmatchedTracks,
    }
  }
  return {
    result: {
      provider: 'ytm',
      seedId: stage1.seedId,
      fromCache,
      status: 'empty',
      items: [],
    },
    prefiltered,
    hasRecoverableError: false,
    unmatchedTracks,
  }
}

/**
 * 平台相似召回主入口：各平台并行独立调用（单源失败不影响其他源）→ 确定性融合 → 过滤 → 状态分类。
 */
export const recallPlatformSimilar = async(
  anchor: PlatformRecallAnchor,
  options: PlatformRecallOptions = {},
): Promise<PlatformRecallResult> => {
  const cache = options.cache ?? similarCache
  const isCancelled = options.isCancelled
  const cancelCheck = (): boolean => Boolean(isCancelled?.())
  const getNow = options.now ?? (() => Date.now())
  const maxItems = options.maxItems ?? 8
  const proxyContext = options.ytmProxyContext ?? 'direct'

  const activeProviders: SimilarProviderId[] = options.enabledProviders != null
    ? PROVIDER_ORDER.filter(p => options.enabledProviders!.includes(p))
    : (options.ytmAdapter ? [...PROVIDER_ORDER] : ['wy', 'tx'])

  if (!activeProviders.length) {
    return { state: 'empty', items: [], providers: [], error: null }
  }

  // 包含全部匹配证据，避免同 id 的元数据/版本变更误用旧匹配。
  const anchorKey = JSON.stringify([anchor.source, anchor.id, anchor.artist, anchor.title, anchor.album, anchor.intervalSec])
  const anchorRefs = songRefs(anchor)
  const domesticProviders = activeProviders.filter((p): p is DomesticSimilarProvider => p === 'wy' || p === 'tx')
  const ytmEnabled = activeProviders.includes('ytm')
  // 严禁省略 playableTargets 时默认回落全五源；未提供播放能力列表则视为空能力（no-playable-source）
  const playableTargets: DomesticBridgeProvider[] = options.playableTargets ?? []
  const ytmDeadline = getNow() + YTM_TOTAL_BUDGET_MS

  // 共享截止控制（仅启用 YTM 时对慢国内源施加同一 12s 预算上限，避免单慢源阻塞已就绪批次与耗尽 YTM Stage2 预算）
  const budgetController = new AbortController()
  let budgetTimer: ReturnType<typeof setTimeout> | null = null
  if (ytmEnabled && options.now == null) {
    budgetTimer = setTimeout(() => {
      budgetController.abort()
    }, YTM_TOTAL_BUDGET_MS)
  }
  const getRemainingBudgetMs = ytmEnabled ? () => Math.max(0, ytmDeadline - getNow()) : undefined
  const budgetSignal = ytmEnabled ? budgetController.signal : undefined

  const settledDomestic = new Map<DomesticSimilarProvider, ProviderCallResult>()
  const getReadyDomesticItems = (): LX.Music.MusicInfoOnline[] => {
    const ready: LX.Music.MusicInfoOnline[] = []
    for (const provider of domesticProviders) {
      const res = settledDomestic.get(provider)
      if (res?.status === 'success') {
        for (const item of res.items) ready.push(item.musicInfo as LX.Music.MusicInfoOnline)
      }
    }
    return ready
  }

  let domesticResults: ProviderCallResult[]
  let ytmStage2Outcome: YtmStage2Outcome | null
  try {
    const domesticPromise = Promise.all(
      domesticProviders.map(async provider => {
        const res = await runDomesticProvider(provider, anchor, anchorKey, cache, isCancelled, getRemainingBudgetMs, budgetSignal, getNow)
        settledDomestic.set(provider, res)
        return res
      }),
    )

    const ytmPipelinePromise: Promise<YtmStage2Outcome | null> = ytmEnabled
      ? (async(): Promise<YtmStage2Outcome> => {
          const stage1 = await runYtmStage1(
            anchor,
            anchorKey,
            cache,
            options.ytmAdapter,
            proxyContext,
            playableTargets,
            ytmDeadline,
            getNow,
            cancelCheck,
            budgetSignal,
            options.allowDirectYtmPlayback === true,
          )
          if (stage1.kind === 'done' || !options.ytmAdapter) {
            return {
              result: stage1.kind === 'done'
                ? stage1.result
                : { provider: 'ytm', seedId: stage1.seedId, fromCache: stage1.fromCache, status: 'error', items: [], error: 'YouTube Music 适配器未初始化' },
              prefiltered: {},
              hasRecoverableError: false,
              unmatchedTracks: [],
            }
          }
          // 让已同步就绪/缓存命中的国内通道在微任务级优先入表，零额外延迟同时最大化零请求重叠复用
          if (domesticProviders.length > 0 && settledDomestic.size < domesticProviders.length) {
            for (let i = 0; i < 4; i++) await Promise.resolve()
          }
          return runYtmStage2(
            stage1,
            anchor,
            anchorRefs,
            getReadyDomesticItems,
            playableTargets,
            options.ytmAdapter,
            cache,
            proxyContext,
            options,
            maxItems,
            ytmDeadline,
            getNow,
            cancelCheck,
            budgetSignal,
          )
        })()
      : Promise.resolve(null)

    ;[domesticResults, ytmStage2Outcome] = await Promise.all([domesticPromise, ytmPipelinePromise])
  } finally {
    if (budgetTimer != null) clearTimeout(budgetTimer)
  }

  const ytmResult: ProviderCallResult | null = ytmStage2Outcome?.result
    ? { ...ytmStage2Outcome.result, items: [...ytmStage2Outcome.result.items] }
    : null
  // 并行收敛后零网络补对账：若国内源晚于 YTM Stage2 到达，用最终可播国内集合对未匹配 YTM 原始曲目做一次严格重叠补匹配
  if (
    ytmResult &&
    ytmStage2Outcome?.unmatchedTracks.length &&
    playableTargets.length > 0 &&
    !cancelCheck()
  ) {
    const playableSet = new Set<string>(playableTargets)
    const finalDomestic = getReadyDomesticItems().filter(info => playableSet.has(info.source))
    if (finalDomestic.length) {
      const existingRanks = new Set(ytmResult.items.map(i => i.rank))
      let reconciled = 0
      for (const entry of ytmStage2Outcome.unmatchedTracks) {
        if (existingRanks.has(entry.rank)) continue
        const overlap = matchYtmToInfos(entry.track, finalDomestic)
        if (overlap) {
          ytmResult.items.push({ musicInfo: overlap, rank: entry.rank })
          existingRanks.add(entry.rank)
          reconciled++
        }
      }
      if (reconciled > 0) {
        ytmResult.items.sort((a, b) => a.rank - b.rank)
        if (
          ytmResult.status === 'empty' ||
          ((ytmResult.status === 'error' || ytmResult.status === 'region-blocked') && countUsableBridged(ytmResult.items, anchorRefs, options) > 0)
        ) {
          if (ytmResult.status === 'region-blocked' && !ytmResult.error) {
            ytmResult.error = 'YouTube Music 当前地区不可用'
          }
          ytmResult.status = 'success'
        }
      }
    }
  }
  const ytmPrefiltered = ytmStage2Outcome?.prefiltered ?? {}
  const ytmRecoverableError = ytmStage2Outcome?.hasRecoverableError ?? false

  const providerResults: ProviderCallResult[] = [
    ...domesticResults,
    ...(ytmResult ? [ytmResult] : []),
  ]

  if (cancelCheck()) {
    return {
      state: 'cancelled',
      items: [],
      providers: providerResults.map(p => ({ provider: p.provider, status: 'cancelled', seedId: p.seedId, fromCache: p.fromCache })),
      error: null,
    }
  }

  // 融合（确定性，与完成顺序无关）→ 画像有界调整
  const batches: ProviderBatch[] = providerResults
    .filter(p => p.status === 'success' && p.items.length > 0)
    .map(p => ({ provider: p.provider, candidates: p.items.map(item => ({ musicInfo: item.musicInfo, rank: item.rank })) }))
  let fused = applyProfileAdjustment(fuseSimilarCandidates(batches), options.profileBoost)

  // 起点自身及同作品变体排除（同曲变体 + 同 id；在融合后统一执行；排除后无剩余按「平台空结果」归类）
  fused = fused.filter(item => {
    return !songRefs(item).some(ref => anchorRefs.some(anchorRef =>
      (anchorRef.id != null && ref.id === anchorRef.id) || sameWork(ref, anchorRef),
    ))
  })

  const { kept, killed } = filterFused(fused, options)
  const items = kept.slice(0, maxItems)

  // 合并 YTM 预过滤淘汰计数与融合后 filterFused 计数，防止末页全被预过滤时丢失 exhausted / empty-after-filter
  const totalKilled: Partial<Record<FilterRule, number>> = { ...killed }
  let nonAnchorPrefiltered = 0
  for (const [rule, count] of Object.entries(ytmPrefiltered)) {
    if (rule === 'anchor' || !count) continue
    const key = rule as FilterRule
    totalKilled[key] = (totalKilled[key] ?? 0) + count
    nonAnchorPrefiltered += count
  }

  // 状态分类（全部失败/无匹配/空结果/过滤完/用尽/无可用国内播放源 可区分）
  const errors = providerResults.filter(p => p.status === 'error')
  const partialErrors = providerResults.filter(p => p.status === 'error' || (p.status === 'success' && Boolean(p.error)))
  const noMatch = providerResults.filter(p => p.status === 'no-match')
  const definitive = providerResults.filter(p => p.status === 'success' || p.status === 'empty')

  if (items.length) {
    return {
      state: 'ok',
      items,
      providers: projectProviders(providerResults),
      error: partialErrors.length ? partialErrors.map(e => `${e.provider}: ${e.error}`).join('；') : null,
    }
  }

  // YTM 存在可恢复错误（分页失败/预算超时/桥接网络失败/Related 失败）且当前无剩余可用候选：按失败返回以允许重试，不得误报 exhausted
  if (ytmRecoverableError && partialErrors.length) {
    return {
      state: 'all-failed',
      items: [],
      providers: projectProviders(providerResults),
      error: partialErrors.map(e => `${e.provider}: ${e.error ?? '请求失败'}`).join('；'),
    }
  }

  // 有平台成功取数但没有候选可入队：
  // - 起点排除后无剩余且无预过滤淘汰（平台只返回了起点自身/同曲变体）→ 平台空结果（empty）；
  // - 存在会话已消费项耗尽剩余池 → exhausted（候选用尽，优先于偶发红心/队列碰撞，修复 Bug #9）；
  // - 仅被非会话规则（红心/队列/不再推荐/多样性）过滤完 → empty-after-filter。
  if (definitive.some(p => p.status === 'success')) {
    if (fused.length === 0 && nonAnchorPrefiltered === 0) {
      return { state: 'empty', items: [], providers: projectProviders(providerResults), error: null }
    }
    const sessionKilled = totalKilled.session ?? 0
    const nonSessionKilled = (totalKilled.queue ?? 0) + (totalKilled.loved ?? 0) + (totalKilled.disliked ?? 0) + (totalKilled.diversity ?? 0)
    if (sessionKilled > 0) {
      return { state: 'exhausted', items: [], providers: projectProviders(providerResults), error: null }
    }
    if (nonSessionKilled > 0) {
      return { state: 'empty-after-filter', items: [], providers: projectProviders(providerResults), error: null }
    }
    return { state: 'empty', items: [], providers: projectProviders(providerResults), error: null }
  }

  // 无任何平台成功取数：全部无可用播放源 / 有已匹配空结果 / 全部失败（可重试）/ 全部无匹配 / 仅地区受限
  if (providerResults.every(p => p.status === 'no-playable-source')) {
    return {
      state: 'no-playable-source',
      items: [],
      providers: projectProviders(providerResults),
      error: '当前没有可用的国内播放源，无法为 YouTube Music 推荐匹配可播歌曲',
    }
  }
  if (definitive.length) {
    return { state: 'empty', items: [], providers: projectProviders(providerResults), error: null }
  }
  if (errors.length && !definitive.length) {
    return {
      state: 'all-failed',
      items: [],
      providers: projectProviders(providerResults),
      error: errors.map(e => `${e.provider}: ${e.error ?? '请求失败'}`).join('；') || '全部平台请求失败',
    }
  }
  if (noMatch.length) {
    return { state: 'no-match', items: [], providers: projectProviders(providerResults), error: null }
  }
  return { state: 'empty', items: [], providers: projectProviders(providerResults), error: null }
}

/** 视图投影：不透传候选条目（调用方只需要状态与失败原因）。 */
const projectProviders = (results: ProviderCallResult[]): Array<Pick<ProviderCallResult, 'provider' | 'status' | 'seedId' | 'fromCache' | 'error'>> => {
  return results.map(p => ({ provider: p.provider, status: p.status, seedId: p.seedId, fromCache: p.fromCache, ...(p.error ? { error: p.error } : {}) }))
}
