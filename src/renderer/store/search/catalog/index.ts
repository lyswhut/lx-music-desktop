import { DOMESTIC_ONLINE_SOURCES } from '@common/constants'
import { YTM_AGGREGATE_SEARCH_TIMEOUT_MS } from '@common/recommendationConfig'
import { markRaw, markRawList, reactive } from '@common/utils/vueTools'
import { similar, sortInsert } from '@common/utils/common'
import { getCatalogSourceLabel } from '@renderer/core/catalog/adapter'
import { requestMsg } from '@renderer/utils/message'
import music from '@renderer/utils/musicSdk'
import { getLiveYtmContextKey, isYtmAggregateSearchEnabled } from '@renderer/utils/musicSdk/ytm/runtimeContext'

export type CatalogSearchKind = 'artist' | 'album'
export type CatalogSearchSource = LX.OnlineSource | 'all'

export interface SearchCatalogItem {
  id: string | number
  name: string
  img: string
  source: LX.OnlineSource
  singer?: string
  publishTime?: string
  songCount?: number | null
  albumCount?: number | null
}

export interface CatalogSearchListInfo {
  page: number
  limit: number
  total: number
  list: SearchCatalogItem[]
  key: string | null
  noItemLabel: string
  error: string
}

export interface CatalogSearchPageResult {
  list: SearchCatalogItem[]
  limit: number
  total: number
  source: LX.OnlineSource
}

type CancellableCatalogPromise = Promise<CatalogSearchPageResult> & { cancel?: () => void }
type CatalogSearchProvider = (text: string, page: number, limit: number) => CancellableCatalogPromise

const getRegisteredSources = (): LX.OnlineSource[] => {
  const list = Array.isArray((music as { sources?: Array<{ id: string }> }).sources)
    ? (music as { sources: Array<{ id: string }> }).sources.map(s => s.id as LX.OnlineSource)
    : [...DOMESTIC_ONLINE_SOURCES, 'ytm'] as LX.OnlineSource[]
  return list
}

const sortByKeyword = (list: SearchCatalogItem[], keyword: string): SearchCatalogItem[] => {
  const arr: Array<{ num: number, data: SearchCatalogItem }> = []
  for (const item of list) {
    const score = similar(keyword, item.name)
    sortInsert(arr, { num: score, data: item })
  }
  return arr.map(entry => entry.data).reverse()
}

const createEmptyListInfo = (limit: number): CatalogSearchListInfo => reactive<CatalogSearchListInfo>({
  page: 1,
  limit,
  total: 0,
  list: [],
  key: null,
  noItemLabel: '',
  error: '',
})

const getDefaultProvider = (kind: CatalogSearchKind, source: LX.OnlineSource): CatalogSearchProvider | null => {
  const sdk = (music as Record<string, any>)[source]
  const mod = kind === 'artist' ? sdk?.singer : sdk?.album
  return typeof mod?.search === 'function' ? mod.search.bind(mod) : null
}

export interface CatalogSearchStoreOptions {
  isYtmAggregateEnabled?: (contextKey?: string) => boolean
  getYtmContextKey?: () => string
  ytmAggregateTimeoutMs?: number
}

