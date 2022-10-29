import { httpFetch } from '../../request'
import { dateFormat2 } from '../../index'

export default {
  _requestObj: null,
  _requestObj2: null,
  async getComment({ songmid }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    const _requestObj = httpFetch(`http://comment.kuwo.cn/com.s?type=get_comment&uid=0&digest=15&sid=${songmid}&page=${page}&rows=${limit}&f=web&prod=MUSIC_8.7.7.0_BCS37&devid=28556413`, {
      headers: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9;)',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.result !== 'ok') throw new Error('获取评论失败')
    // console.log(body)
    return { source: 'kw', comments: this.filterComment(body.rows), total: body.total, page, limit, maxPage: Math.ceil(body.total / limit) || 1 }
  },
  async getHotComment({ songmid }, page = 1, limit = 100) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    const _requestObj2 = httpFetch(`http://comment.kuwo.cn/com.s?type=get_rec_comment&uid=0&digest=15&sid=${songmid}&page=${page}&rows=${limit}&f=web&prod=MUSIC_8.7.7.0_BCS37&devid=28556413`, {
      headers: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9;)',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    if (statusCode != 200 || body.result !== 'ok') throw new Error('获取热门评论失败')
    // console.log(body)
    return { source: 'kw', comments: this.filterComment(body.rows), total: body.total, page, limit, maxPage: Math.ceil(body.total / limit) || 1 }
  },
  filterComment(rawList) {
    if (!rawList) return []
    return rawList.map(item => {
      let data = {
        id: item.id,
        text: item.msg.split('\n'),
        time: item.time,
        timeStr: dateFormat2(new Date(item.time).getTime()),
        userName: decodeURIComponent(item.u_name),
        avatar: item.u_pic,
        userId: item.u_id,
        likedCount: item.like_num,
        reply: [],
      }
      return item.reply
        ? {
            id: item.id,
            rootId: item.reply.id,
            text: item.reply.msg.split('\n'),
            time: item.reply.time,
            timeStr: dateFormat2(new Date(item.reply.time).getTime()),
            userName: decodeURIComponent(item.reply.u_name),
            avatar: item.reply.u_pic,
            userId: item.reply.u_id,
            likedCount: item.reply.like_num,
            reply: [data],
          }
        : data
    })
  },
}
