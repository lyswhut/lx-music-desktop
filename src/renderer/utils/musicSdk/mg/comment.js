import { httpFetch } from '../../request'
import getSongId from './songId'
import { dateFormat2 } from '../../index'

export default {
  _requestObj: null,
  _requestObj2: null,
  _requestObj3: null,
  lastCommentIds: new Map(),
  async getComment(musicInfo, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (!musicInfo.songId) {
      let id = await getSongId(musicInfo)
      if (!id) throw new Error('获取评论失败')
      musicInfo.songId = id
    }
    if (page === 1) this.lastCommentIds.clear()
    const lastCommentId = this.lastCommentIds.get(String(page)) || ''
    if (!lastCommentId && page > 1) throw new Error('获取评论失败')
    // const _requestObj = httpFetch(`https://music.migu.cn/v3/api/comment/listComments?targetId=${musicInfo.songId}&pageSize=${limit}&pageNo=${page}`, {
    const _requestObj = httpFetch(`https://app.c.nf.migu.cn/MIGUM3.0/user/comment/stack/v1.0?pageSize=${limit}&queryType=1&resourceId=${musicInfo.songId}&resourceType=2&commentId=${lastCommentId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        // Referer: 'https://music.migu.cn',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.code !== '000000') throw new Error('获取评论失败')
    const total = parseInt(body.data.commentNums)
    const list = this.filterComment(body.data.comments)
    this.lastCommentIds.set(String(page + 1), list.length ? list[list.length - 1].id : '')
    return { source: 'mg', comments: list, total, page, limit, maxPage: Math.ceil(total / limit) || 1 }
  },
  async getHotComment(musicInfo, page = 1, limit = 20) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    if (!musicInfo.songId) {
      let id = await getSongId(musicInfo)
      if (!id) throw new Error('获取评论失败')
      musicInfo.songId = id
    }

    // const _requestObj2 = httpFetch(`https://music.migu.cn/v3/api/comment/listTopComments?targetId=${musicInfo.songId}&pageSize=${limit}&pageNo=${page}`, {
    const _requestObj2 = httpFetch(`https://app.c.nf.migu.cn/MIGUM3.0/user/comment/stack/v1.0?pageSize=${limit}&queryType=2&resourceId=${musicInfo.songId}&resourceType=2&hotCommentStart=${(page - 1) * limit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        // Referer: 'https://music.migu.cn',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    // console.log(body)
    if (statusCode != 200 || body.code !== '000000') throw new Error('获取热门评论失败')
    const total = parseInt(body.data.cfgHotCount)
    return { source: 'mg', comments: this.filterComment(body.data.hotComments), total, page, limit, maxPage: Math.ceil(total / limit) || 1 }
  },
  async getReplyComment(musicInfo, replyId, page = 1, limit = 10) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    // const _requestObj2 = httpFetch(`https://music.migu.cn/v3/api/comment/listCommentsById?commentId=${replyId}&pageSize=${limit}&pageNo=${page}`, {
    const _requestObj2 = httpFetch(`https://app.c.nf.migu.cn/MIGUM3.0/user/comment/stack/${replyId}/v1.0?pageSize=${limit}&queryType=2&resourceId=${musicInfo.songId}&resourceType=2&start=${(page - 1) * limit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    // console.log(body)
    if (statusCode != 200 || body.code !== '000000') throw new Error('获取回复评论失败')
    const total = parseInt(body.data.replyTotalCount)
    return { source: 'mg', comments: this.filterComment(body.data.mainCommentItem.replyComments), total, page, limit, maxPage: Math.ceil(total / limit) || 1 }
  },
  filterComment(rawList) {
    return rawList.map(item => ({
      id: item.commentId,
      text: item.commentInfo,
      time: item.commentTime,
      timeStr: dateFormat2(new Date(item.commentTime).getTime()),
      userName: item.user.nickName,
      avatar: item.user.middleIcon || item.user.bigIcon || item.user.smallIcon,
      userId: item.user.userId,
      likedCount: item.opNumItem.thumbNum,
      replyNum: item.replyTotalCount,
      reply: item.replyComments.map(c => ({
        id: c.replyId,
        text: c.replyInfo,
        time: c.replyTime,
        timeStr: dateFormat2(new Date(c.replyTime).getTime()),
        userName: c.user.nickName,
        avatar: c.user.middleIcon || c.user.bigIcon || c.user.smallIcon,
        userId: c.user.userId,
        likedCount: null,
        replyNum: null,
      })),
    }))
  },
}
