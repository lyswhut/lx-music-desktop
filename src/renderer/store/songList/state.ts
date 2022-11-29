import { reactive, markRaw, ref, shallowReactive } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'

export declare interface SortInfo {
  name: string
  id: string
}

export const sources: LX.OnlineSource[] = markRaw([])
export const sortList = markRaw<Partial<Record<LX.OnlineSource, SortInfo[]>>>({})

for (const source of music.sources) {
  const songList = music[source.id as LX.OnlineSource]?.songList
  if (!songList) continue
  sources.push(source.id as LX.OnlineSource)
  sortList[source.id as LX.OnlineSource] = songList.sortList as SortInfo[]
}

export declare interface TagInfoItem<T extends LX.OnlineSource = LX.OnlineSource> {
  parent_id: string
  parent_name: string
  id: string
  name: string
  source: T
}
export declare interface TagInfoTypeItem<T extends LX.OnlineSource = LX.OnlineSource> {
  name: string
  list: Array<TagInfoItem<T>>
}
export declare interface TagInfo<Source extends LX.OnlineSource = LX.OnlineSource> {
  tags: Array<TagInfoTypeItem<Source>>
  hotTag: Array<TagInfoItem<Source>>
  source: Source
}

type Tags = Partial<Record<LX.OnlineSource, TagInfo>>

export const tags = shallowReactive<Tags>({})

export declare interface ListInfoItem {
  play_count: string
  id: string
  author: string
  name: string
  time?: string
  img: string
  // grade: basic.favorcnt / 10,
  desc: string | null
  source: LX.OnlineSource
  total?: string
}
export declare interface ListInfo {
  list: ListInfoItem[]
  total: number
  page: number
  limit: number
  key: string | null
  noItemLabel: string
  source?: LX.OnlineSource
  tagId: string
  sortId: string
}

export declare interface ListDetailInfo {
  list: LX.Music.MusicInfoOnline[]
  source: LX.OnlineSource
  desc: string | null
  total: number
  page: number
  limit: number
  key: string | null
  id: string
  info: {
    name?: string
    img?: string
    desc?: string
    author?: string
    play_count?: string
  }
  noItemLabel: string
}

export const listInfo = reactive<ListInfo>({
  list: [],
  total: 0,
  page: 1,
  limit: 30,
  key: null,
  noItemLabel: '',
  source: 'kw',
  tagId: '',
  sortId: '',
})

export const listDetailInfo = reactive<ListDetailInfo>({
  list: [],
  id: '',
  desc: null,
  total: 0,
  page: 1,
  limit: 30,
  key: null,
  source: 'kw',
  info: {},
  noItemLabel: '',
})

export const selectListInfo = markRaw<ListInfoItem>({
  play_count: '',
  id: '',
  author: '',
  name: '',
  time: '',
  img: '',
  // grade: basic.favorcnt / 10,
  desc: '',
  source: 'kw',
})

export const isVisibleListDetail = ref(false)
export const openSongListInputInfo = markRaw({
  text: '',
  source: '',
})
