/**
 * 平台相似结果缓存（平台相似推荐 4.6 + YouTube Music 整页/桥接/区域探测扩展）。
 *
 * - 按「平台 + 种子原生 id + 上下文」缓存归一化结果；TTL 与容量上限集中配置；
 * - YTM 原始分页缓存保存整页未裁剪的 RankedYtmTrack[]、continuation token 与已拉页数，
 *   续补先消费页内尾部余项，仅在下一页请求验证成功后才推进游标；
 * - YTM 桥接缓存按 `(videoId, domesticProvider)` 独立记录单个国内源的严格匹配结果，
 *   避免单源无匹配遮住其他国内源；
 * - YTM 区域可达性缓存按 `proxyContext` 隔离，切换代理立即失效；
 * - 失败/限流/取消不写入缓存。
 * 本模块无 lx 运行时依赖，由 vitest 直接测试。
 */

import {
  SIMILAR_CACHE_MAX_ENTRIES,
  SIMILAR_CACHE_TTL_MS,
  YTM_BRIDGE_CACHE_MAX_ENTRIES,
  YTM_REGION_CACHE_TTL_MS,
} from '@common/recommendationConfig'
import { YtmRegionCache } from '@renderer/utils/musicSdk/ytm/regionCache'
import type { SimilarProviderId } from './similarFusion'
import type { RankedYtmTrack } from './ytmParser'

/** 缓存的归一化候选条目（platformRecall 归一化后的形状）。 */
export interface CachedSimilarItem {
  musicInfo: LX.Music.MusicInfo
  rank: number
}

/** 缓存条目：归一化候选列表 + 写入时间戳。 */
export interface SimilarCacheEntry {
  items: CachedSimilarItem[]
  fetchedAt: number
}

/** YTM 原始分页缓存条目（整页曲目元数据 + 安全分页游标）。 */
export interface YtmPageCacheEntry {
  tracks: RankedYtmTrack[]
  continuation: string | null
  relatedBrowseId: string | null
  relatedFetched: boolean
  pageCount: number
  fetchedAt: number
}

/** YTM 单国内源桥接缓存查询结果：distinguish miss vs cached-null vs cached-hit。 */
export type YtmBridgeCacheLookup =
  | { hit: false }
  | { hit: true, musicInfo: LX.Music.MusicInfoOnline | null }

/** 相似候选缓存（LRU + TTL；Map 迭代序即热度序：尾端最新）。 */
export class SimilarCandidateCache {
  private readonly store = new Map<string, SimilarCacheEntry>()
  private readonly seeds = new Map<string, { seedId: string, fetchedAt: number }>()
  private readonly ytmPages = new Map<string, YtmPageCacheEntry>()
  private readonly bridges = new Map<string, { musicInfo: LX.Music.MusicInfoOnline | null, fetchedAt: number }>()
  private readonly regionCache: YtmRegionCache

  constructor(
    private readonly maxEntries: number = SIMILAR_CACHE_MAX_ENTRIES,
    private readonly ttlMs: number = SIMILAR_CACHE_TTL_MS,
    private readonly now: () => number = () => Date.now(),
    private readonly maxBridgeEntries: number = YTM_BRIDGE_CACHE_MAX_ENTRIES,
    private readonly regionTtlMs: number = YTM_REGION_CACHE_TTL_MS,
    regionCache?: YtmRegionCache,
  ) {
    this.regionCache = regionCache ?? new YtmRegionCache({
      ttlMs: this.regionTtlMs,
      maxEntries: this.maxEntries,
      now: this.now,
    })
  }

  /** 缓存键：平台 + 种子原生 id（不含认证信息；代理/账号上下文由调用方拼入 key）。 */
  static key(provider: SimilarProviderId, seedId: string, accountContext = ''): string {
    return `${provider}:${String(seedId)}:${accountContext}`
  }

  private evictLru(map: Map<string, unknown>, limit: number): void {
    while (map.size > limit) {
      const oldest = map.keys().next().value
      if (oldest == null) break
      map.delete(oldest)
    }
  }

  /** 已确认的跨平台种子；独立按同一 TTL/容量限制，不缓存失败或无匹配。 */
  getSeed(provider: SimilarProviderId, anchorKey: string, accountContext = ''): string | null {
    const key = SimilarCandidateCache.key(provider, anchorKey, accountContext)
    const entry = this.seeds.get(key)
    if (!entry) return null
    this.seeds.delete(key)
    if (this.now() - entry.fetchedAt > this.ttlMs) return null
    this.seeds.set(key, entry)
    return entry.seedId
  }

