// import { getSongListSetting } from '@renderer/utils/data'
import { deduplicationList, toNewMusicInfo } from '@renderer/utils'
import musicSdk from '@renderer/utils/musicSdk'
import { getLiveYtmContextKey, resolveLiveYtmProxy } from '@renderer/utils/musicSdk/ytm/runtimeContext'
import type { YtmPlaylistDetailFetchOptions } from '@renderer/utils/musicSdk/ytm'
import { markRaw, markRawList } from '@common/utils/vueTools'
import {
  tags,
  listInfo,
  listDetailInfo,
  selectListInfo,
  isVisibleListDetail,
  openSongListInputInfo,
} from './state'
import type {
  ListDetailInfo,
  ListInfoItem,
  ListInfo,
  TagInfo,
} from './state'

const cache = new Map<string, any>()
const cacheTokens = new Map<string, number>()
let cacheTokenSeq = 0
const tagsContextKeys: Partial<Record<LX.OnlineSource, string>> = {}
let listRequestToken = 0
let listDetailRequestToken = 0
let listIsPartial = false

const nextCacheToken = (key: string): number => {
  const token = ++cacheTokenSeq
  cacheTokens.set(key, token)
  return token
}

export const setTags = (tagInfo: TagInfo, source: LX.OnlineSource, contextKey?: string) => {
  tags[source] = markRaw(tagInfo)
  if (contextKey !== undefined) tagsContextKeys[source] = contextKey
}

export const getCachedTags = <T extends LX.OnlineSource>(source: T): TagInfo<T> | undefined => {
  if (source === 'ytm') {
    if (tagsContextKeys.ytm !== getLiveYtmContextKey()) return undefined
  }
  return tags[source] as TagInfo<T> | undefined
}

export const clearList = () => {
  listRequestToken++
  listIsPartial = false
  listInfo.list = []
  listInfo.total = 0
  listInfo.noItemLabel = ''
  listInfo.page = 1
  listInfo.key = ''
}

type ListResultWithPartial = ListInfo & { partial?: boolean }

export const setList = (result: ListResultWithPartial, tagId: string, sortId: string, page: number) => {
  listIsPartial = Boolean(result.partial)
  listInfo.list = markRaw([...result.list])
  if (page == 1 || (result.total && result.list.length)) listInfo.total = result.total
  else listInfo.total = result.limit * page
  listInfo.limit = result.limit
  listInfo.page = page
  listInfo.source = result.source
  listInfo.tagId = tagId
  listInfo.sortId = sortId
  if (result.list.length) listInfo.noItemLabel = ''
  else if (page == 1) listInfo.noItemLabel = window.i18n.t('no_item')
  else listInfo.noItemLabel = ''
}
export const setListDetail = (result: ListDetailInfo, id: string, page: number) => {
  listDetailInfo.list = markRaw([...result.list])
  listDetailInfo.id = id
  listDetailInfo.source = result.source
  if (page == 1 || (result.total && result.list.length)) listDetailInfo.total = result.total
  else listDetailInfo.total = result.limit * page
  listDetailInfo.limit = result.limit
  listDetailInfo.page = page
  listDetailInfo.info = markRaw({ ...result.info })
  if (result.list.length) listDetailInfo.noItemLabel = ''
  else if (page == 1) listDetailInfo.noItemLabel = window.i18n.t('no_item')
  else listDetailInfo.noItemLabel = ''
}

export const setSelectListInfo = (info: ListInfoItem) => {
  selectListInfo.author = info.author
  selectListInfo.desc = info.desc
  selectListInfo.id = info.id
  selectListInfo.img = info.img
  selectListInfo.name = info.name
  selectListInfo.play_count = info.play_count
  selectListInfo.source = info.source
}
export const clearListDetail = () => {
  listDetailRequestToken++
  listDetailInfo.list = []
  listDetailInfo.id = ''
  listDetailInfo.source = 'kw'
  listDetailInfo.total = 0
  listDetailInfo.limit = 30
  listDetailInfo.page = 1
  listDetailInfo.key = null
  listDetailInfo.info = {}
  listDetailInfo.noItemLabel = ''
}

// 保留底层 YTM SDK 返回的可取消 Promise（含 .cancel()），供组件 onCleanup 中止在途 HTTP
// eslint-disable-next-line @typescript-eslint/promise-function-async
export const getTags = <T extends LX.OnlineSource>(source: T) => {
  return (musicSdk[source]?.songList.getTags() ?? Promise.reject(new Error('source not found: ' + source))) as Promise<TagInfo<T>> & { cancel?: () => void }
}


