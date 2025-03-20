import { httpFetch } from '../../request'
import { decodeName, dateFormat2 } from '../../index'
import { signatureParams } from './util'
// import { getMusicInfoRaw } from './musicInfo'

export default {
  _requestObj: null,
  _requestObj2: null,
  async getComment({ hash }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    // const res_id = (await getMusicInfoRaw(hash)).classification?.[0]?.res_id
    // if (!res_id) throw new Error('获取评论失败')

    let timestamp = Date.now()
    const params = `dfid=0&mid=16249512204336365674023395779019&clienttime=${timestamp}&uuid=0&extdata=${hash}&appid=1005&code=fc4be23b4e972707f36b8a828a93ba8a&schash=${hash}&clientver=11409&p=${page}&clienttoken=&pagesize=${limit}&ver=10&kugouid=0`
    // const params = `appid=1005&clienttime=${timestamp}&clienttoken=0&clientver=11409&code=fc4be23b4e972707f36b8a828a93ba8a&dfid=0&extdata=${hash}&kugouid=0&mid=16249512204336365674023395779019&mixsongid=${res_id}&p=${page}&pagesize=${limit}&uuid=0&ver=10`
    const _requestObj = httpFetch(`http://m.comment.service.kugou.com/r/v1/rank/newest?${params}&signature=${signatureParams(params)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.24',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.err_code !== 0) throw new Error('获取评论失败')
    const total = body.count ?? 0
    return { source: 'kg', comments: this.filterComment(body.list || []), total, page, limit, maxPage: Math.ceil(total / limit) || 1 }
  },
  async getHotComment({ hash }, page = 1, limit = 20) {
    // console.log(songmid)
    if (this._requestObj2) this._requestObj2.cancelHttp()
    let timestamp = Date.now()
    const params = `dfid=0&mid=16249512204336365674023395779019&clienttime=${timestamp}&uuid=0&extdata=${hash}&appid=1005&code=fc4be23b4e972707f36b8a828a93ba8a&schash=${hash}&clientver=11409&p=${page}&clienttoken=&pagesize=${limit}&ver=10&kugouid=0`
    // https://github.com/GitHub-ZC/wp_MusicApi/blob/bf9307dd138dc8ac6c4f7de29361209d4f5b665f/routes/v1/kugou/comment.js#L53
    const _requestObj2 = httpFetch(`http://m.comment.service.kugou.com/r/v1/rank/topliked?${params}&signature=${signatureParams(params)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.24',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    // console.log(body)
    if (statusCode != 200 || body.err_code !== 0) throw new Error('获取热门评论失败')
    const total = body.count ?? 0
    return { source: 'kg', comments: this.filterComment(body.list || []), total, page, limit, maxPage: Math.ceil(total / limit) || 1 }
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
  replaceAt(raw, atList) {
    atList.forEach((atobj) => {
      raw = raw.replaceAll(`[at=${atobj.id}]`, `@${atobj.name} `)
    })
    return raw
  },
  filterComment(rawList) {
    return rawList.map(item => {
      let data = {
        id: item.id,
        text: decodeName((item.atlist ? this.replaceAt(item.content, item.atlist) : item.content) || ''),
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
            text: decodeName(item.pcontent),
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
