import { httpFetch } from '../../request'
import { dateFormat2 } from '../../index'

const emojis = {
  e400846: '😘',
  e400874: '😴',
  e400825: '😃',
  e400847: '😙',
  e400835: '😍',
  e400873: '😳',
  e400836: '😎',
  e400867: '😭',
  e400832: '😊',
  e400837: '😏',
  e400875: '😫',
  e400831: '😉',
  e400855: '😡',
  e400823: '😄',
  e400862: '😨',
  e400844: '😖',
  e400841: '😓',
  e400830: '😈',
  e400828: '😆',
  e400833: '😋',
  e400822: '😀',
  e400843: '😕',
  e400829: '😇',
  e400824: '😂',
  e400834: '😌',
  e400877: '😷',
  e400132: '🍉',
  e400181: '🍺',
  e401067: '☕️',
  e400186: '🥧',
  e400343: '🐷',
  e400116: '🌹',
  e400126: '🍃',
  e400613: '💋',
  e401236: '❤️',
  e400622: '💔',
  e400637: '💣',
  e400643: '💩',
  e400773: '🔪',
  e400102: '🌛',
  e401328: '🌞',
  e400420: '👏',
  e400914: '🙌',
  e400408: '👍',
  e400414: '👎',
  e401121: '✋',
  e400396: '👋',
  e400384: '👉',
  e401115: '✊',
  e400402: '👌',
  e400905: '🙈',
  e400906: '🙉',
  e400907: '🙊',
  e400562: '👻',
  e400932: '🙏',
  e400644: '💪',
  e400611: '💉',
  e400185: '🎁',
  e400655: '💰',
  e400325: '🐥',
  e400612: '💊',
  e400198: '🎉',
  e401685: '⚡️',
  e400631: '💝',
  e400768: '🔥',
  e400432: '👑',
}

export default {
  _requestObj: null,
  _requestObj2: null,
  async getComment({ songMid }, page = 1, limit = 20, msgId) {
    if (this._requestObj) this._requestObj.cancelHttp()
    const _requestObj = httpFetch(`https://u.y.qq.com/cgi-bin/musicu.fcg?data={"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":0,"g_tk_new_20200303":1231670726,"g_tk":1231670726},"req_1":{"module":"music.globalComment.CommentRead","method":"GetNewCommentList","param":{"BizType":1,"BizId":"${songMid}","PageSize":20,"PageNum":${Number(page) - 1},"LastCommentSeqNo":"${msgId}","FromCommentId":"","WithHot":0,"PicEnable":1}}}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
        origin: 'https://y.qq.com',
        referer: 'https://y.qq.com',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.code != 0) throw new Error('获取评论失败')
    const comment = body.req_1.data
    return {
      source: 'tx',
      comments: this.filterComment(comment.CommentList.Comments),
      total: comment.CommentList.Total,
      page,
      limit,
      maxPage: Math.ceil(comment.CommentList.Total / limit) || 1,
    }
  },
  async getHotComment({ songMid }, page = 1, limit = 100) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    const _requestObj2 = httpFetch(`https://u.y.qq.com/cgi-bin/musicu.fcg?data={"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":0,"g_tk_new_20200303":1231670726,"g_tk":1231670726},"req_1":{"module":"music.globalComment.CommentRead","method":"GetNewCommentList","param":{"BizType":1,"BizId":"${songMid}","LastCommentSeqNo":"","PageSize":20,"PageNum":${Number(page) - 1},"FromCommentId":"","WithHot":1,"PicEnable":1,"LastTotal":0,"LastTotalVer":"0"}}}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
        origin: 'https://y.qq.com',
        referer: 'https://y.qq.com',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    if (statusCode != 200 || body.code !== 0) throw new Error('获取热门评论失败')
    const comment = body.req_1.data
    return {
      source: 'tx',
      comments: this.filterComment(comment.CommentList3.Comments),
      total: comment.CommentList3.Total,
      page,
      limit,
      maxPage: Math.ceil(comment.CommentList3.Total / limit) || 1,
    }
  },
  replaceEmoji(msg) {
    let rxp = /^\[em\](e\d+)\[\/em\]$/
    let result = msg.match(/\[em\]e\d+\[\/em\]/g)
    if (!result) return msg
    result = Array.from(new Set(result))
    for (let item of result) {
      let code = item.replace(rxp, '$1')
      msg = msg.replace(new RegExp(item.replace('[em]', '\\[em\\]').replace('[/em]', '\\[\\/em\\]'), 'g'), emojis[code] || '')
    }
    return msg
  },
  filterComment(rawList) {
    return rawList.map(item => {
      // TODO 回复
      let time = String(item.PubTime).length < 10 ? null : parseInt(item.PubTime + '000')
      let timeStr = time ? dateFormat2(time) : null
      // if (item.middlecommentcontent) {
      //   let firstItem = item.middlecommentcontent[0]
      //   firstItem.avatarurl = item.avatarurl
      //   firstItem.praisenum = item.praisenum
      //   item.avatarurl = null
      //   item.praisenum = null
      //   item.middlecommentcontent.reverse()
      // }
      return {
        id: item.SeqNo,
        rootId: item.rootcommentid,
        text: item.Content ? this.replaceEmoji(item.Content).replace(/\\n/g, '\n').split('\n') : [],
        time,
        timeStr,
        userName: item.Nick ? item.Nick : '',
        avatar: item.Avatar,
        userId: item.EncryptUin,
        likedCount: item.PraiseNum,
        reply: [],
      }
    })
  },
}
