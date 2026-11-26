import { YTM_AGGREGATE_SEARCH_TIMEOUT_MS } from '@common/recommendationConfig'
import { markRawList } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'
import { getLiveYtmContextKey, isYtmAggregateSearchEnabled } from '@renderer/utils/musicSdk/ytm/runtimeContext'
import { sortInsert, similar } from '@common/utils/common'
import { requestMsg } from '@renderer/utils/message'

import type { ListInfoItem } from './state'
import { sources, maxPages, listInfos } from './state'

interface SearchResult {
  list: ListInfoItem[]
  limit: number
  total: number
  source: LX.OnlineSource
  partialFailure?: boolean
}

type CancellableSearchPromise = Promise<SearchResult> & {
  cancel?: () => void
  cancelHttp?: () => void
}

const isCancelError = (error: unknown): boolean => {
  return error instanceof Error && (error.message === requestMsg.cancelRequest || /cancel/i.test(error.message))
}

/**
 * 按搜索关键词重新排序列表
 * @param list 歌曲列表
 * @param keyword 搜索关键词
 * @returns 排序后的列表
 */
const handleSortList = (list: ListInfoItem[], keyword: string) => {
  let arr: any[] = []
  for (const item of list) {
    sortInsert(arr, {
      num: similar(keyword, item.name),
      data: item,
    })
  }
  return arr.map(item => item.data).reverse()
}


let maxTotals: Partial<Record<LX.OnlineSource, number>> = {}
const setLists = (results: SearchResult[], page: number, text: string): ListInfoItem[] => {
  let totals: number[] = []
  let pages: number[] = []
  let limit = 0
  let list: ListInfoItem[] = []
  for (const source of results) {
    maxTotals[source.source] = source.total
    const sourcePages = source.total > 0 ? Math.ceil(source.total / source.limit) : 0
    maxPages[source.source] = sourcePages
    limit = Math.max(source.limit, limit)
    // 与音乐聚合搜索保持一致：跳过总页数小于当前页的源，避免单页源拉低翻页总数
    if (sourcePages < page) continue
    list.push(...source.list)
    totals.push(source.total)
    pages.push(sourcePages)
  }
  markRawList(list)

  let listInfo = listInfos.all
  const maxAllPage = Math.max(0, ...pages)
  const rawTotal = Math.max(0, ...totals)
  const alignedTotal = maxAllPage > 1
    ? Math.max(rawTotal, (maxAllPage - 1) * listInfo.limit + 1)
    : rawTotal
  if (page == 1 || alignedTotal) listInfo.total = alignedTotal
  else listInfo.total = Math.max(limit, listInfo.limit) * page
  listInfo.page = page
  listInfo.list = handleSortList(list, text)
  if (text && !list.length && page == 1) listInfo.noItemLabel = window.i18n.t('no_item')
  else listInfo.noItemLabel = ''
  return listInfo.list
}

const setList = (datas: SearchResult, page: number, text: string): ListInfoItem[] => {
  let listInfo = listInfos[datas.source]!
  listInfo.list = markRawList(datas.list)
  if (page == 1 || (datas.total && datas.list.length)) listInfo.total = datas.total
  else listInfo.total = datas.limit * page
  listInfo.page = page
  listInfo.limit = datas.limit
  if (text && !datas.list.length && page == 1) listInfo.noItemLabel = window.i18n.t('no_item')
  else listInfo.noItemLabel = ''
  return listInfo.list
}

const requestVersions = new Map<string, number>()
const completedKeys = new Map<string, string>()
const activeCancels = new Map<string, Array<() => void>>()

const cancelSlot = (sourceId: LX.OnlineSource | 'all') => {
  const cancels = activeCancels.get(sourceId)
  if (!cancels) return
  activeCancels.delete(sourceId)
  for (const fn of cancels) {
    try { fn() } catch {}
  }
}

export const cancelSearch = (sourceId: LX.OnlineSource | 'all'): void => {
  if (!activeCancels.has(sourceId)) return
  cancelSlot(sourceId)
  requestVersions.set(sourceId, (requestVersions.get(sourceId) ?? 0) + 1)
  const listInfo = listInfos[sourceId]
  if (!listInfo) return
  listInfo.key = null
  if (listInfo.noItemLabel === window.i18n.t('list__loading')) {
    listInfo.noItemLabel = ''
  }
}

export const resetListInfo = (sourceId: LX.OnlineSource | 'all'): [] => {
  cancelSlot(sourceId)
  completedKeys.delete(sourceId)
  requestVersions.set(sourceId, (requestVersions.get(sourceId) ?? 0) + 1)
  let listInfo = listInfos[sourceId]
  if (!listInfo) return []
  listInfo.error = ''
  listInfo.key = null
  listInfo.page = 1
  listInfo.limit = sourceId === 'all' ? 15 : 18
  listInfo.total = 0
  listInfo.list = []
  listInfo.noItemLabel = ''
  listInfo.tagId = ''
  listInfo.sortId = ''
  return []
}

