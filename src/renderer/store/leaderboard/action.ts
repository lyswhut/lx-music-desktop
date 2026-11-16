import { deduplicationList, toNewMusicInfo } from '@renderer/utils'
import musicSdk from '@renderer/utils/musicSdk'
import { markRaw, markRawList } from '@common/utils/vueTools'
import { boards, type Board, listDetailInfo, type ListDetailInfo } from './state'

const cache = new Map<string, ListDetailInfo>()
const requestTasks = new Map<string, Promise<ListDetailInfo>>()

const getCacheKey = (id: string, page: number) => `${id}__${page}`

/**
 * 读取单页歌曲，命中缓存或复用进行中的请求时不再发起网络请求
 * @param id 排行榜id  {souce}__{id}
 */
const fetchListDetail = async(id: string, page: number, isRefresh: boolean): Promise<ListDetailInfo> => {
  const key = getCacheKey(id, page)
  if (!isRefresh) {
    if (cache.has(key)) return Promise.resolve(cache.get(key)!)
    const task = requestTasks.get(key)
    if (task) return task
  } else {
    cache.delete(key)
  }

  const [source, bangId] = id.split('__') as [LX.OnlineSource, string]
  const request = musicSdk[source]?.leaderboard?.getList(bangId, page)
  if (!request) return Promise.reject(new Error('source not found' + source))

  const task = request.then((result: ListDetailInfo) => {
    result.list = markRawList(deduplicationList(result.list.map(m => toNewMusicInfo(m)) as LX.Music.MusicInfoOnline[]))
    cache.set(key, result)
    return result
  }).finally(() => {
    if (requestTasks.get(key) === task) requestTasks.delete(key)
  })
  requestTasks.set(key, task)
  return task
}

export const setBoard = (board: Board, source: LX.OnlineSource) => {
  boards[source] = markRaw(board)
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
}
export const clearListDetail = () => {
  listDetailInfo.list = []
  listDetailInfo.id = ''
  listDetailInfo.source = null
  listDetailInfo.total = 0
  listDetailInfo.limit = 30
  listDetailInfo.page = 1
  listDetailInfo.key = null
  listDetailInfo.noItemLabel = ''
}

export const getBoardsList = async(source: LX.OnlineSource) => {
  // const source = (await getLeaderboardSetting()).source as LX.OnlineSource
  return musicSdk[source]?.leaderboard.getBoards() as Promise<Board>
}

/**
 * 获取排行榜内单页歌曲
 * @param id 排行榜id  {souce}__{id}
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetail = async(id: string, page: number, isRefresh = false): Promise<ListDetailInfo> => {
  // let [source, bangId] = tabId.split('__')
  // if (!bangId) return
  return fetchListDetail(id, page, isRefresh)
}


/**
 * 获取排行榜内全部歌曲
 * @param id 排行榜id  {souce}__{id}
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetailAll = async(id: string, isRefresh = false): Promise<LX.Music.MusicInfoOnline[]> => {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  const loadData = (page: number): Promise<ListDetailInfo> => fetchListDetail(id, page, isRefresh)
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return loadData(1).then((result: ListDetailInfo) => {
    if (result.total <= result.limit) return result.list

    let maxPage = Math.ceil(result.total / result.limit)
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const loadDetail = (loadPage = 2): Promise<ListDetailInfo['list']> => {
      return loadPage == maxPage
        ? loadData(loadPage).then((result: ListDetailInfo) => result.list)
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        : loadData(loadPage).then((result1: ListDetailInfo) => loadDetail(++loadPage).then((result2: ListDetailInfo['list']) => [...result1.list, ...result2]))
    }
    return loadDetail().then(result2 => [...result.list, ...result2])
  }).then((list: ListDetailInfo['list']) => deduplicationList(list))
}


/**
 * 获取并设置排行榜内单页歌曲
 * @param id 排行榜id  {souce}__{id}
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getAndSetListDetail = async(id: string, page: number, isRefresh = false) => {
  // let [source, bangId] = tabId.split('__')
  // if (!bangId) return
  let key = getCacheKey(id, page)

  if (!isRefresh && listDetailInfo.key == key && listDetailInfo.list.length) return

  listDetailInfo.key = key
  // 已经缓存过这一页时直接铺数据，不再闪一次「加载中」
  if (!isRefresh && cache.has(key)) {
    setListDetail(cache.get(key)!, id, page)
    return
  }
  listDetailInfo.noItemLabel = window.i18n.t('list__loading')

  return getListDetail(id, page, isRefresh).then((result: ListDetailInfo) => {
    if (key != listDetailInfo.key) return
    setListDetail(result, id, page)
  }).catch((error: any) => {
    clearListDetail()
    listDetailInfo.noItemLabel = window.i18n.t('list__load_failed')
    console.log(error)
    throw error
  })
}
