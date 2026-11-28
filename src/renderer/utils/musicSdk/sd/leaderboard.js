import { request } from './api'
import { formatTracks } from './utils'

const boardList = [
  { id: 'sd__7036274230471712007', bangid: '7036274230471712007', name: '热歌榜' },
  { id: 'sd__7060812597884869927', bangid: '7060812597884869927', name: '新歌榜' },
  { id: 'sd__7061475546400005410', bangid: '7061475546400005410', name: '欧美榜' },
]

export default {
  list: boardList,
  limit: 100,
  async getBoards() {
    return { list: boardList, source: 'sd' }
  },
  async getList(id, page = 1) {
    id = String(id).replace(/^sd__/, '')
    if (!boardList.some(board => board.bangid == id)) throw new Error('未知汽水音乐排行榜')
    const body = await request(`/luna/charts/${id}`).promise
    if (!Array.isArray(body.chart?.track_ranks)) throw new Error('汽水音乐排行榜获取失败')
    const list = formatTracks(body.chart.track_ranks)
    return {
      list: list.slice((page - 1) * this.limit, page * this.limit),
      total: list.length,
      limit: this.limit,
      page,
      source: 'sd',
    }
  },
  getDetailPageUrl(id) {
    return `https://music.douyin.com/qishui/share/chart?chart_id=${String(id).replace(/^sd__/, '')}`
  },
}
