import { xmRequest } from './util'
import { dateFormat2 } from '../../'

export default {
  _requestObj: null,
  _requestObj2: null,
  async getComment({ songmid }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    const _requestObj = xmRequest('/api/comment/getCommentList', { objectId: songmid, objectType: 'song', pagingVO: { page, pageSize: limit } })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.code !== 'SUCCESS') throw new Error('获取评论失败')
    return { source: 'xm', comments: this.filterComment(body.result.data.commentList), total: body.result.data.pagingVO.count, page, limit, maxPage: Math.ceil(body.result.data.pagingVO.count / limit) || 1 }
  },
  async getHotComment({ songmid }, page = 1, limit = 100) {
    if (this._requestObj2) this._requestObj2.cancelHttp()
    if (!songmid) throw new Error('获取失败')
    const _requestObj2 = xmRequest('/api/comment/getHotCommentList', { objectId: songmid, objectType: 'song', pagingVO: { page, pageSize: limit } })
    const { body, statusCode } = await _requestObj2.promise
    // console.log(body)
    if (statusCode != 200 || body.code !== 'SUCCESS') throw new Error('获取热门评论失败')
    return { source: 'xm', comments: this.filterComment(body.result.data.hotList) }
  },
  filterComment(rawList) {
    return rawList.map(item => ({
      id: item.commentId,
      text: item.message.split('\n').filter(t => !!t),
      time: item.gmtCreate,
      timeStr: dateFormat2(item.gmtCreate),
      userName: item.nickName,
      avatar: item.avatar,
      userId: item.userId,
      likedCount: item.likes,
      reply: item.replyData ? item.replyData.map(c => ({
        id: c.commentId,
        text: c.message.split('\n').filter(t => !!t),
        time: c.gmtCreate,
        timeStr: dateFormat2(c.gmtCreate),
        userName: c.nickName,
        avatar: c.avatar,
        userId: c.userId,
        likedCount: c.likes,
      })) : [],
    }))
  },
}
