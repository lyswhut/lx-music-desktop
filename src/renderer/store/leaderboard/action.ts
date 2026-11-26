// import { getLeaderboardSetting } from '@renderer/utils/data'
import { deduplicationList, toNewMusicInfo } from '@renderer/utils'
import musicSdk from '@renderer/utils/musicSdk'
import { getLiveYtmContextKey, resolveLiveYtmProxy } from '@renderer/utils/musicSdk/ytm/runtimeContext'
import type { YtmPlaylistDetailFetchOptions } from '@renderer/utils/musicSdk/ytm'
import { markRaw, markRawList } from '@common/utils/vueTools'
import { boards, type Board, listDetailInfo, type ListDetailInfo } from './state'

const cache = new Map<string, any>()
const cacheTokens = new Map<string, number>()
let cacheTokenSeq = 0
const boardContextKeys: Partial<Record<LX.OnlineSource, string>> = {}
let boardDetailRequestToken = 0

const nextCacheToken = (key: string): number => {
  const token = ++cacheTokenSeq
  cacheTokens.set(key, token)
  return token
}

export const parseBoardId = (id: string): [LX.OnlineSource, string] => {
  const sep = id.indexOf('__')
  if (sep <= 0) return [id as LX.OnlineSource, '']
  return [id.slice(0, sep) as LX.OnlineSource, id.slice(sep + 2)]
}

export const setBoard = (board: Board, source: LX.OnlineSource, contextKey?: string) => {
  boards[source] = markRaw(board)
  if (contextKey !== undefined) boardContextKeys[source] = contextKey
}

export const getCachedBoard = (source: LX.OnlineSource): Board | undefined => {
  if (source === 'ytm') {
    if (boardContextKeys.ytm !== getLiveYtmContextKey()) return undefined
  }
  return boards[source]
}

export const setListDetail = (result: ListDetailInfo, id: string, page: number) => {
  listDetailInfo.list = markRaw([...result.list])
  listDetailInfo.id = id
  listDetailInfo.source = result.source
  if (page == 1 || (result.total && result.list.length)) listDetailInfo.total = result.total
  else listDetailInfo.total = result.limit * page
  listDetailInfo.limit = result.limit
  listDetailInfo.page = page

  if (result.list.length) listDetailInfo.noItemLabel = ''
  else if (page == 1) listDetailInfo.noItemLabel = window.i18n.t('no_item')
  else listDetailInfo.noItemLabel = ''
}
export const clearListDetail = (noItemLabel = '') => {
  boardDetailRequestToken++
  listDetailInfo.list = []
  listDetailInfo.id = ''
  listDetailInfo.source = null
  listDetailInfo.total = 0
  listDetailInfo.limit = 30
  listDetailInfo.page = 1
  listDetailInfo.key = null
  listDetailInfo.noItemLabel = noItemLabel
}

// 保留底层 YTM SDK 返回的可取消 Promise（含 .cancel()），供组件 onCleanup 中止在途 HTTP
// eslint-disable-next-line @typescript-eslint/promise-function-async
export const getBoardsList = (source: LX.OnlineSource) => {
  return (musicSdk[source]?.leaderboard.getBoards() ?? Promise.reject(new Error('source not found: ' + source))) as Promise<Board> & { cancel?: () => void }
}

/**
 * 获取排行榜内单页歌曲
 * @param id 排行榜id  {source}__{id}
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetail = async(
  id: string,
  page: number,
  isRefresh = false,
  ytmOptions?: YtmPlaylistDetailFetchOptions,
): Promise<ListDetailInfo> => {
  const [source, bangId] = parseBoardId(id)
  const isYtm = source === 'ytm'
  const key = `${id}__${page}`

  if (!isYtm && !isRefresh && cache.has(key)) return cache.get(key)
  const cacheToken = !isYtm ? nextCacheToken(key) : 0

  const req = isYtm
    ? musicSdk.ytm.leaderboard.getList(bangId, page, isRefresh, ytmOptions)
    : musicSdk[source]?.leaderboard?.getList(bangId, page)
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

export interface GetBoardDetailAllOptions {
  failOnTruncated?: boolean
}

const MAX_BOARD_DETAIL_PAGES = 500

/**
 * 获取排行榜内全部歌曲
 * @param id 排行榜id  {source}__{id}
 * @param isRefresh 是否跳过缓存
 * @param options 可选同步防护配置（如 failOnTruncated）
 * @returns
 */
