import { search } from './api'
import { createPager, formatTracks, formatPlaylist } from './utils'

export const searchPage = async(type, keyword, cursor) => {
  const body = await search(type, keyword, cursor).promise
  if (!Array.isArray(body.result_groups)) throw new Error('汽水音乐搜索失败，请稍后重试')
  const group = body.result_groups.find(group => group.id == (type == 'track' ? 'tracks' : 'playlists'))
  return {
    list: type == 'track'
      ? formatTracks(group?.data)
      : (group?.data ?? []).map(item => item.entity?.playlist).filter(item => item?.id).map(formatPlaylist),
    cursor: group?.next_cursor,
    hasMore: group?.has_more,
  }
}

const getPage = createPager((keyword, cursor) => searchPage('track', keyword, cursor))

export default {
  limit: 20,
  search(keyword, page = 1, limit = this.limit) {
    return getPage(keyword, page, limit)
  },
}
