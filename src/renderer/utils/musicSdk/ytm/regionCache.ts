import { YTM_REGION_CACHE_TTL_MS } from '@common/recommendationConfig'

interface RegionEntry {
  blocked: boolean
  fetchedAt: number
}

/**
 * 按有效代理出口上下文（`contextKey`）隔离的 YouTube Music 地区可达性缓存（带 TTL 与容量上限）。
 * 由 Explore（similarCache）与搜索/歌单/榜单 SDK 共用，避免双份地区状态漂移。
 */
export class YtmRegionCache {
  private readonly entries = new Map<string, RegionEntry>()
  private readonly ttlMs: number
  private readonly maxEntries: number
  private readonly now: () => number

  constructor(options: { ttlMs?: number, maxEntries?: number, now?: () => number } = {}) {
    this.ttlMs = options.ttlMs ?? YTM_REGION_CACHE_TTL_MS
    this.maxEntries = options.maxEntries ?? 64
    this.now = options.now ?? (() => Date.now())
  }

  get(contextKey: string): boolean | null {
    const entry = this.entries.get(contextKey)
    if (!entry) return null
    if (this.now() - entry.fetchedAt > this.ttlMs) {
      this.entries.delete(contextKey)
      return null
    }
    this.entries.delete(contextKey)
    this.entries.set(contextKey, entry)
    return entry.blocked
  }

  set(contextKey: string, blocked: boolean): void {
    this.entries.delete(contextKey)
    this.entries.set(contextKey, { blocked, fetchedAt: this.now() })
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
  }

  clear(): void {
    this.entries.clear()
  }
}

export const sharedYtmRegionCache = new YtmRegionCache()
