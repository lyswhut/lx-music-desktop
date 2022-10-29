import { httpFetch } from '../../request'
import album from './album'
import { dateFormat2 } from '../../index'

export default {
  _requestObj: null,
  _requestObj2: null,
  _requestObj3: null,
  async getSongId(musicInfo) {
    if (this._requestObj3) this._requestObj3.cancelHttp()
    this.requestObj3 = album.getAlbum(musicInfo)
    const list = await this.requestObj3.promise
    const copyrightId = musicInfo.copyrightId
    let info = list.find(s => s.copyrightId == copyrightId)
    const songmid = musicInfo.songmid
    if (!info) info = list.find(s => s.songId == songmid)
    return info ? info.songId : null
  },
  async getComment(musicInfo, page = 1, limit = 10) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (!musicInfo.songId) {
      let id = await this.getSongId(musicInfo)
      if (!id) throw new Error('获取评论失败')
      musicInfo.songId = id
    }

    const _requestObj = httpFetch(`https://music.migu.cn/v3/api/comment/listComments?targetId=${musicInfo.songId}&pageSize=${limit}&pageNo=${page}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4195.1 Safari/537.36',
        Referer: 'https://music.migu.cn',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.returnCode !== '000000') throw new Error('获取评论失败')
    return { source: 'mg', comments: this.filterComment(body.data.items), total: body.data.itemTotal, page, limit, maxPage: Math.ceil(body.data.itemTotal / limit) || 1 }
  },
  async getHotComment(musicInfo, page = 1, limit = 5) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    if (!musicInfo.songId) {
      let id = await this.getSongId(musicInfo)
      if (!id) throw new Error('获取评论失败')
      musicInfo.songId = id
    }

    const _requestObj2 = httpFetch(`https://music.migu.cn/v3/api/comment/listTopComments?targetId=${musicInfo.songId}&pageSize=${limit}&pageNo=${page}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4195.1 Safari/537.36',
        Referer: 'https://music.migu.cn',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    // console.log(body)
    if (statusCode != 200 || body.returnCode !== '000000') throw new Error('获取热门评论失败')
    return { source: 'mg', comments: this.filterComment(body.data.items), total: body.data.itemTotal, page, limit, maxPage: Math.ceil(body.data.itemTotal / limit) || 1 }
  },
  async getReplyComment(musicInfo, replyId, page = 1, limit = 10) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    const _requestObj2 = httpFetch(`https://music.migu.cn/v3/api/comment/listCommentsById?commentId=${replyId}&pageSize=${limit}&pageNo=${page}`, {
      headers: {
        'User-Agent': 'Android712-AndroidPhone-8983-18-0-COMMENT-wifi',
      },
    })
    const { body, statusCode } = await _requestObj2.promise
    // console.log(body)
    if (statusCode != 200 || body.returnCode !== '000000') throw new Error('获取回复评论失败')
    return { source: 'mg', comments: this.filterComment(body.data.items) }
  },
  filterComment(rawList) {
    return rawList.map(item => ({
      id: item.commentId,
      text: item.body.split('\n'),
      time: item.createTime,
      timeStr: dateFormat2(new Date(item.createTime).getTime()),
      userName: item.author.name,
      avatar: item.author.avatar && item.author.avatar.startsWith('//') ? `http:${item.author.avatar}` : item.author.avatar,
      userId: item.author.id,
      likedCount: item.praiseCount,
      replyNum: item.replyTotal,
      reply: item.replyCommentList.map(c => ({
        id: c.commentId,
        text: c.body.split('\n'),
        time: c.createTime,
        timeStr: dateFormat2(new Date(c.createTime).getTime()),
        userName: c.author.name,
        avatar: c.author.avatar,
        userId: c.author.id,
        likedCount: c.praiseCount,
        replyNum: c.replyTotal,
      })),
    }))
  },
}
