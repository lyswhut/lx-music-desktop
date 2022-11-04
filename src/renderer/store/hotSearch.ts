import { reactive, markRaw } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'

// import { deduplicationList } from '@common/utils/renderer'

export type Source = LX.OnlineSource | 'all'

interface SourceLists extends Partial<Record<LX.OnlineSource, string[]>> {
  'all': string[]
}

export const sources: Source[] = markRaw([])

export const sourceList: SourceLists = markRaw({
  all: reactive<string[]>([]),
})


for (const source of music.sources) {
  if (!music[source.id as LX.OnlineSource]?.hotSearch) continue
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
    let task = []
    for (const source of sources) {
      if (source == 'all') continue
      task.push(
        sourceList[source]?.length
          ? Promise.resolve({ source, list: sourceList[source] })
          : (music[source]?.hotSearch.getList() ?? Promise.reject(new Error('source not found: ' + source))).catch((err: any) => {
              console.log(err)
              return { source, list: [] }
            }),
      )
    }
    return Promise.all(task).then((results: any[]) => {
      return setLists(results)
    })
  } else {
    if (sourceList[source]?.length) return Promise.resolve(sourceList[source] as string[])
    if (!music[source]?.hotSearch) {
      setList(source, [])
      return Promise.resolve([])
    }
    return music[source]?.hotSearch.getList().then(data => setList(source, data.list))
  }
}


export const clearList = (source: Source) => {
  sourceList[source] = []
}
