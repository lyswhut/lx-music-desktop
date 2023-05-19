import { reactive, markRaw, shallowReactive } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'

export type Source = LX.OnlineSource

export const sources: LX.OnlineSource[] = markRaw([])

for (const source of music.sources) {
  if (!music[source.id as LX.OnlineSource]?.leaderboard?.getBoards) continue
  sources.push(source.id as LX.OnlineSource)
}

export interface BoardItem {
  id: string
  name: string
  bangid: string
}
export interface Board {
  list: BoardItem[]
  source: LX.OnlineSource
}
type Boards = Partial<Record<LX.OnlineSource, Board>>

export const boards = shallowReactive<Boards>({})

export interface ListDetailInfo {
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

