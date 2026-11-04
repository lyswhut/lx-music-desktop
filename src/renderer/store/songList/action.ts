// import { getSongListSetting } from '@renderer/utils/data'
import { deduplicationList, toNewMusicInfo } from '@renderer/utils'
import { requestMsg } from '@renderer/utils/message'
import musicSdk from '@renderer/utils/musicSdk'
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
const requestTasks = new Map<string, Promise<ListDetailInfo>>()

// 请求被取消（切换源/标签/快速翻页时 cancelHttp 主动取消旧请求）产生的错误，属正常流程，无需上报
const isCancelRequestError = (error: unknown): boolean => error instanceof Error && error.message === requestMsg.cancelRequest

const getDetailCacheKey = (id: string, source: LX.OnlineSource, page: number) => `sdetail__${source}__${id}__${page}`

/**
 * 读取歌单内单页歌曲，命中缓存或复用进行中的请求时不再发起网络请求
 */
const fetchListDetail = async(id: string, source: LX.OnlineSource, page: number, isRefresh: boolean): Promise<ListDetailInfo> => {
  const key = getDetailCacheKey(id, source, page)
  if (!isRefresh) {
    if (cache.has(key)) return Promise.resolve(cache.get(key))
    const task = requestTasks.get(key)
    if (task) return task
  } else {
    cache.delete(key)
  }

  const request = musicSdk[source]?.songList.getListDetail(id, page)
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

export const setTags = (tagInfo: TagInfo, source: LX.OnlineSource) => {
  tags[source] = markRaw(tagInfo)
}

export const clearList = () => {
  listInfo.list = []
  listInfo.total = 0
  listInfo.noItemLabel = ''
  listInfo.page = 1
  listInfo.key = ''
}

export const setList = (result: ListInfo, tagId: string, sortId: string, page: number) => {
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

export const getTags = async<T extends LX.OnlineSource>(source: T) => {
  return musicSdk[source]?.songList.getTags() as Promise<TagInfo<T>>
}


/**
 * 获取歌单列表
 * @param source 歌单源
 * @param tabId 类型id
 * @param sortId 排序
 * @param page 页数
 * @param isRefresh 是否跳过缓存
 * @param isAppend 追加模式：向下滚动翻页时，把新页数据追加到现有列表，不整表替换
 * @returns
 */
export const getAndSetList = async(source: LX.OnlineSource, tabId: string, sortId: string, page: number, isRefresh = false, isAppend = false) => {
  // let source = rootState.setting.songList.source
  // let tabId = rootState.setting.songList.tagInfo.id
  // let sortId = rootState.setting.songList.sortId
  // console.log(sortId)
  let key = `slist__${source}__${sortId}__${tabId}__${page}`
  // if (state.list.list.length && state.list.key == key) return
  if (!isAppend) {
    if (!isRefresh) {
      if (listInfo.key == key && listInfo.list.length) return
      if (cache.has(key)) {
        listInfo.key = key
        setList(cache.get(key), tabId, sortId, page)
        return
      }
    }
  }
  // 仅第一页显示加载遮罩，追加翻页时保持列表可见
  if (page == 1) listInfo.noItemLabel = window.i18n.t('list__loading')
  listInfo.key = key
  if (isAppend) {
    return musicSdk[source]?.songList.getList(sortId, tabId, page).then((result: ListInfo) => {
      cache.set(key, result)
      if (key != listInfo.key) return
      // 按 id 去重后追加，避免重复数据
      const seen = new Set<string>()
      listInfo.list = markRawList([...listInfo.list, ...result.list].filter(item => !seen.has(item.id) && seen.add(item.id)))
      if (page == 1 || (result.total && result.list.length)) listInfo.total = result.total
      else listInfo.total = result.limit * page
      listInfo.limit = result.limit
      listInfo.page = page
    }).catch((error: any) => {
      // 请求被取消（切换源/标签/快速翻页）时静默忽略，不作为错误抛出
      if (isCancelRequestError(error)) return
      console.log(error)
      throw error
    })
  }
  // clearList()
  return musicSdk[source]?.songList.getList(sortId, tabId, page).then((result: ListInfo) => {
    cache.set(key, result)
    if (key != listInfo.key) return
    setList(result, tabId, sortId, page)
  }).catch((error: any) => {
    // 请求被取消时静默忽略；追加翻页失败时保留已加载的列表，可再次滚动重试
    if (isCancelRequestError(error)) return
    if (page == 1) clearList()
    console.log(error)
    throw error
  })
}

/**
 * 获取歌单内单页歌曲
 * @param id 歌单id
 * @param source 歌单源
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetail = async(id: string, source: LX.OnlineSource, page: number, isRefresh = false): Promise<ListDetailInfo> => {
  return fetchListDetail(id, source, page, isRefresh)
}

/**
 * 获取歌单内全部歌曲
 * @param id 歌单id
 * @param source 歌单源
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetailAll = async(id: string, source: LX.OnlineSource, isRefresh = false): Promise<LX.Music.MusicInfoOnline[]> => {
  // console.log(source, id)
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  const loadData = (page: number): Promise<ListDetailInfo> => fetchListDetail(id, source, page, isRefresh)
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
 * 获取并设置歌单内单页歌曲
 * @param id 歌单id
 * @param source 歌单源
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getAndSetListDetail = async(id: string, source: LX.OnlineSource, page: number, isRefresh = false) => {
  let key = getDetailCacheKey(id, source, page)

  if (!isRefresh && listDetailInfo.key == key && listDetailInfo.list.length) return

  listDetailInfo.key = key
  // 已经缓存过这一页时直接铺数据，不再闪一次「加载中」
  if (!isRefresh && cache.has(key)) {
    setListDetail(cache.get(key), id, page)
    return
  }
  listDetailInfo.noItemLabel = window.i18n.t('list__loading')

  return getListDetail(id, source, page, isRefresh).then((result: ListDetailInfo) => {
    if (key != listDetailInfo.key) return
    setListDetail(result, id, page)
  }).catch((error: any) => {
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