export const getListDetailAll = async(
  id: string,
  isRefresh = false,
  options?: GetBoardDetailAllOptions,
): Promise<LX.Music.MusicInfoOnline[]> => {
  const [source] = parseBoardId(id)
  const isYtm = source === 'ytm'
  const lockedCtx = isYtm ? resolveLiveYtmProxy() : undefined
  let expectedGeneration: number | undefined
  const allList: LX.Music.MusicInfoOnline[] = []
  let page = 1

  while (page <= MAX_BOARD_DETAIL_PAGES) {
    if (isYtm && lockedCtx && getLiveYtmContextKey() !== lockedCtx.contextKey) {
      throw new Error('YouTube Music 代理配置已变更，已中止榜单同步')
    }
    const pageRefresh = isYtm ? (page === 1 && isRefresh) : isRefresh
    const ytmOptions: YtmPlaylistDetailFetchOptions | undefined = isYtm
      ? {
          ctx: lockedCtx,
          ...(page > 1 && expectedGeneration !== undefined ? { expectedGeneration } : {}),
        }
      : undefined
    const result = await getListDetail(id, page, pageRefresh, ytmOptions)
    if (isYtm && lockedCtx && getLiveYtmContextKey() !== lockedCtx.contextKey) {
      throw new Error('YouTube Music 代理配置已变更，已中止榜单同步')
    }
    if (isYtm && page === 1 && typeof result.generation === 'number') {
      expectedGeneration = result.generation
    }
    allList.push(...result.list)

    if (options?.failOnTruncated && result.truncated) {
      throw new Error('榜单曲目超过单次分页上限被截断，已中止同步以保护原列表')
    }

    let hasNextPage = false
    if (typeof result.hasMore === 'boolean') {
      hasNextPage = result.hasMore
    } else {
      // 国内 SDK 可能返回数字字符串 total/limit，须先转数值再判有限性；
      // 列表非空却返回无效/非正 total（如 null/""/0/NaN）时，严格同步必须抛错拒绝按首屏截断覆盖收藏
      const total = Number(result.total)
      const limit = Number(result.limit)
      if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(limit) || limit <= 0) {
        if (options?.failOnTruncated && result.list.length > 0) {
          throw new Error('榜单分页信息异常，已中止同步以保护原列表')
        }
        break
      }
      const maxPage = Math.ceil(total / limit)
      hasNextPage = page < maxPage
    }
    if (!hasNextPage) break
    if (page >= MAX_BOARD_DETAIL_PAGES) {
      if (options?.failOnTruncated) {
        throw new Error('榜单曲目超过单次分页上限被截断，已中止同步以保护原列表')
      }
      break
    }
    page++
  }

  return deduplicationList(allList)
}


/**
 * 获取并设置排行榜内单页歌曲
 * @param id 排行榜id  {source}__{id}
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getAndSetListDetail = async(id: string, page: number, isRefresh = false) => {
  const [source] = parseBoardId(id)
  const isYtm = source === 'ytm'
  const ytmContextKey = isYtm ? getLiveYtmContextKey() : ''
  const key = isYtm ? `${ytmContextKey}__${id}__${page}` : `${id}__${page}`

  if (!isRefresh && listDetailInfo.key == key && listDetailInfo.list.length) return

  const reqToken = ++boardDetailRequestToken
  listDetailInfo.key = key
  listDetailInfo.noItemLabel = window.i18n.t('list__loading')

  return getListDetail(id, page, isRefresh).then((result: ListDetailInfo) => {
    if (reqToken !== boardDetailRequestToken || key != listDetailInfo.key) return
    if (isYtm && ytmContextKey !== getLiveYtmContextKey()) return
    setListDetail(result, id, page)
  }).catch((error: any) => {
    if (reqToken !== boardDetailRequestToken || key != listDetailInfo.key) return
    if (isYtm && ytmContextKey !== getLiveYtmContextKey()) return
    clearListDetail()
    listDetailInfo.noItemLabel = window.i18n.t('list__load_failed')
    console.log(error)
    throw error
  })
}
