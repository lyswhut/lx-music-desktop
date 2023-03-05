import { httpFetch } from '../../request'
import { decodeName, dateFormat2 } from '../../index'
import { toMD5 } from '../utils'

export default {
  _requestObj: null,
  _requestObj2: null,
  async getComment({ hash, songmid }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    let timestamp = Date.now()
    let OIlwieks = '28dk2k092lksi2UIkp'
    let sign_params = `OIlwieks${OIlwieks}appid=1005childrenid=${songmid}clienttime=${timestamp}clienttoken=0364933ef7daa8c0f150e91b49e6bc38ceaf106e6c49400c230936282b0a0dd8clientver=11409code=fc4be23b4e972707f36b8a828a93ba8adfid=347VvU1FGsNW0XwQu30ZZolsextdata=${hash}kugouid=0mid=162495122043363656740233957790194166813mixsongid=0p=${page}pagesize=${limit}uuid=0ver=10OIlwieks${OIlwieks}`
    let signature = toMD5(sign_params)
    const _requestObj = httpFetch(`http://m.comment.service.kugou.com/v1/cmtlist?dfid=347VvU1FGsNW0XwQu30ZZols&mid=162495122043363656740233957790194166813&signature=${signature}&clienttime=${timestamp}&uuid=0&extdata=${hash}&appid=1005&code=fc4be23b4e972707f36b8a828a93ba8a&childrenid=${songmid}&clientver=11409&p=${page}&mixsongid=0&clienttoken=0364933ef7daa8c0f150e91b49e6bc38ceaf106e6c49400c230936282b0a0dd8&pagesize=${limit}&ver=10&kugouid=0`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.24',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.err_code !== 0) throw new Error('获取评论失败')
    return { source: 'kg', comments: this.filterComment(body.list || []), total: body.count, page, limit, maxPage: body.maxPage }
  },
  async getHotComment({ hash, songmid }, page = 1, limit = 20) {
    // console.log(songmid)
    if (this._requestObj2) this._requestObj2.cancelHttp()
    let timestamp = Date.now()
    let OIlwieks = '28dk2k092lksi2UIkp'
    let sign_params = `OIlwieks${OIlwieks}appid=1005childrenid=${songmid}clienttime=${timestamp}clienttoken=0364933ef7daa8c0f150e91b49e6bc38ceaf106e6c49400c230936282b0a0dd8clientver=11409code=fc4be23b4e972707f36b8a828a93ba8adfid=347VvU1FGsNW0XwQu30ZZolsextdata=${hash}kugouid=0mid=162495122043363656740233957790194166813mixsongid=0p=${page}pagesize=${limit}uuid=0ver=10OIlwieks${OIlwieks}`
    let signature = toMD5(sign_params)
    const _requestObj2 = httpFetch(`http://m.comment.service.kugou.com/v1/weightlist?dfid=347VvU1FGsNW0XwQu30ZZols&mid=162495122043363656740233957790194166813&signature=${signature}&clienttime=${timestamp}&uuid=0&extdata=${hash}&appid=1005&code=fc4be23b4e972707f36b8a828a93ba8a&childrenid=${songmid}&clientver=11409&p=${page}&mixsongid=0&clienttoken=0364933ef7daa8c0f150e91b49e6bc38ceaf106e6c49400c230936282b0a0dd8&pagesize=${limit}&ver=10&kugouid=0`, {
      headers: {
        'User-Agent': 'Android712-AndroidPhone-8983-18-0-COMMENT-wifi',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    // console.log(body)
    if (statusCode != 200 || body.err_code !== 0) throw new Error('获取热门评论失败')
    const total = body.count ?? 0
    return { source: 'kg', comments: this.filterComment(body.list || []), total, page, limit, maxPage: Math.ceil(body.count / limit) || 1 }
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
