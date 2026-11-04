import { markRaw } from '@common/utils/vueTools'
import { log } from '@common/utils'
import { getLeaderboardCacheData, saveLeaderboardCacheData, type LeaderboardCacheData } from '@renderer/utils/data'
import { boards, sources, type Board } from './state'
import { setBoard, getBoardsList } from './action'
import { previews, refreshBoardPreview, PREVIEW_TTL } from './preview'

/**
 * 软件启动时预加载排行榜数据：
 * 1. 先从磁盘缓存恢复所有音源的榜单列表与卡片预览，进入页面即可完整展示；
 * 2. 后台刷新缺失或过期（超过 PREVIEW_TTL）的榜单与预览数据，加载成功后写回磁盘缓存。
 */
export const preloadBoards = async() => {
  const disk: LeaderboardCacheData = await getLeaderboardCacheData()
  const now = Date.now()

  // 恢复磁盘缓存，立即渲染
  for (const source of sources) {
    const entry = disk.boards[source]
    if (!boards[source] && entry?.data?.list?.length) setBoard(markRaw(entry.data) as Board, source)
  }
  for (const [id, entry] of Object.entries(disk.previews)) {
    if (!previews[id] && entry?.songs?.length) {
      previews[id] = markRaw({ songs: entry.songs, cover: entry.cover ?? '', time: entry.time ?? 0 })
    }
  }

  // 后台刷新缺失/过期数据（队列并发受控，不阻塞界面）
  for (const source of sources) {
    let board = boards[source]
    const boardEntry = disk.boards[source]
    if (!board || !boardEntry?.data?.list?.length || now - boardEntry.time > PREVIEW_TTL) {
      try {
        const fresh = await getBoardsList(source)
        if (fresh?.list?.length) {
          board = fresh
          setBoard(board, source)
          disk.boards[source] = { time: Date.now(), data: { source: board.source, list: board.list } }
          saveLeaderboardCacheData(disk)
        }
      } catch (err) {
        log.error('preload leaderboard boards failed:', source, err)
      }
    }
    if (!board) continue
    for (const item of board.list) {
      void refreshBoardPreview(item.id).catch(err => {
        log.error('preload leaderboard preview failed:', item.id, err)
      })
    }
  }
}
