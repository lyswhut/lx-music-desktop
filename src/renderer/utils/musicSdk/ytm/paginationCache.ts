/**
 * YouTube Music 固定窗口 Continuation 缓冲器（单飞推进 + 代际隔离 + 调用方引用计数取消）。
 *
 * 解决：
 * 1. InnerTube 变长续页（10/20/68/100 条）与 UI `Pagination.vue` `Math.ceil(total / limit)` 的对齐；
 * 2. 详情翻页与「播放全部/收藏」并发请求同一流时共享单飞游标推进，不重复消费 continuation；
 * 3. `isRefresh` 递增流代际（generation），旧请求迟到响应不会污染新流；
 * 4. 单个调用方 `cancel()` 仅中止自身等待，仅当所有等待者均取消时才中止底层 HTTP；
 * 5. 支持多游标源（如 Community + Featured 歌单搜索）顺序补窗并在全部枯竭后收敛末页。
 */

export type YtmCancellablePromise<T> = Promise<T> & {
  cancel?: () => void
  cancelHttp?: () => void
}

export interface StreamFetchResult<T, M = undefined> {
  items: T[]
  continuation: string | null
  meta?: M
  /** 可选多游标通道更新（用于首屏并行拉取 Community + Featured 歌单）。 */
  extraCursors?: Array<{ channel: string, continuation: string | null }>
  /** 若为 true（如降级预览或双分支部分失败），本次调用仍可返回数据，但立即从缓存摘除以便后续重试恢复。 */
  ephemeral?: boolean
}

export interface StreamWindowResult<T, M = undefined> {
  list: T[]
  total: number
  limit: number
  allPage: number
  hasMore: boolean
  truncated: boolean
  generation: number
  ephemeral: boolean
  meta?: M
}

interface CursorSlot {
  channel: string
  token: string | null
  done: boolean
}

interface StreamState<T, M> {
  key: string
  generation: number
  items: T[]
  seenIds: Set<string>
  meta?: M
  initialized: boolean
  cursors: CursorSlot[]
  continuationFetches: number
  exhausted: boolean
  truncated: boolean
  ephemeral: boolean
  fetchedAt: number
  inFlight: {
    promise: Promise<void>
    cancelUnderlying: () => void
    abortWaiters: () => void
    waiters: Set<(err: Error) => void>
  } | null
}

export type StreamStepFetcher<T, M> = (
  cursor: { channel: string, continuation: string | null, isInitial: boolean, meta?: M },
) => YtmCancellablePromise<StreamFetchResult<T, M>>

export const YTM_PAGINATION_MAX_CONTINUATIONS = 10
export const YTM_PAGINATION_TTL_MS = 10 * 60 * 1000
export const YTM_PAGINATION_MAX_STREAMS = 30

export class YtmPaginationCache {
  private readonly streams = new Map<string, StreamState<any, any>>()
  private readonly ttlMs: number
  private readonly maxStreams: number
  private readonly maxContinuations: number
  private readonly now: () => number
  private nextGeneration = 1

  constructor(options: {
    ttlMs?: number
    maxStreams?: number
    maxContinuations?: number
    now?: () => number
  } = {}) {
    this.ttlMs = options.ttlMs ?? YTM_PAGINATION_TTL_MS
    this.maxStreams = options.maxStreams ?? YTM_PAGINATION_MAX_STREAMS
    this.maxContinuations = options.maxContinuations ?? YTM_PAGINATION_MAX_CONTINUATIONS
    this.now = options.now ?? (() => Date.now())
  }

  private disposeStream(stream: StreamState<any, any>): void {
    stream.generation = -1
    if (stream.inFlight) {
      const flight = stream.inFlight
      stream.inFlight = null
      flight.cancelUnderlying()
      flight.abortWaiters()
    }
  }

  clear(): void {
    for (const st of this.streams.values()) this.disposeStream(st)
    this.streams.clear()
  }

  private getOrCreateStream<T, M>(key: string, isRefresh: boolean, now: number = this.now()): StreamState<T, M> {
    const existing = this.streams.get(key) as StreamState<T, M> | undefined
    if (existing) {
      const expired = now - existing.fetchedAt > this.ttlMs
      if (!isRefresh && !expired) {
        this.streams.delete(key)
        this.streams.set(key, existing)
        return existing
      }
      // 代际作废：立即中止旧流在途 HTTP 并唤醒旧等待者，避免滞留连接或污染新流
      this.disposeStream(existing)
      this.streams.delete(key)
    }

    const fresh: StreamState<T, M> = {
      key,
      generation: this.nextGeneration++,
      items: [],
      seenIds: new Set<string>(),
      initialized: false,
      cursors: [],
      continuationFetches: 0,
      exhausted: false,
      truncated: false,
      ephemeral: false,
      fetchedAt: now,
      inFlight: null,
    }
    this.streams.set(key, fresh)
    while (this.streams.size > this.maxStreams) {
      const oldest = this.streams.keys().next().value
      if (oldest === undefined) break
      const dropped = this.streams.get(oldest)
      if (dropped) this.disposeStream(dropped)
      this.streams.delete(oldest)
    }
    return fresh
  }

