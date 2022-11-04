import { reactive, markRaw, shallowReactive } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'

export declare type Source = LX.OnlineSource

export const sources: LX.OnlineSource[] = markRaw([])

for (const source of music.sources) {
  if (!music[source.id as LX.OnlineSource]?.leaderboard?.getBoards) continue
  sources.push(source.id as LX.OnlineSource)
}

export declare interface BoardItem {
  id: string
  name: string
  bangid: string
}
export declare interface Board {
  list: BoardItem[]
  source: LX.OnlineSource
}
type Boards = Partial<Record<LX.OnlineSource, Board>>

export const boards = shallowReactive<Boards>({})

export declare interface ListDetailInfo {
  list: LX.Music.MusicInfoOnline[]
  total: number
  page: number
  source: LX.OnlineSource | null
  limit: number
  key: string | null
  id: string
  noItemLabel: string
}

export const listDetailInfo = reactive<ListDetailInfo>({
  list: [],
  total: 0,
  page: 1,
  limit: 30,
  key: null,
  source: null,
  id: '',
  noItemLabel: '',
})