/** Expected provider failures are represented in UI state, never as an unhandled view promise. */
export const search = async(text: string, page: number, sourceId: LX.OnlineSource | 'all'): Promise<ListInfoItem[]> => {
  const listInfo = listInfos[sourceId]
  if (!listInfo) return []
  if (!text) return resetListInfo(sourceId)

  const hasYtmSource = sources.includes('ytm')
  const ytmCtx = (sourceId === 'ytm' || (sourceId === 'all' && hasYtmSource)) ? getLiveYtmContextKey() : ''
  const includeYtmInAll = sourceId === 'all' && hasYtmSource && isYtmAggregateSearchEnabled(ytmCtx)
  const key = sourceId === 'all'
    ? `${page}__${text}__ytm=${includeYtmInAll ? `1:${ytmCtx}` : '0'}`
    : sourceId === 'ytm'
      ? `${page}__${text}__ctx=${ytmCtx}`
      : `${page}__${text}`

  if (completedKeys.get(sourceId) === key && listInfo.key === key && listInfo.list.length && !listInfo.error) return listInfo.list

  cancelSlot(sourceId)
  const requestId = (requestVersions.get(sourceId) ?? 0) + 1
  requestVersions.set(sourceId, requestId)
  const isCurrent = () => requestVersions.get(sourceId) === requestId
  completedKeys.delete(sourceId)
  listInfo.key = key
  listInfo.error = ''
  listInfo.noItemLabel = window.i18n.t('list__loading')

  const failures: string[] = []
  let cancelled = false
  const cancels: Array<() => void> = []
  activeCancels.set(sourceId, cancels)

  const load = async(source: LX.OnlineSource, softTimeoutMs?: number): Promise<SearchResult | null> => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let timedOut = false
    try {
      const req = music[source]?.songList.search(text, page, listInfo.limit) as CancellableSearchPromise | undefined
      if (!req) throw new Error('Provider unavailable')
      const abortReq = () => {
        try {
          req.cancel?.()
          req.cancelHttp?.()
        } catch {}
      }
      cancels.push(abortReq)
      let data: SearchResult
      if (softTimeoutMs && softTimeoutMs > 0) {
        data = await new Promise<SearchResult>((resolve, reject) => {
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
      if (!data || data.source !== source || !Array.isArray(data.list) || !Number.isFinite(data.total) || data.total < 0 || !Number.isFinite(data.limit) || data.limit <= 0) {
        throw new Error('Invalid search response')
      }
      if (data.partialFailure) failures.push(source)
      return data
    } catch (error) {
      if (!timedOut && isCancelError(error)) cancelled = true
      else failures.push(source)
      return null
    } finally {
      if (timer != null) clearTimeout(timer)
    }
  }

  try {
    if (sourceId !== 'all') {
      const result = await load(sourceId)
      if (!isCurrent()) return []
      if (!result) {
        listInfo.error = failures.length ? window.i18n.t('list__load_failed') : ''
        listInfo.noItemLabel = listInfo.list.length ? '' : listInfo.error
        if (cancelled) listInfo.key = null
        return []
      }
      const list = setList(result, page, text)
      listInfo.error = failures.length ? window.i18n.t('list__load_failed') : ''
      if (!list.length && failures.length) listInfo.noItemLabel = listInfo.error
      if (cancelled) listInfo.key = null
      else if (!failures.length) completedKeys.set(sourceId, key)
      return list
    }

    const domesticSources = sources.filter((source): source is LX.OnlineSource => source !== 'all' && source !== 'ytm')
    const domesticPromise = Promise.all(domesticSources.map(async src => load(src)))
    const ytmPromise = includeYtmInAll ? load('ytm', YTM_AGGREGATE_SEARCH_TIMEOUT_MS) : null

    const domesticResults = await domesticPromise
    if (!isCurrent()) return []
    const domesticSuccess = domesticResults.filter((data): data is SearchResult => data !== null)

    let currentList: ListInfoItem[] = []
    if (domesticSuccess.length) {
      currentList = setLists(domesticSuccess, page, text)
      if (failures.length) {
        listInfo.error = window.i18n.t('list__load_failed') + ` (${failures.join(', ')})`
      }
      if (ytmPromise && !currentList.length) {
        listInfo.noItemLabel = window.i18n.t('list__loading')
      }
    }

    let finalSuccess = domesticSuccess
    if (ytmPromise) {
      const ytmResult = await ytmPromise
      if (!isCurrent()) return []
      if (ytmResult) {
        finalSuccess = [...domesticSuccess, ytmResult]
        currentList = setLists(finalSuccess, page, text)
      }
    }

    if (!finalSuccess.length) {
      listInfo.error = failures.length ? window.i18n.t('list__load_failed') : ''
      listInfo.noItemLabel = listInfo.list.length ? '' : listInfo.error
      if (cancelled) listInfo.key = null
      return []
    }

    listInfo.error = failures.length ? window.i18n.t('list__load_failed') + ` (${failures.join(', ')})` : ''
    if (!currentList.length) {
      listInfo.noItemLabel = failures.length
        ? listInfo.error
        : (page == 1 ? window.i18n.t('no_item') : '')
    }
    if (cancelled) listInfo.key = null
    else if (!failures.length) completedKeys.set(sourceId, key)
    return currentList
  } catch {
    if (!isCurrent()) return []
    listInfo.error = window.i18n.t('list__load_failed')
    listInfo.noItemLabel = listInfo.list.length ? '' : listInfo.error
    return []
  } finally {
    if (activeCancels.get(sourceId) === cancels) activeCancels.delete(sourceId)
  }
}