  private nextCursor(stream: StreamState<any, any>): { channel: string, continuation: string | null, isInitial: boolean } | null {
    if (!stream.initialized) {
      return { channel: 'primary', continuation: null, isInitial: true }
    }
    if (stream.continuationFetches >= this.maxContinuations) return null
    for (const slot of stream.cursors) {
      if (!slot.done && slot.token) {
        return { channel: slot.channel, continuation: slot.token, isInitial: false }
      }
    }
    return null
  }

  private hasPendingCursor(stream: StreamState<any, any>): boolean {
    if (!stream.initialized) return true
    return stream.cursors.some(slot => !slot.done && Boolean(slot.token))
  }

  private buildWindow<T, M>(stream: StreamState<T, M>, page: number, limit: number): StreamWindowResult<T, M> {
    const start = (page - 1) * limit
    const end = page * limit
    const list = stream.items.slice(start, end)
    const pendingCursor = this.hasPendingCursor(stream)
    const atCap = stream.continuationFetches >= this.maxContinuations
    const truncated = stream.truncated || (!stream.exhausted && pendingCursor && atCap)
    // 多游标流若某一通道因重复游标中止，其余健康通道仍有游标时继续暴露下一页；同步入口另凭 truncated 保护
    const canFetchMore = !stream.exhausted && pendingCursor && !atCap
    const hasMore = stream.items.length > end || canFetchMore
    const total = canFetchMore
      ? Math.max(stream.items.length + 1, end + 1)
      : stream.items.length
    const allPage = total > 0 ? Math.ceil(total / limit) : 0
    return {
      list,
      total,
      limit,
      allPage,
      hasMore,
      truncated,
      generation: stream.generation,
      ephemeral: stream.ephemeral,
      ...(stream.meta !== undefined ? { meta: stream.meta } : {}),
    }
  }

