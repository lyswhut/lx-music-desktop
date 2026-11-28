import { dateFormat2 } from '../../index'
import { request } from './api'
import { coverUrl, createPager } from './utils'

export const formatComment = item => ({
  id: String(item.id),
  text: item.content ?? '',
  time: (Number(item.time_created) || 0) * 1000,
  timeStr: dateFormat2((Number(item.time_created) || 0) * 1000),
  userName: item.user?.nickname ?? '',
  avatar: coverUrl(item.user?.medium_avatar_url ?? item.user?.thumb_avatar_url),
  userId: String(item.user?.id ?? ''),
  likedCount: Number(item.count_digged) || 0,
  replyNum: Number(item.count_reply) || 0,
  location: item.ip_label ?? '',
  images: (item.image_list ?? []).map(image => coverUrl(image.medium_url ?? image.origin_url)).filter(Boolean),
  reply: (item.replies ?? []).map(formatComment),
})

const getPage = createPager(async(key, cursor) => {
  const [songId, sort, count] = JSON.parse(key)
  const body = await request('/luna/comments', {
    params: { group_id: songId, cursor, count, group_type: '0', image_strategy: '2', sort_type: sort },
  }).promise
  if (!Array.isArray(body.comments) && body.comments != null) throw new Error('汽水音乐评论获取失败')
  return {
    list: (body.comments ?? []).map(formatComment),
    cursor: body.cursor,
    hasMore: body.has_more,
    total: Number(body.count) || 0,
  }
})

const getComments = async(musicInfo, sort, page, limit) => {
  const result = await getPage(JSON.stringify([String(musicInfo.songmid), sort, limit]), page, limit)
  return { source: 'sd', comments: result.list, total: result.total, page, limit, maxPage: result.allPage || 1 }
}

export default {
  getComment(musicInfo, page = 1, limit = 20) {
    return getComments(musicInfo, 'time', page, limit)
  },
  getHotComment(musicInfo, page = 1, limit = 20) {
    return getComments(musicInfo, 'smart_hot', page, limit)
  },
}
