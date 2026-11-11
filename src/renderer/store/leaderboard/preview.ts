import { markRaw, shallowReactive } from '@common/utils/vueTools'
import { getPicPath } from '@renderer/core/music'
import { getLeaderboardCacheData, saveLeaderboardCacheData } from '@renderer/utils/data'
import { getListDetail } from './action'
import { type ListDetailInfo } from './state'

export interface PreviewSong {
  name: string
  singer: string
}
export interface BoardPreview {
  songs: PreviewSong[]
  cover: string
  time: number
}

/** 榜单预览数据（卡片封面 + 前5首），响应式存储，任意来源填充后卡片自动更新 */
export const previews = shallowReactive<Record<string, BoardPreview>>({})

/** 预览数据有效期，超时后启动时后台刷新 */
export const PREVIEW_TTL = 6 * 60 * 60 * 1000

const maxLoading = 3
const queue: Array<() => Promise<void>> = []
const pending = new Map<string, Promise<BoardPreview>>()
let loadingCount = 0

const runNext = () => {
  while (loadingCount < maxLoading && queue.length) {
    const task = queue.shift()!
    loadingCount++
    void task().finally(() => {
      loadingCount--
      runNext()
    })
  }
}

const persistPreview = async(id: string, preview: BoardPreview) => {
  const disk = await getLeaderboardCacheData()
  disk.previews[id] = { time: preview.time, songs: preview.songs, cover: preview.cover }
  saveLeaderboardCacheData(disk)
}

const loadPreview = async(id: string): Promise<BoardPreview> => {
  const result: ListDetailInfo = await getListDetail(id, 1)
  const songs = result.list.slice(0, 5)
  // 空列表视为加载失败（限流/网络抖动），不进入缓存，允许后续重试
  if (!songs.length) throw new Error('empty leaderboard: ' + id)
  let cover = songs[0]?.meta?.picUrl ?? ''
  // 网易等音源的榜单数据不带封面链接，和列表行一样再取一次
  if (!cover && songs[0]) cover = await getPicPath({ musicInfo: songs[0], isRefresh: false }).catch(() => '')
  const preview = markRaw({
    songs: songs.map(s => ({ name: s.name, singer: s.singer })),
    cover,
    time: Date.now(),
  }) as BoardPreview
  previews[id] = preview
  void persistPreview(id, preview).catch(() => {})
  return preview
}

/**
 * 获取榜单预览数据，命中内存缓存时直接返回，进行中的请求会被复用；
 * 失败的结果不会被缓存，后续调用可重试
 */
const fetchPreview = async(id: string): Promise<BoardPreview> => {
  let task = pending.get(id)
  if (!task) {
    task = new Promise<BoardPreview>((resolve, reject) => {
      queue.push(async() => loadPreview(id).then(resolve).catch(reject))
      runNext()
    }).finally(() => {
      if (pending.get(id) === task) pending.delete(id)
    })
    pending.set(id, task)
  }
  return task
}

/** 强制刷新：内存数据缺失、无歌曲、无封面或已过期时重新拉取 */
export const refreshBoardPreview = async(id: string): Promise<BoardPreview> => {
  const cached = previews[id]
  if (cached?.songs.length && cached.cover && Date.now() - cached.time < PREVIEW_TTL) return Promise.resolve(cached)
  return fetchPreview(id)
}

/** UI 触发加载：已有数据（含磁盘缓存恢复的）时不再发起请求 */
export const loadBoardPreview = (id: string) => {
  if (previews[id]) return
  void fetchPreview(id).catch(() => {})
}
