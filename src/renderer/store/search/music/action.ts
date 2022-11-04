import { markRaw } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'
import { deduplicationList, toNewMusicInfo } from '@renderer/utils'
import { sortInsert, similar } from '@common/utils/common'

import { sources, maxPages, listInfos, ListInfo } from './state'

interface SearchResult {
  list: LX.Music.MusicInfo[]
  allPage: number
  limit: number
  total: number
  source: LX.OnlineSource
}


/**
 * 按搜索关键词重新排序列表
 * @param list 歌曲列表
 * @param keyword 搜索关键词
 * @returns 排序后的列表
 */
const handleSortList = (list: LX.Music.MusicInfo[], keyword: string) => {
  let arr: any[] = []
  for (const item of list) {
    sortInsert(arr, {
      num: similar(keyword, `${item.name} ${item.singer}`),
      data: item,
    })
  }
  return arr.map(item => item.data).reverse()
}


const setLists = (results: SearchResult[], page: number, text: string): LX.Music.MusicInfo[] => {
  let pages = []
  let total = 0
  // let limit = 0
  let list = []
  for (const source of results) {
    maxPages[source.source] = source.allPage
    if (source.allPage < page) continue
    list.push(...source.list)
    pages.push(source.allPage)
    total += source.total
    // limit = Math.max(source.limit, limit)
  }
  list = deduplicationList(list.map(s => markRaw(toNewMusicInfo(s))))
  let listInfo = listInfos.all
  listInfo.maxPage = Math.max(...pages)
  listInfo.total = total
  // listInfo.limit = limit
  listInfo.page = page
  listInfo.list = handleSortList(list, text)
  if (text && !list.length) listInfo.noItemLabel = window.i18n.t('no_item')
  else listInfo.noItemLabel = ''
  return listInfo.list
}

const setList = (datas: SearchResult, page: number, text: string): LX.Music.MusicInfo[] => {
  // console.log(datas.source, datas.list)
  let listInfo = listInfos[datas.source] as ListInfo
  listInfo.list = deduplicationList(datas.list.map(s => markRaw(toNewMusicInfo(s))))
  listInfo.total = datas.total
  listInfo.maxPage = datas.allPage
  listInfo.page = page
  listInfo.limit = datas.limit
  if (text && !datas.list.length) listInfo.noItemLabel = window.i18n.t('no_item')
  else listInfo.noItemLabel = ''
  return listInfo.list
}

export const resetListInfo = (sourceId: LX.OnlineSource | 'all'): [] => {
  let listInfo = listInfos[sourceId] as ListInfo
  listInfo.list = []
  listInfo.page = 0
  listInfo.maxPage = 0
  listInfo.total = 0
  listInfo.noItemLabel = ''
  return []
}

export const search = async(text: string, page: number, sourceId: LX.OnlineSource | 'all'): Promise<LX.Music.MusicInfo[]> => {
  const listInfo = listInfos[sourceId]
  if (!text) return resetListInfo(sourceId)
  const key = `${page}__${text}`
  if (sourceId == 'all') {
    listInfo!.noItemLabel = window.i18n.t('list__loading')
    listInfo!.key = key
    let task = []
    for (const source of sources) {
      if (source == 'all') continue
      task.push((music[source]?.musicSearch.search(text, page, listInfos.all.limit) ?? Promise.reject(new Error('source not found: ' + source))).catch((error: any) => {
        console.log(error)
        return {
          allPage: 1,
          limit: 30,
          list: [],
          source,
          total: 0,
        }
      }))
    }
    return await Promise.all(task).then((results: SearchResult[]) => {
      if (key != listInfo!.key) return []
      return setLists(results, page, text)
    })
  } else {
    if (listInfo?.key == key && listInfo?.list.length) return listInfo?.list
    listInfo!.noItemLabel = window.i18n.t('list__loading')
    listInfo!.key = key
    return music[sourceId].musicSearch.search(text, page, listInfo!.limit).then((data: SearchResult) => {
      if (key != listInfo!.key) return []
      return setList(data, page, text)
    }).catch((error: any) => {
      resetListInfo(sourceId)
      listInfo!.noItemLabel = window.i18n.t('list__load_failed')
      console.log(error)
      throw error
    })
  }
}