/**
 * 获取歌单列表
 * @param source 歌单源
 * @param tabId 类型id
 * @param sortId 排序
 * @param page 页数
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getAndSetList = async(source: LX.OnlineSource, tabId: string, sortId: string, page: number, isRefresh = false) => {
  const isYtm = source === 'ytm'
  const ytmContextKey = isYtm ? getLiveYtmContextKey() : ''
  const key = isYtm
    ? `slist__${source}__${ytmContextKey}__${sortId}__${tabId}__${page}`
    : `slist__${source}__${sortId}__${tabId}__${page}`
  if (!isRefresh) {
    // 若当前视图展示的是部分失败的临时结果（如 YTM 榜单单侧失败），不短路重查以允许恢复完整列表
    if (!listIsPartial && listInfo.key == key && listInfo.list.length) return
    if (!isYtm && cache.has(key)) {
      listRequestToken++
      listInfo.key = key
      setList(cache.get(key), tabId, sortId, page)
      return
    }
  }
  const reqToken = ++listRequestToken
  const cacheToken = !isYtm ? nextCacheToken(key) : 0
  listInfo.noItemLabel = window.i18n.t('list__loading')
  listInfo.key = key
  const req = isYtm
    ? musicSdk.ytm.songList.getList(sortId, tabId, page, isRefresh)
    : musicSdk[source]?.songList.getList(sortId, tabId, page)
  if (!req) {
    if (!isYtm && cacheTokens.get(key) === cacheToken) cacheTokens.delete(key)
    if (reqToken !== listRequestToken || key != listInfo.key) return
    clearList()
    listInfo.noItemLabel = window.i18n.t('list__load_failed')
    throw new Error('source not found: ' + source)
  }
  return req.then((result: ListResultWithPartial) => {
    const normalized: ListResultWithPartial = {
      ...result,
      list: [...result.list],
    }
    if (!isYtm && cacheTokens.get(key) === cacheToken) cache.set(key, normalized)
    if (reqToken !== listRequestToken || key != listInfo.key) return
    if (isYtm && ytmContextKey !== getLiveYtmContextKey()) return
    setList(normalized, tabId, sortId, page)
  }).catch((error: any) => {
    if (reqToken !== listRequestToken || key != listInfo.key) return
    if (isYtm && ytmContextKey !== getLiveYtmContextKey()) return
    clearList()
    listInfo.noItemLabel = window.i18n.t('list__load_failed')
    console.log(error)
    throw error
  }).finally(() => {
    if (!isYtm && cacheTokens.get(key) === cacheToken) cacheTokens.delete(key)
  })
}

/**
 * 获取歌单内单页歌曲
 * @param id 歌单id
 * @param source 歌单源
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetail = async(
  id: string,
  source: LX.OnlineSource,
  page: number,
  isRefresh = false,
  ytmOptions?: YtmPlaylistDetailFetchOptions,
): Promise<ListDetailInfo> => {
  const isYtm = source === 'ytm'
  const key = `sdetail__${source}__${id}__${page}`
  if (!isYtm && !isRefresh && cache.has(key)) return cache.get(key)
  const cacheToken = !isYtm ? nextCacheToken(key) : 0

  const req = isYtm
    ? musicSdk.ytm.songList.getListDetail(id, page, isRefresh, ytmOptions)
    : musicSdk[source]?.songList.getListDetail(id, page)
  if (!req) {
    if (!isYtm && cacheTokens.get(key) === cacheToken) cacheTokens.delete(key)
    return Promise.reject(new Error('source not found: ' + source))
  }

  return req.then((result: ListDetailInfo) => {
    const normalized: ListDetailInfo = {
      ...result,
      list: markRawList(deduplicationList(result.list.map(m => toNewMusicInfo(m)) as LX.Music.MusicInfoOnline[])),
    }
    if (!isYtm && cacheTokens.get(key) === cacheToken) cache.set(key, normalized)
    return normalized
  }).finally(() => {
    if (!isYtm && cacheTokens.get(key) === cacheToken) cacheTokens.delete(key)
  })
}

export interface GetListDetailAllOptions {
  failOnTruncated?: boolean
}

const MAX_LIST_DETAIL_PAGES = 500

/**
 * 获取歌单内全部歌曲
 * @param id 歌单id
 * @param source 歌单源
 * @param isRefresh 是否跳过缓存
 * @param options 可选同步防护配置（如 failOnTruncated）
 * @returns
 */
