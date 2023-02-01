import { reactive, markRaw } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'

// import { deduplicationList } from '@common/utils/renderer'

import { type ListInfo } from '@renderer/store/songList/state'

export type { ListInfoItem } from '@renderer/store/songList/state'

export const sources: Array<LX.OnlineSource | 'all'> = markRaw([])

export type SearchListInfo = Omit<ListInfo, 'source'>


interface ListInfos extends Partial<Record<LX.OnlineSource, SearchListInfo>> {
  'all': SearchListInfo
}


export const listInfos: ListInfos = markRaw({
  all: reactive<SearchListInfo>({
    page: 1,
    limit: 15,
    total: 0,
    list: [],
    key: null,
    noItemLabel: '',
    tagId: '',
    sortId: '',
  }),
})
export const maxPages: Partial<Record<LX.OnlineSource, number>> = {}
for (const source of music.sources) {
  if (!music[source.id as LX.OnlineSource]?.songList?.search) continue
  sources.push(source.id as LX.OnlineSource)
  listInfos[source.id as LX.OnlineSource] = reactive<SearchListInfo>({
    page: 1,
    limit: 18,
    total: 0,
    list: [],
    key: null,
    noItemLabel: '',
    tagId: '',
    sortId: '',
  })
  maxPages[source.id as LX.OnlineSource] = 0
}
sources.push('all')
