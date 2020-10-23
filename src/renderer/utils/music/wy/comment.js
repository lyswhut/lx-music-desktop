import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'
import { dateFormat2 } from '../../'

export default {
  _requestObj: null,
  _requestObj2: null,
  async getComment({ songmid }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    const _requestObj = httpFetch(`https://music.163.com/api/v1/resource/comments/R_SO_4_${songmid}`, {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
      },
      form: weapi({
        rid: songmid,
        limit: limit,
        offset: (page - 1) * limit,
        beforeTime: 0,
      }),
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.code !== 200) throw new Error('获取评论失败')
    console.log(body)
    return { source: 'wy', comments: this.filterComment(body.comments), total: body.total, page, limit, maxPage: Math.ceil(body.total / limit) || 1 }
  },
  async getHotComment({ songmid }, page = 1, limit = 100) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    const _requestObj2 = httpFetch(`https://music.163.com/api/v1/resource/comments/R_SO_4_${songmid}`, {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
      },
      form: weapi({
        rid: songmid,
        limit: limit,
        offset: (page - 1) * limit,
        beforeTime: 0,
      }),
    })
    const { body, statusCode } = await _requestObj2.promise
    if (statusCode != 200 || body.code !== 200) throw new Error('获取热门评论失败')
    // console.log(body)
    return { source: 'wy', comments: this.filterComment(body.hotComments) }
  },
  filterComment(rawList) {
    return rawList.map(item => {
      let data = {
        id: item.commentId,
        text: item.content ? item.content.split('\n') : '',
        time: item.time ? item.time : '',
        timeStr: item.time ? dateFormat2(item.time) : '',
        userName: item.user.nickname,
        avatar: item.user.avatarUrl,
        userId: item.user.userId,
        likedCount: item.likedCount,
        reply: [],
      }
      let replyData = item.beReplied[0]
      return replyData ? {
        id: item.commentId,
        rootId: replyData.beRepliedCommentId,
        text: replyData.content ? replyData.content.split('\n') : '',
        time: null,
        timeStr: null,
        userName: replyData.user.nickname,
        avatar: replyData.user.avatarUrl,
        userId: replyData.user.userId,
        likedCount: null,
        reply: [data],
      } : data
    })
  },
}