  setSeed(provider: SimilarProviderId, anchorKey: string, seedId: string, accountContext = ''): void {
    const key = SimilarCandidateCache.key(provider, anchorKey, accountContext)
    this.seeds.delete(key)
    this.seeds.set(key, { seedId, fetchedAt: this.now() })
    this.evictLru(this.seeds, this.maxEntries)
  }

  /** 读取：未命中/已过期返回 null（过期条目顺手淘汰）；命中刷新 LRU 热度。 */
  get(provider: SimilarProviderId, seedId: string, accountContext = ''): SimilarCacheEntry | null {
    const key = SimilarCandidateCache.key(provider, seedId, accountContext)
    const entry = this.store.get(key)
    if (!entry) return null
    if (this.now() - entry.fetchedAt > this.ttlMs) {
      this.store.delete(key)
      return null
    }
    this.store.delete(key)
    this.store.set(key, entry)
    return entry
  }

  /** 写入（仅真实成功结果；超容量淘汰最旧条目）。 */
  set(provider: SimilarProviderId, seedId: string, items: CachedSimilarItem[], accountContext = ''): void {
    const key = SimilarCandidateCache.key(provider, seedId, accountContext)
    this.store.delete(key)
    this.store.set(key, { items, fetchedAt: this.now() })
    this.evictLru(this.store, this.maxEntries)
  }

  /** 读取 YTM 整页原始分页缓存（按 seedId + proxyContext 隔离）。 */
  getYtmPageState(seedId: string, proxyContext = ''): YtmPageCacheEntry | null {
    const key = SimilarCandidateCache.key('ytm', seedId, proxyContext)
    const entry = this.ytmPages.get(key)
    if (!entry) return null
    if (this.now() - entry.fetchedAt > this.ttlMs) {
      this.ytmPages.delete(key)
      return null
    }
    this.ytmPages.delete(key)
    this.ytmPages.set(key, entry)
    return entry
  }

  /** 写入 YTM 整页原始分页缓存（仅在请求校验成功后写入）。 */
  setYtmPageState(
    seedId: string,
    state: Omit<YtmPageCacheEntry, 'fetchedAt'>,
    proxyContext = '',
  ): void {
    const key = SimilarCandidateCache.key('ytm', seedId, proxyContext)
    this.ytmPages.delete(key)
    this.ytmPages.set(key, { ...state, fetchedAt: this.now() })
    this.evictLru(this.ytmPages, this.maxEntries)
  }

  /** 读取 YTM 单国内源桥接缓存（按 videoId + domesticProvider 隔离，避免单源无匹配遮住其他国内源）。 */
  getBridge(videoId: string, domesticProvider: string): YtmBridgeCacheLookup {
    const key = `${domesticProvider}:${String(videoId)}`
    const entry = this.bridges.get(key)
    if (!entry) return { hit: false }
    if (this.now() - entry.fetchedAt > this.ttlMs) {
      this.bridges.delete(key)
      return { hit: false }
    }
    this.bridges.delete(key)
    this.bridges.set(key, entry)
    return { hit: true, musicInfo: entry.musicInfo }
  }

  /** 写入 YTM 单国内源桥接结果（仅真实匹配或明确无匹配；超时/网络异常/取消不写）。 */
  setBridge(videoId: string, domesticProvider: string, musicInfo: LX.Music.MusicInfoOnline | null): void {
    const key = `${domesticProvider}:${String(videoId)}`
    this.bridges.delete(key)
    this.bridges.set(key, { musicInfo, fetchedAt: this.now() })
    this.evictLru(this.bridges, this.maxBridgeEntries)
  }

  /** 读取按实际代理上下文隔离的 YTM 区域可达性缓存。 */
  getRegionStatus(proxyContext: string): boolean | null {
    return this.regionCache.get(proxyContext)
  }

  setRegionStatus(proxyContext: string, blocked: boolean): void {
    this.regionCache.set(proxyContext, blocked)
  }

  /** 删除单条（测试/失效用）。 */
  delete(provider: SimilarProviderId, seedId: string, accountContext = ''): void {
    this.store.delete(SimilarCandidateCache.key(provider, seedId, accountContext))
  }

  clear(): void {
    this.store.clear()
    this.seeds.clear()
    this.ytmPages.clear()
    this.bridges.clear()
    this.regionCache.clear()
  }

  get size(): number {
    return this.store.size
  }
}
