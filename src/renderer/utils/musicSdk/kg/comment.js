import { httpFetch } from '../../request'
import { decodeName, dateFormat2 } from '../../index'

export default {
  _requestObj: null,
  _requestObj2: null,
  async getComment({ hash }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    const _requestObj = httpFetch(`http://comment.service.kugou.com/index.php?r=commentsv2/getCommentWithLike&code=fc4be23b4e972707f36b8a828a93ba8a&extdata=${hash}&p=${page}&pagesize=${limit}&ver=1.01&clientver=8373&appid=1001&kugouid=687373022&need_show_image=1`, {
      headers: {
        'User-Agent': 'Android712-AndroidPhone-8983-18-0-COMMENT-wifi',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.err_code !== 0) throw new Error('获取评论失败')
    return { source: 'kg', comments: this.filterComment(body.list || []), total: body.count, page, limit, maxPage: Math.ceil(body.count / limit) || 1 }
  },
  async getHotComment({ hash, songmid }, page = 1, limit = 100) {
    // console.log(songmid)
    if (this._requestObj2) this._requestObj2.cancelHttp()

    const _requestObj2 = httpFetch(`http://comment.service.kugou.com/index.php?r=commentsv2/getCommentWithLike&code=fc4be23b4e972707f36b8a828a93ba8a&extdata=${hash}&p=${page}&pagesize=${limit}&ver=1.01&clientver=8373&appid=1001&kugouid=687373022&need_show_image=1`, {
      headers: {
        'User-Agent': 'Android712-AndroidPhone-8983-18-0-COMMENT-wifi',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    // console.log(body)
    if (statusCode != 200 || body.err_code !== 0) throw new Error('获取热门评论失败')
    const total = body.weightList?.length ?? 0
    return { source: 'kg', comments: this.filterComment(body.weightList || []), total, page, limit, maxPage: 1 }
  },
  async getReplyComment({ songmid, audioId }, replyId, page = 1, limit = 100) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    songmid = songmid.length == 32 // 修复歌曲ID存储变更导致图片获取失败的问题
      ? audioId.split('_')[0]
      : songmid

    const _requestObj2 = httpFetch(`http://comment.service.kugou.com/index.php?r=commentsv2/getReplyWithLike&code=fc4be23b4e972707f36b8a828a93ba8a&p=${page}&pagesize=${limit}&ver=1.01&clientver=8373&kugouid=687373022&need_show_image=1&appid=1001&childrenid=${songmid}&tid=${replyId}`, {
      headers: {
        'User-Agent': 'Android712-AndroidPhone-8983-18-0-COMMENT-wifi',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    // console.log(body)
    if (statusCode != 200 || body.err_code !== 0) throw new Error('获取回复评论失败')
    return { source: 'kg', comments: this.filterComment(body.list || []) }
  },
  filterComment(rawList) {
    return rawList.map(item => {
      let data = {
        id: item.id,
        text: decodeName(item.content || '').split('\n'),
        images: item.images ? item.images.map(i => i.url) : [],
        location: item.location,
        time: item.addtime,
        timeStr: dateFormat2(new Date(item.addtime).getTime()),
        userName: item.user_name,
        avatar: item.user_pic,
        userId: item.user_id,
        likedCount: item.like.likenum,
        replyNum: item.reply_num,
        reply: [],
      }

      return item.pcontent
        ? {
            id: item.id,
            text: decodeName(item.pcontent).split('\n'),
            time: null,
            userName: item.puser,
            avatar: null,
            userId: item.puser_id,
            likedCount: null,
            replyNum: null,
            reply: [data],
          }
        : data
    })
  },
}
