import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'
import { dateFormat2 } from '../../'

let cursorTools = {
  cache: {},
  getCursor(id, page, limit) {
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
  setCursor(id, cursor, orderType, offset, page) {
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
  _requestObj: null,
  _requestObj2: null,
  async getComment({ songmid }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    const id = 'R_SO_4_' + songmid

    const cursorInfo = cursorTools.getCursor(songmid, page, limit)

    const _requestObj = httpFetch('https://music.163.com/weapi/comment/resource/comments/get', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
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
    return { source: 'wy', comments: this.filterComment(body.data.comments), total: body.data.totalCount, page, limit, maxPage: Math.ceil(body.data.totalCount / limit) || 1 }
  },
  async getHotComment({ songmid }, page = 1, limit = 100) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    const id = 'R_SO_4_' + songmid

    const _requestObj2 = httpFetch('https://music.163.com/weapi/comment/resource/comments/get', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
        Refere: 'http://music.163.com/',
      },
      form: weapi({
        cursor: Date.now().toString(),
        offset: 0,
        orderType: 1,
        pageNo: page,
        pageSize: limit,
        rid: id,
        threadId: id,
      }),
    })
    const { body, statusCode } = await _requestObj2.promise
    if (statusCode != 200 || body.code !== 200) throw new Error('获取热门评论失败')
    // console.log(body)
    return { source: 'wy', comments: this.filterComment(body.data.hotComments) }
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

      let replyData = item.beReplied && item.beReplied[0]
      return replyData ? {
        id: item.commentId,
        rootId: replyData.beRepliedCommentId,
        text: replyData.content ? replyData.content.split('\n') : '',
        time: item.time,
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
