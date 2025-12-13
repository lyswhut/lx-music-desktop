import { httpFetch } from '../../request'
import { sizeFormate } from '../../index'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  successCode: 0,

  async musicSearch(str, page, limit, retryNum = 0) {
    if (retryNum > 2) throw new Error('搜索失败')

    const searchRequest = httpFetch(`https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(str)}&page=${page}&page_size=${limit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://www.bilibili.com/',
        Cookie: 'SESSDATA=xxx',
      },
    })

    return searchRequest.promise.then(({ body }) => {
      console.log(body)
      if (body.code !== this.successCode) return this.musicSearch(str, page, limit, ++retryNum)
      return body
    })
  },

  handleResult(rawList) {
    const list = []
    if (!rawList) return list
    rawList.forEach(video => {
      if (!video.bvid) return
      const parts = video.duration.split(':')
      const minutes = String(parts[0]).padStart(2, '0')
      const seconds = String(parts[1]).padStart(2, '0')
      const paddedDuration = `${minutes}:${seconds}`
      list.push({
        singer: video.author,
        name: video.title.replace(/<[^>]+>/g, ''),
        albumName: video.typename,
        albumId: video.tid,
        source: 'bili',
        interval: paddedDuration,
        songId: video.bvid,
        songmid: video.bvid,
        img: '//wsrv.nl/?url=' + video.pic + '&il',
        types: [{ type: 'video', size: sizeFormate(video.play), url: `https://www.bilibili.com/video/${video.bvid}` }],
        _types: { video: { size: sizeFormate(video.play) } },
        typeUrl: {},
      })
    })
    return list
  },

  async search(str, page = 1, limit) {
    if (limit == null) limit = this.limit

    const body = await this.musicSearch(str, page, limit)
    if (!body.data.result || body.data.result.length === 0) {
      return Promise.reject(new Error('EMPTY_RESULT'))
    }
    const list = this.handleResult(body.data.result)

    this.total = body.data.numResults
    this.page = page
    this.allPage = Math.ceil(this.total / limit)

    return {
      list,
      allPage: this.allPage,
      limit,
      total: this.total,
      source: 'bili',
    }
  },
}
