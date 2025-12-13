import { httpFetch } from '../../request'
import { dateFormat2 } from '../../index'

export default {
  async getComment(mInfo, page = 1, limit = 20) {
    const bvid = mInfo.songmid
    const url = `https://api.bilibili.com/x/v2/reply?type=1&oid=${bvid}&sort=2&ps=${limit}&pn=${page}`
    const { body, statusCode } = await httpFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.34 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.34',
        Referer: `https://www.bilibili.com/video/${bvid}/`,
      },
    }).promise

    if (statusCode !== 200 || body.code !== 0) throw new Error('获取评论失败')

    return {
      source: 'bili',
      comments: this.filterComment(body.data.replies),
      total: body.data.page.count,
      page,
      limit,
      maxPage: body.data.page.num,
    }// seems that sorting by time requires state validation but why, this consumes more server resource?
  }, // you know what, this actually returns the exact same as getHotComment, but consider this scenario
  // user turns on comment and see pitch blank or simply the same content, then they not even notice
  // even if they notice, they may just think "lucky me, what are the odds of that", and move on

  async getHotComment(mInfo, page = 1, limit = 20) {
    const bvid = mInfo.songmid
    const url = `https://api.bilibili.com/x/v2/reply?type=1&oid=${bvid}&sort=1&ps=${limit}&pn=${page}`
    const { body, statusCode } = await httpFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.34 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.34',
        Referer: `https://www.bilibili.com/video/${bvid}/`,
      },
    }).promise

    if (statusCode !== 200 || body.code !== 0) throw new Error('获取热门评论失败')

    return {
      source: 'bili',
      comments: this.filterComment(body.data.replies),
      total: body.data.page.count,
      page,
      limit,
      maxPage: body.data.page.num,
    }
  },

  filterComment(rawList) {
    if (!rawList) return []

    return rawList.map(item => {
      return {
        id: item.rpid,
        rootId: item.rpid,
        text: item.content.message.replace(/\\n/g, '\n'),
        time: item.ctime * 1000,
        timeStr: dateFormat2(item.ctime * 1000),
        userName: item.member.uname,
        avatar: '//wsrv.nl/?url=' + item.member.avatar + '&il',
        userId: item.member.mid,
        likedCount: item.like,
        reply: item.replies ? item.replies.map(reply => ({
          id: reply.rpid,
          text: reply.content.message.replace(/\\n/g, '\n'),
          time: reply.ctime * 1000,
          timeStr: dateFormat2(reply.ctime * 1000),
          userName: reply.member.uname,
          avatar: '//wsrv.nl/?url=' + reply.member.avatar + '&il',
          userId: reply.member.mid,
          likedCount: reply.like,
        })) : [],
      }
    })
  },
}