export const getListDetailAll = async(
  id: string,
  source: LX.OnlineSource,
  isRefresh = false,
  options?: GetListDetailAllOptions,
): Promise<LX.Music.MusicInfoOnline[]> => {
  const isYtm = source === 'ytm'
  const lockedCtx = isYtm ? resolveLiveYtmProxy() : undefined
  let expectedGeneration: number | undefined
  const allList: LX.Music.MusicInfoOnline[] = []
  let page = 1

  while (page <= MAX_LIST_DETAIL_PAGES) {
    if (isYtm && lockedCtx && getLiveYtmContextKey() !== lockedCtx.contextKey) {
      throw new Error('YouTube Music 代理配置已变更，已中止歌单同步')
    }
    // YTM 分页流仅在第 1 页透传 isRefresh，后续页锁定同一代理上下文与流代际
    const pageRefresh = isYtm ? (page === 1 && isRefresh) : isRefresh
    const ytmOptions: YtmPlaylistDetailFetchOptions | undefined = isYtm
      ? {
          ctx: lockedCtx,
          ...(page > 1 && expectedGeneration !== undefined ? { expectedGeneration } : {}),
        }
      : undefined
    const result = await getListDetail(id, source, page, pageRefresh, ytmOptions)
    if (isYtm && lockedCtx && getLiveYtmContextKey() !== lockedCtx.contextKey) {
      throw new Error('YouTube Music 代理配置已变更，已中止歌单同步')
    }
    if (isYtm && page === 1 && typeof result.generation === 'number') {
      expectedGeneration = result.generation
    }
    allList.push(...result.list)

    if (options?.failOnTruncated && result.truncated) {
      throw new Error('歌单曲目超过单次分页上限被截断，已中止同步以保护原列表')
    }

    let hasNextPage = false
    if (typeof result.hasMore === 'boolean') {
      hasNextPage = result.hasMore
    } else {
      // 酷我/咪咕等国内 SDK 可能返回数字字符串 total/limit，须先转数值再判有限性；
      // 列表非空却返回无效/非正 total（如 null/""/0/NaN）时，严格同步必须抛错拒绝按首屏截断覆盖收藏
      const total = Number(result.total)
      const limit = Number(result.limit)
      if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(limit) || limit <= 0) {
        if (options?.failOnTruncated && result.list.length > 0) {
          throw new Error('歌单分页信息异常，已中止同步以保护原列表')
        }
        break
      }
      const maxPage = Math.ceil(total / limit)
      hasNextPage = page < maxPage
    }
    if (!hasNextPage) break
    if (page >= MAX_LIST_DETAIL_PAGES) {
      if (options?.failOnTruncated) {
        throw new Error('歌单曲目超过单次分页上限被截断，已中止同步以保护原列表')
      }
      break
    }
    page++
  }

  return deduplicationList(allList)
}


/**
 * 获取并设置歌单内单页歌曲
 * @param id 歌单id
 * @param source 歌单源
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getAndSetListDetail = async(id: string, source: LX.OnlineSource, page: number, isRefresh = false) => {
  const isYtm = source === 'ytm'
  const ytmContextKey = isYtm ? getLiveYtmContextKey() : ''
  const key = isYtm
    ? `sdetail__${source}__${ytmContextKey}__${id}__${page}`
    : `sdetail__${source}__${id}__${page}`

  if (!isRefresh && listDetailInfo.key == key && listDetailInfo.list.length) return

  const reqToken = ++listDetailRequestToken
  listDetailInfo.key = key
  listDetailInfo.noItemLabel = window.i18n.t('list__loading')

  return getListDetail(id, source, page, isRefresh).then((result: ListDetailInfo) => {
    if (reqToken !== listDetailRequestToken || key != listDetailInfo.key) return
    if (isYtm && ytmContextKey !== getLiveYtmContextKey()) return
    setListDetail(result, id, page)
  }).catch((error: any) => {
    if (reqToken !== listDetailRequestToken || key != listDetailInfo.key) return
    if (isYtm && ytmContextKey !== getLiveYtmContextKey()) return
    clearListDetail()
    listDetailInfo.noItemLabel = window.i18n.t('list__load_failed')
    console.log(error)
    throw error
  })
}

export const setVisibleListDetail = (visible: boolean) => {
  isVisibleListDetail.value = visible
}

export const setOpenSongListInputInfo = (text: string, source: string) => {
  openSongListInputInfo.text = text
  openSongListInputInfo.source = source
}
