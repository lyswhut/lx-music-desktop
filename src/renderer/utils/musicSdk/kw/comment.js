import { httpFetch } from '../../request'
import { dateFormat2 } from '../../index'

export default {
  _requestObj: null,
  _requestObj2: null,
  async getComment({ songmid }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    const _requestObj = httpFetch(`http://ncomment.kuwo.cn/com.s?f=web&type=get_comment&aapiver=1&prod=kwplayer_ar_10.5.2.0&digest=15&sid=${songmid}&start=${limit * (page - 1)}&msgflag=1&count=${limit}&newver=3&uid=0`, {
      headers: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9;)',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.code != '200') throw new Error('获取评论失败')
    // console.log(body)

    const total = body.comments_counts
    return {
      source: 'kw',
      comments: this.filterComment(body.comments),
      total,
      page,
      limit,
      maxPage: Math.ceil(total / limit) || 1,
    }
  },
  async getHotComment({ songmid }, page = 1, limit = 100) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    const _requestObj2 = httpFetch(`http://ncomment.kuwo.cn/com.s?f=web&type=get_rec_comment&aapiver=1&prod=kwplayer_ar_10.5.2.0&digest=15&sid=${songmid}&start=${limit * (page - 1)}&msgflag=1&count=${limit}&newver=3&uid=0`, {
      headers: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9;)',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    if (statusCode != 200 || body.code != '200') throw new Error('获取热门评论失败')
    // console.log(body)

    const total = body.hot_comments_counts
    return {
      source: 'kw',
      comments: this.filterComment(body.hot_comments),
      total,
      page,
      limit,
      maxPage: Math.ceil(total / limit) || 1,
    }
  },
  filterComment(rawList) {
    if (!rawList) return []
    return rawList.map(item => {
      return {
        id: item.id,
        text: item.msg,
        time: item.time,
        timeStr: dateFormat2(Number(item.time) * 1000),
        userName: item.u_name,
        avatar: item.u_pic,
        userId: item.u_id,
        likedCount: item.like_num,
        images: item.mpic ? [decodeURIComponent(item.mpic)] : [],
        reply: item.child_comments
          ? item.child_comments.map(i => {
            return {
              id: i.id,
              text: i.msg,
              time: i.time,
              timeStr: dateFormat2(Number(i.time) * 1000),
              userName: i.u_name,
              avatar: i.u_pic,
              userId: i.u_id,
              likedCount: i.like_num,
              images: i.mpic ? [i.mpic] : [],
            }
          })
          : [],
      }
    })
  },
}
