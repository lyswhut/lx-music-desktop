import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'
import { dateFormat2 } from '../../index'

const emojis = [
  ['大笑', '😃'],
  ['可爱', '😊'],
  ['憨笑', '☺️'],
  ['色', '😍'],
  ['亲亲', '😙'],
  ['惊恐', '😱'],
  ['流泪', '😭'],
  ['亲', '😚'],
  ['呆', '😳'],
  ['哀伤', '😔'],
  ['呲牙', '😁'],
  ['吐舌', '😝'],
  ['撇嘴', '😒'],
  ['怒', '😡'],
  ['奸笑', '😏'],
  ['汗', '😓'],
  ['痛苦', '😖'],
  ['惶恐', '😰'],
  ['生病', '😨'],
  ['口罩', '😷'],
  ['大哭', '😂'],
  ['晕', '😵'],
  ['发怒', '👿'],
  ['开心', '😄'],
  ['鬼脸', '😜'],
  ['皱眉', '😞'],
  ['流感', '😢'],
  ['爱心', '❤️'],
  ['心碎', '💔'],
  ['钟情', '💘'],
  ['星星', '⭐️'],
  ['生气', '💢'],
  ['便便', '💩'],
  ['强', '👍'],
  ['弱', '👎'],
  ['拜', '🙏'],
  ['牵手', '👫'],
  ['跳舞', '👯‍♀️'],
  ['禁止', '🙅‍♀️'],
  ['这边', '💁‍♀️'],
  ['爱意', '💏'],
  ['示爱', '👩‍❤️‍👨'],
  ['嘴唇', '👄'],
  ['狗', '🐶'],
  ['猫', '🐱'],
  ['猪', '🐷'],
  ['兔子', '🐰'],
  ['小鸡', '🐤'],
  ['公鸡', '🐔'],
  ['幽灵', '👻'],
  ['圣诞', '🎅'],
  ['外星', '👽'],
  ['钻石', '💎'],
  ['礼物', '🎁'],
  ['男孩', '👦'],
  ['女孩', '👧'],
  ['蛋糕', '🎂'],
  ['18', '🔞'],
  ['圈', '⭕'],
  ['叉', '❌'],
]

const applyEmoji = (text: any) => {
  for (const e of emojis) text = text.replaceAll(`[${e[0]}]`, e[1])
  return text
}

const cache: Record<string, any> = {}

let cursorTools = {
  cache,
  getCursor(id: any, page: any, limit: any) {
    let cacheData = this.cache[id]
    if (!cacheData) cacheData = this.cache[id] = {}
    let orderType
    let cursor
    let offset
    if (page == 1) {
      cacheData.page = 1
      cursor = cacheData.cursor = cacheData.prevCursor = Date.now()
      orderType = 1
      offset = 0
    } else if (cacheData.page) {
      cursor = cacheData.cursor
      if (page > cacheData.page) {
        orderType = 1
        offset = (page - cacheData.page - 1) * limit
      } else if (page < cacheData.page) {
        orderType = 0
        offset = (cacheData.page - page - 1) * limit
      } else {
        cursor = cacheData.cursor = cacheData.prevCursor
        offset = cacheData.offset
        orderType = cacheData.orderType
      }
    }
    return {
      orderType,
      cursor,
      offset,
    }
  },
  setCursor(id: any, cursor: any, orderType: any, offset: any, page: any) {
    let cacheData = this.cache[id]
    if (!cacheData) cacheData = this.cache[id] = {}
    cacheData.prevCursor = cacheData.cursor
    cacheData.cursor = cursor
    cacheData.orderType = orderType
    cacheData.offset = offset
    cacheData.page = page
  },
}

export default {
  _requestObj: null as any,
  _requestObj2: null as any,
  async getComment({ songmid }: any, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    const id = 'R_SO_4_' + songmid

    const cursorInfo = cursorTools.getCursor(songmid, page, limit)

    const _requestObj = httpFetch('https://music.163.com/weapi/comment/resource/comments/get', {
      method: 'post',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
        Refere: 'http://music.163.com/',
      },
      form: weapi({
        cursor: cursorInfo.cursor,
        offset: cursorInfo.offset,
        orderType: cursorInfo.orderType,
        pageNo: page,
        pageSize: limit,
        rid: id,
        threadId: id,
      }),
    })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.code !== 200) throw new Error('获取评论失败')
    cursorTools.setCursor(songmid, body.data.cursor, cursorInfo.orderType, cursorInfo.offset, page)
    return {
      source: 'wy',
      comments: this.filterComment(body.data.comments),
      total: body.data.totalCount,
      page,
      limit,
      maxPage: Math.ceil(body.data.totalCount / limit) || 1,
    }
  },
  async getHotComment({ songmid }: any, page = 1, limit = 100) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    const id = 'R_SO_4_' + songmid
    page = page - 1

    const _requestObj2 = httpFetch(`https://music.163.com/weapi/v1/resource/hotcomments/${id}`, {
      method: 'post',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
        Refere: 'http://music.163.com/',
      },
      form: weapi({
        rid: id,
        limit,
        offset: limit * page,
        beforeTime: Date.now().toString(),
      }),
    })
    const { body, statusCode } = await _requestObj2.promise
    if (statusCode != 200 || body.code !== 200) throw new Error('获取热门评论失败')
    const total = body.total ?? 0
    return {
      source: 'wy',
      comments: this.filterComment(body.hotComments),
      total,
      page,
      limit,
      maxPage: Math.ceil(total / limit) || 1,
    }
  },
  filterComment(rawList: any) {
    return rawList.map((item: any) => {
      let data = {
        id: item.commentId,
        text: item.content ? applyEmoji(item.content) : '',
        time: item.time ? item.time : '',
        timeStr: item.time ? dateFormat2(item.time) : '',
        location: item.ipLocation?.location,
        userName: item.user.nickname,
        avatar: item.user.avatarUrl,
        userId: item.user.userId,
        likedCount: item.likedCount,
        reply: [],
      }

      let replyData = item.beReplied?.[0]
      return replyData
        ? {
            id: item.commentId,
            rootId: replyData.beRepliedCommentId,
            text: replyData.content ? applyEmoji(replyData.content) : '',
            time: item.time,
            timeStr: null,
            location: replyData.ipLocation?.location,
            userName: replyData.user.nickname,
            avatar: replyData.user.avatarUrl,
            userId: replyData.user.userId,
            likedCount: null,
            reply: [data],
          }
        : data
    })
  },
}