export const createCatalogSearchStore = (
  resolveProvider: (kind: CatalogSearchKind, source: LX.OnlineSource) => CatalogSearchProvider | null = getDefaultProvider,
  availableSources: LX.OnlineSource[] = getRegisteredSources(),
  options: CatalogSearchStoreOptions = {},
) => {
  const checkYtmAggregate = options.isYtmAggregateEnabled ?? isYtmAggregateSearchEnabled
  const getYtmCtx = options.getYtmContextKey ?? getLiveYtmContextKey
  const ytmAggTimeoutMs = options.ytmAggregateTimeoutMs ?? YTM_AGGREGATE_SEARCH_TIMEOUT_MS

  const createKindState = (kind: CatalogSearchKind) => {
    const enabledSources: LX.OnlineSource[] = []
    const infos: Partial<Record<LX.OnlineSource, CatalogSearchListInfo>> & { all: CatalogSearchListInfo } = {
      all: createEmptyListInfo(15),
    }

    for (const source of availableSources) {
      if (!resolveProvider(kind, source)) continue
      enabledSources.push(source)
      infos[source] = createEmptyListInfo(20)
    }

    return {
      sources: markRaw([...enabledSources, 'all'] as CatalogSearchSource[]),
      enabledSources,
      listInfos: markRaw(infos),
      requestVersions: new Map<string, number>(),
      completedKeys: new Map<string, string>(),
      activeCancels: new Map<string, Array<() => void>>(),
    }
  }

  const stores = {
    artist: createKindState('artist'),
    album: createKindState('album'),
  }

  const cancelSlot = (kind: CatalogSearchKind, sourceId: CatalogSearchSource) => {
    const cancels = stores[kind].activeCancels.get(sourceId)
    if (!cancels) return
    stores[kind].activeCancels.delete(sourceId)
    for (const fn of cancels) {
      try { fn() } catch {}
    }
  }

  const cancelSearch = (kind: CatalogSearchKind, sourceId: CatalogSearchSource) => {
    const bucket = stores[kind]
    if (!bucket.activeCancels.has(sourceId)) return
    cancelSlot(kind, sourceId)
    bucket.requestVersions.set(sourceId, (bucket.requestVersions.get(sourceId) ?? 0) + 1)
    const listInfo = bucket.listInfos[sourceId]
    if (!listInfo) return
    listInfo.key = null
    if (listInfo.noItemLabel === window.i18n.t('list__loading')) {
      listInfo.noItemLabel = ''
    }
  }

  const resetListInfo = (kind: CatalogSearchKind, sourceId: CatalogSearchSource): SearchCatalogItem[] => {
    const bucket = stores[kind]
    cancelSlot(kind, sourceId)
    bucket.completedKeys.delete(sourceId)
    bucket.requestVersions.set(sourceId, (bucket.requestVersions.get(sourceId) ?? 0) + 1)
    const listInfo = bucket.listInfos[sourceId]
    if (!listInfo) return []
    listInfo.error = ''
    listInfo.key = null
    listInfo.page = 1
    listInfo.limit = sourceId === 'all' ? 15 : 20
    listInfo.total = 0
    listInfo.list = []
    listInfo.noItemLabel = ''
    return []
  }

  const applyAggregateResults = (
    listInfo: CatalogSearchListInfo,
    successful: CatalogSearchPageResult[],
    safePage: number,
    trimmed: string,
  ): SearchCatalogItem[] => {
    const merged: SearchCatalogItem[] = []
    const seenKeys = new Set<string>()
    let maxTotal = 0
    let maxAllPage = 0
    for (const res of successful) {
      for (const item of res.list) {
        const itemKey = `${item.source}:${item.id}`
        if (seenKeys.has(itemKey)) continue
        seenKeys.add(itemKey)
        merged.push(item)
      }
      maxTotal = Math.max(maxTotal, res.total)
      if (res.total > 0 && res.limit > 0) {
        maxAllPage = Math.max(maxAllPage, Math.ceil(res.total / res.limit))
      }
    }
    markRawList(merged)
    listInfo.list = sortByKeyword(merged, trimmed)
    listInfo.page = safePage
    // 聚合页宽保持固定 15 不被单源（如 20）改写，防止国内源翻页跳项；total 在全页统一按最大页数对齐
    const pageLimit = listInfo.limit
    const alignedTotal = maxAllPage > 1
      ? Math.max(maxTotal, (maxAllPage - 1) * pageLimit + 1)
      : maxTotal
    listInfo.total = merged.length
      ? Math.max(alignedTotal, (safePage - 1) * pageLimit + 1)
      : alignedTotal
    return listInfo.list
  }

  const search = async(
    kind: CatalogSearchKind,
    text: string,
    page: number,
    sourceId: CatalogSearchSource,
  ): Promise<SearchCatalogItem[]> => {
    const bucket = stores[kind]
    const listInfo = bucket.listInfos[sourceId]
    if (!listInfo) return []
    const trimmed = text.trim()
    if (!trimmed) return resetListInfo(kind, sourceId)

    const safePage = Number.isInteger(page) && page > 0 ? page : 1
    const hasYtmEnabled = bucket.enabledSources.includes('ytm')
    const ytmCtx = (sourceId === 'ytm' || (sourceId === 'all' && hasYtmEnabled)) ? getYtmCtx() : ''
    const includeYtmInAll = sourceId === 'all' && hasYtmEnabled && checkYtmAggregate(ytmCtx)
    const key = sourceId === 'all'
      ? `${safePage}__${trimmed}__ytm=${includeYtmInAll ? `1:${ytmCtx}` : '0'}`
      : sourceId === 'ytm'
        ? `${safePage}__${trimmed}__ctx=${ytmCtx}`
        : `${safePage}__${trimmed}`

    if (bucket.completedKeys.get(sourceId) === key && listInfo.key === key && listInfo.list.length && !listInfo.error) {
      return listInfo.list
    }

    cancelSlot(kind, sourceId)
    const requestId = (bucket.requestVersions.get(sourceId) ?? 0) + 1
    bucket.requestVersions.set(sourceId, requestId)
    const isCurrent = () => bucket.requestVersions.get(sourceId) === requestId

    bucket.completedKeys.delete(sourceId)
    listInfo.key = key
    listInfo.error = ''
    listInfo.noItemLabel = window.i18n.t('list__loading')

    const failures: LX.OnlineSource[] = []
    let cancelled = false
    const cancels: Array<() => void> = []
    bucket.activeCancels.set(sourceId, cancels)

    const loadOne = async(source: LX.OnlineSource, softTimeoutMs?: number): Promise<CatalogSearchPageResult | null> => {
      const provider = resolveProvider(kind, source)
      if (!provider) {
        failures.push(source)
        return null
      }
      let timer: ReturnType<typeof setTimeout> | null = null
      let timedOut = false
      try {
        const req = provider(trimmed, safePage, listInfo.limit)
        const abortReq = () => {
          try { req?.cancel?.() } catch {}
        }
        cancels.push(abortReq)
        let data: CatalogSearchPageResult
        if (softTimeoutMs && softTimeoutMs > 0) {
          data = await new Promise<CatalogSearchPageResult>((resolve, reject) => {
            timer = setTimeout(() => {
              timedOut = true
              abortReq()
              reject(new Error('search timeout'))
            }, softTimeoutMs)
            cancels.push(() => { if (timer != null) clearTimeout(timer) })
            req.then(resolve, reject)
          })
        } else {
          data = await req
        }
        if (
          !data ||
          data.source !== source ||
          !Array.isArray(data.list) ||
          !Number.isFinite(data.total) ||
          data.total < 0 ||
          !Number.isFinite(data.limit) ||
          data.limit <= 0
        ) {
          throw new Error('Invalid search response')
        }
        return data
      } catch (error) {
        if (!timedOut && error instanceof Error && (error.message === requestMsg.cancelRequest || /cancel/i.test(error.message))) cancelled = true
        else failures.push(source)
        return null
      } finally {
        if (timer != null) clearTimeout(timer)
      }
    }

    try {
      if (sourceId !== 'all') {
        const result = await loadOne(sourceId)
        if (!isCurrent()) return []
        if (!result) {
          listInfo.list = []
          listInfo.total = 0
          listInfo.page = safePage
          listInfo.error = failures.length ? window.i18n.t('list__load_failed') : ''
          listInfo.noItemLabel = listInfo.error || window.i18n.t('no_item')
          if (cancelled) listInfo.key = null
          return []
        }
        const seenKeys = new Set<string>()
        const deduped = result.list.filter(item => {
          const itemKey = `${item.source}:${item.id}`
          if (seenKeys.has(itemKey)) return false
          seenKeys.add(itemKey)
          return true
        })
        listInfo.list = markRawList(deduped)
        listInfo.page = safePage
        listInfo.limit = result.limit
        listInfo.total = deduped.length
          ? Math.max(result.total, (safePage - 1) * result.limit + deduped.length)
          : result.total
        listInfo.error = ''
        listInfo.noItemLabel = listInfo.list.length ? '' : window.i18n.t('no_item')
        if (cancelled) listInfo.key = null
        else bucket.completedKeys.set(sourceId, key)
        return listInfo.list
      }

      const domesticTargets = bucket.enabledSources.filter(s => s !== 'ytm')
      const domesticPromise = Promise.all(domesticTargets.map(async s => loadOne(s)))
      const ytmPromise = includeYtmInAll ? loadOne('ytm', ytmAggTimeoutMs) : null

      const domesticResults = await domesticPromise
      if (!isCurrent()) return []
      const domesticSuccessful = domesticResults.filter((data): data is CatalogSearchPageResult => data !== null)

      // 渐进发布国内源结果，不因 YTM pending 阻塞展示
      if (domesticSuccessful.length) {
        applyAggregateResults(listInfo, domesticSuccessful, safePage, trimmed)
        const earlyFailLabels = failures.map(getCatalogSourceLabel)
        listInfo.error = earlyFailLabels.length ? `${window.i18n.t('list__load_failed')} (${earlyFailLabels.join(', ')})` : ''
        listInfo.noItemLabel = listInfo.list.length
          ? ''
          : (ytmPromise ? window.i18n.t('list__loading') : (listInfo.error || window.i18n.t('no_item')))
      }

      let finalSuccessful = domesticSuccessful
      if (ytmPromise) {
        const ytmResult = await ytmPromise
        if (!isCurrent()) return []
        if (ytmResult) {
          finalSuccessful = [...domesticSuccessful, ytmResult]
          applyAggregateResults(listInfo, finalSuccessful, safePage, trimmed)
        }
      }

      if (!finalSuccessful.length) {
        listInfo.list = []
        listInfo.total = 0
        listInfo.page = safePage
        listInfo.error = failures.length ? window.i18n.t('list__load_failed') : ''
        listInfo.noItemLabel = listInfo.error || window.i18n.t('no_item')
        if (cancelled) listInfo.key = null
        return []
      }

      const failureLabels = failures.map(getCatalogSourceLabel)
      listInfo.error = failureLabels.length ? `${window.i18n.t('list__load_failed')} (${failureLabels.join(', ')})` : ''
      listInfo.noItemLabel = listInfo.list.length
        ? ''
        : (listInfo.error || window.i18n.t('no_item'))

      if (cancelled) listInfo.key = null
      else if (!failures.length) bucket.completedKeys.set(sourceId, key)
      return listInfo.list
    } catch (error) {
      if (!isCurrent()) return []
      console.error(error)
      listInfo.error = window.i18n.t('list__load_failed')
      listInfo.noItemLabel = listInfo.list.length ? '' : listInfo.error
      return []
    } finally {
      if (bucket.activeCancels.get(sourceId) === cancels) bucket.activeCancels.delete(sourceId)
    }
  }

  return {
    getListInfo: (kind: CatalogSearchKind, sourceId: CatalogSearchSource): CatalogSearchListInfo | undefined => stores[kind].listInfos[sourceId],
    getSources: (kind: CatalogSearchKind) => stores[kind].sources,
    search,
    cancel: cancelSearch,
    resetListInfo,
  }
}

const defaultStore = createCatalogSearchStore()

export const getCatalogSearchListInfo = defaultStore.getListInfo
export const getCatalogSearchSources = defaultStore.getSources
export const searchCatalog = defaultStore.search
export const cancelCatalogSearch = defaultStore.cancel
