import { reactive, markRaw } from '@common/utils/vueTools'
import { YTM_AGGREGATE_SEARCH_TIMEOUT_MS } from '@common/recommendationConfig'
import music from '@renderer/utils/musicSdk'
import { isYtmAggregateSearchEnabled } from '@renderer/utils/musicSdk/ytm/runtimeContext'

// import { deduplicationList } from '@common/utils/renderer'

export type Source = LX.OnlineSource | 'all'

interface SourceLists extends Partial<Record<LX.OnlineSource, string[]>> {
  'all': string[]
}

export const sources: Source[] = markRaw([])

export const sourceList: SourceLists = markRaw({
  all: reactive<string[]>([]),
})


const getHotSearchSdk = (source: LX.OnlineSource) => {
  const sdk = music[source]
  if (sdk && 'hotSearch' in sdk) return sdk.hotSearch
  return undefined
}

for (const source of music.sources) {
  if (!getHotSearchSdk(source.id as LX.OnlineSource)) continue
  sources.push(source.id as LX.OnlineSource)
  sourceList[source.id as LX.OnlineSource] = reactive<string[]>([])
}
sources.push('all')


const setList = (source: LX.OnlineSource, list: string[]): string[] => {
  return sourceList[source] = list.slice(0, 20)
}

const setLists = (lists: Array<{ source: LX.OnlineSource, list: string[] }>): string[] => {
  let wordsMap = new Map<string, number>()
  for (const { source, list } of lists) {
    if (!sourceList[source]?.length) sourceList[source] = list.slice(0, 20)
    for (let item of list) {
      item = item.trim()
      wordsMap.set(item, (wordsMap.get(item) ?? 0) + 1)
    }
  }
  const wordsMapArr = Array.from(wordsMap)
  wordsMapArr.sort((a, b) => a[0].localeCompare(b[0]))
  wordsMapArr.sort((a, b) => b[1] - a[1])
  const words = wordsMapArr.map(item => item[0])
  return sourceList.all = words.slice(0, sources.length * 10)
}

export const getList = async(source: Source): Promise<string[]> => {
  if (source == 'all') {
    const includeYtm = isYtmAggregateSearchEnabled()
    let task = []
    for (const src of sources) {
      if (src == 'all') continue
      if (src == 'ytm' && !includeYtm) continue
      const hotSearch = getHotSearchSdk(src)
      const fetchOne = sourceList[src]?.length
        ? Promise.resolve({ source: src, list: sourceList[src] })
        : (hotSearch?.getList() ?? Promise.reject(new Error('source not found: ' + src)))
      if (src === 'ytm') {
        task.push(new Promise((resolve) => {
          const timer = setTimeout(() => { resolve({ source: src, list: [] }) }, YTM_AGGREGATE_SEARCH_TIMEOUT_MS)
          fetchOne.then(res => {
            clearTimeout(timer)
            resolve(res)
          }).catch((err: any) => {
            clearTimeout(timer)
            console.log(err)
            resolve({ source: src, list: [] })
          })
        }))
      } else {
        task.push(fetchOne.catch((err: any) => {
          console.log(err)
          return { source: src, list: [] }
        }))
      }
    }
    return Promise.all(task).then((results: any[]) => {
      return setLists(results)
    })
  } else {
    if (sourceList[source]?.length) return Promise.resolve(sourceList[source])
    const hotSearch = getHotSearchSdk(source)
    if (!hotSearch) {
      setList(source, [])
      return Promise.resolve([])
    }
    return hotSearch.getList().then((data: { list: string[] }) => setList(source, data.list))
  }
}


export const clearList = (source: Source) => {
  sourceList[source] = []
}
