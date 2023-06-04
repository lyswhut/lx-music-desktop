import { httpFetch } from '../../request'
import { dateFormat2 } from '../../index'
import getMusicInfo from './musicInfo'

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

const songIdMap = new Map()
const promises = new Map()

export default {
  _requestObj: null,
  _requestObj2: null,
  async getSongId({ songId, songmid }) {
    if (songId) return songId
    if (songIdMap.has(songmid)) return songIdMap.get(songmid)
    if (promises.has(songmid)) return (await promises.get(songmid)).songId
    const promise = getMusicInfo(songmid)
    promises.set(promise)
    const info = await promise
    songIdMap.set(songmid, info.songId)
    promises.delete(songmid)
    return info.songId
  },
  async getComment(mInfo, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()
    const songId = await this.getSongId(mInfo)

    const _requestObj = httpFetch('http://c.y.qq.com/base/fcgi-bin/fcg_global_comment_h5.fcg', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
      },
      form: {
        uin: '0',
        format: 'json',
        cid: '205360772',
        reqtype: '2',
        biztype: '1',
        topid: songId,
        cmd: '8',
        needmusiccrit: '1',
        pagenum: page - 1,
        pagesize: limit,
      },
    })
    const { body, statusCode } = await _requestObj.promise
    if (statusCode != 200 || body.code !== 0) throw new Error('获取评论失败')
    // console.log(body, statusCode)
    const comment = body.comment
    return {
      source: 'tx',
      comments: this.filterNewComment(comment.commentlist),
      total: comment.commenttotal,
      page,
      limit,
      maxPage: Math.ceil(comment.commenttotal / limit) || 1,
    }
  },
  async getHotComment(mInfo, page = 1, limit = 20) {
    // const _requestObj2 = httpFetch('http://c.y.qq.com/base/fcgi-bin/fcg_global_comment_h5.fcg', {
    //   method: 'POST',
    //   headers: {
    //     'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
    //   },
    //   form: {
    //     uin: '0',
    //     format: 'json',
    //     cid: '205360772',
    //     reqtype: '2',
    //     biztype: '1',
    //     topid: songId,
    //     cmd: '9',
    //     needmusiccrit: '1',
    //     pagenum: page - 1,
    //     pagesize: limit,
    //   },
    // })
    if (this._requestObj2) this._requestObj2.cancelHttp()
    const songId = await this.getSongId(mInfo)

    const _requestObj2 = httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'POST',
      body: {
        comm: {
          cv: 4747474,
          ct: 24,
          format: 'json',
          inCharset: 'utf-8',
          outCharset: 'utf-8',
          notice: 0,
          platform: 'yqq.json',
          needNewCode: 1,
          uin: 0,
        },
        req: {
          module: 'music.globalComment.CommentRead',
          method: 'GetHotCommentList',
          param: {
            BizType: 1,
            BizId: String(songId),
            LastCommentSeqNo: '',
            PageSize: limit,
            PageNum: page - 1,
            HotType: 1,
            WithAirborne: 0,
            PicEnable: 1,
          },
        },
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.0.0',
        referer: 'https://y.qq.com/',
        origin: 'https://y.qq.com',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    // console.log('body', body)
    if (statusCode != 200 || body.code !== 0 || body.req.code !== 0) throw new Error('获取热门评论失败')
    const comment = body.req.data.CommentList
    return {
      source: 'tx',
      comments: this.filterHotComment(comment.Comments),
      total: comment.Total,
      page,
      limit,
      maxPage: Math.ceil(comment.Total / limit) || 1,
    }
  },
  filterNewComment(rawList) {
    return rawList.map(item => {
      let time = this.formatTime(item.time)
      let timeStr = time ? dateFormat2(time) : null
      if (item.middlecommentcontent) {
        let firstItem = item.middlecommentcontent[0]
        firstItem.avatarurl = item.avatarurl
        firstItem.praisenum = item.praisenum
        item.avatarurl = null
        item.praisenum = null
        item.middlecommentcontent.reverse()
      }
      return {
        id: `${item.rootcommentid}_${item.commentid}`,
        rootId: item.rootcommentid,
        text: item.rootcommentcontent ? this.replaceEmoji(item.rootcommentcontent).replace(/\\n/g, '\n') : '',
        time: item.rootcommentid == item.commentid ? time : null,
        timeStr: item.rootcommentid == item.commentid ? timeStr : null,
        userName: item.rootcommentnick ? item.rootcommentnick.substring(1) : '',
        avatar: item.avatarurl,
        userId: item.encrypt_rootcommentuin,
        likedCount: item.praisenum,
        reply: item.middlecommentcontent
          ? item.middlecommentcontent.map(c => {
            // let index = c.subcommentid.lastIndexOf('_')
            return {
              id: `sub_${item.rootcommentid}_${c.subcommentid}`,
              text: this.replaceEmoji(c.subcommentcontent).replace(/\\n/g, '\n'),
              time: c.subcommentid == item.commentid ? time : null,
              timeStr: c.subcommentid == item.commentid ? timeStr : null,
              userName: c.replynick.substring(1),
              avatar: c.avatarurl,
              userId: c.encrypt_replyuin,
              likedCount: c.praisenum,
            }
          })
          : [],
      }
    })
  },
  filterHotComment(rawList) {
    return rawList.map(item => {
      return {
        id: `${item.SeqNo}_${item.CmId}`,
        rootId: item.SeqNo,
        text: item.Content ? this.replaceEmoji(item.Content).replace(/\\n/g, '\n') : '',
        time: item.PubTime ? this.formatTime(item.PubTime) : null,
        timeStr: item.PubTime ? dateFormat2(this.formatTime(item.PubTime)) : null,
        userName: item.Nick ?? '',
        images: item.Pic ? [item.Pic] : [],
        avatar: item.Avatar,
        location: item.Location ? item.Location : '',
        userId: item.EncryptUin,
        likedCount: item.PraiseNum,
        reply: item.SubComments
          ? item.SubComments.map(c => {
            return {
              id: `sub_${c.SeqNo}_${c.CmId}`,
              text: this.replaceEmoji(c.Content).replace(/\\n/g, '\n'),
              time: c.PubTime ? this.formatTime(c.PubTime) : null,
              timeStr: c.PubTime ? dateFormat2(this.formatTime(c.PubTime)) : null,
              userName: c.Nick ?? '',
              avatar: c.Avatar,
              images: c.Pic ? [c.Pic] : [],
              userId: c.EncryptUin,
              likedCount: c.PraiseNum,
            }
          })
          : [],
      }
    })
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
  formatTime(time) {
    return String(time).length < 10 ? null : parseInt(time + '000')
  },
}