  /**
   * 获取指定固定窗口 `[ (page-1)*limit, page*limit )`。
   * `getItemId` 用于跨页/多游标稳定去重；`expectedGeneration` 用于多页全量同步锁定同一代际。
   */
  fetchWindow<T, M = undefined>(options: {
    key: string
    page: number
    limit: number
    isRefresh?: boolean
    expectedGeneration?: number
    getItemId: (item: T) => string
    fetcher: StreamStepFetcher<T, M>
  }): YtmCancellablePromise<StreamWindowResult<T, M>> {
    const safePage = Number.isInteger(options.page) && options.page > 0 ? options.page : 1
    const safeLimit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 20
    if (options.isRefresh === true && options.expectedGeneration !== undefined) {
      const rejected = Promise.reject(new Error('stream generation changed')) as YtmCancellablePromise<StreamWindowResult<T, M>>
      rejected.cancel = () => {}
      return rejected
    }
    // 单次采样时钟：消除 expectedGeneration 预检与 getOrCreateStream 之间的 TTL 边界竞态
    const now = this.now()
    if (options.expectedGeneration !== undefined) {
      const existing = this.streams.get(options.key)
      if (!existing || existing.generation !== options.expectedGeneration || now - existing.fetchedAt > this.ttlMs) {
        const rejected = Promise.reject(new Error('stream generation changed')) as YtmCancellablePromise<StreamWindowResult<T, M>>
        rejected.cancel = () => {}
        return rejected
      }
    }
    const stream = this.getOrCreateStream<T, M>(options.key, options.isRefresh === true, now)
    if (options.expectedGeneration !== undefined && stream.generation !== options.expectedGeneration) {
      const rejected = Promise.reject(new Error('stream generation changed')) as YtmCancellablePromise<StreamWindowResult<T, M>>
      rejected.cancel = () => {}
      return rejected
    }
    const capturedGen = stream.generation
    const targetLen = safePage * safeLimit

    let callerCancelled = false
    let rejectCaller: ((err: Error) => void) | null = null
    let detachActiveWaiter: (() => void) | null = null

    const isCallerCancelled = () => callerCancelled

    const run = async(): Promise<StreamWindowResult<T, M>> => {
      while (!isCallerCancelled()) {
        if (stream.generation !== capturedGen) {
          throw new Error('request cancelled')
        }
        const needMore = !stream.initialized || stream.items.length < targetLen
        if (!needMore) break
        const stepCursor = this.nextCursor(stream)
        if (!stepCursor) {
          if (!stream.truncated && !this.hasPendingCursor(stream)) stream.exhausted = true
          break
        }

        if (!stream.inFlight) {
          let activeReq: YtmCancellablePromise<StreamFetchResult<T, M>> | null = null
          let stepAborted = false
          const stepPromise = (async() => {
            activeReq = options.fetcher({ ...stepCursor, meta: stream.meta })
            const res = await activeReq
            if (stepAborted || stream.generation !== capturedGen) return
            if (res.meta !== undefined && stream.meta === undefined) {
              stream.meta = res.meta
            }
            for (const item of res.items) {
              const id = options.getItemId(item)
              if (!id || stream.seenIds.has(id)) continue
              stream.seenIds.add(id)
              stream.items.push(item)
            }
            stream.fetchedAt = this.now()
            if (stepCursor.isInitial) {
              stream.initialized = true
              stream.cursors = [{
                channel: 'primary',
                token: res.continuation,
                done: !res.continuation,
              }]
              if (Array.isArray(res.extraCursors)) {
                for (const extra of res.extraCursors) {
                  if (extra.continuation) {
                    stream.cursors.push({
                      channel: extra.channel,
                      token: extra.continuation,
                      done: false,
                    })
                  }
                }
              }
            } else {
              stream.continuationFetches += 1
              const slot = stream.cursors.find(c => c.channel === stepCursor.channel)
              if (slot) {
                if (res.continuation && res.continuation === stepCursor.continuation) {
                  // 重复游标：中止续页防死循环，同时标记 truncated=true 防止同步误将残缺前缀覆盖收藏
                  slot.token = null
                  slot.done = true
                  stream.truncated = true
                } else {
                  const nextToken = res.continuation && res.continuation.length > 0 ? res.continuation : null
                  slot.token = nextToken
                  slot.done = !nextToken
                }
              }
            }
            if (res.ephemeral) {
              stream.ephemeral = true
              // 从主表摘除：本次并发等待者仍通过局部 stream 引用获取结果，后续请求将重新拉取完整数据
              if (this.streams.get(stream.key) === stream) {
                this.streams.delete(stream.key)
              }
            }
            if (!stream.truncated && !this.hasPendingCursor(stream)) {
              stream.exhausted = true
            }
          })().finally(() => {
            if (stream.inFlight?.promise === stepPromise) {
              stream.inFlight = null
            }
          })
          // 避免仅取消单个调用方时底层 promise 变成未捕获 rejection
          stepPromise.catch(() => {})
          const waiters = new Set<(err: Error) => void>()
          stream.inFlight = {
            promise: stepPromise,
            cancelUnderlying: () => {
              stepAborted = true
              try {
                activeReq?.cancel?.()
                activeReq?.cancelHttp?.()
              } catch {}
            },
            abortWaiters: () => {
              for (const rejectWaiter of Array.from(waiters)) {
                rejectWaiter(new Error('request cancelled'))
              }
              waiters.clear()
            },
            waiters,
          }
        }

        const flight = stream.inFlight
        let waiterReject: ((err: Error) => void) | null = null
        let detached = false
        const detach = (triggerCancel: boolean) => {
          if (detached) return
          detached = true
          if (waiterReject) flight.waiters.delete(waiterReject)
          if (triggerCancel && flight.waiters.size === 0) {
            // 同步摘除已中止的 inFlight，避免同 tick 紧随到达的重查误加入即将被取消的请求
            if (stream.inFlight === flight) stream.inFlight = null
            flight.cancelUnderlying()
          }
        }
        detachActiveWaiter = () => { detach(true) }
        try {
          await new Promise<void>((resolve, reject) => {
            waiterReject = reject
            rejectCaller = reject
            if (callerCancelled || stream.generation !== capturedGen) {
              reject(new Error('request cancelled'))
              return
            }
            flight.waiters.add(reject)
            flight.promise.then(resolve, reject)
          })
        } finally {
          rejectCaller = null
          detachActiveWaiter = null
          detach(false)
        }
      }

      if (callerCancelled || stream.generation !== capturedGen) {
        throw new Error('request cancelled')
      }
      return this.buildWindow(stream, safePage, safeLimit)
    }

    const wrapped = run() as YtmCancellablePromise<StreamWindowResult<T, M>>
    wrapped.cancel = () => {
      if (callerCancelled) return
      callerCancelled = true
      detachActiveWaiter?.()
      rejectCaller?.(new Error('request cancelled'))
    }
    return wrapped
  }
}

export const sharedYtmPaginationCache = new YtmPaginationCache()
