import { httpFetch } from '../../request'

export default {
  limit_song: 20,
  successCode: 0,

  getList(sortId, tagId, page, tryNum = 0) {
    return Promise.resolve({
      list: [],
      total: 0,
      page: 1,
      limit: 20,
      source: 'bili',
    })
  },

  async getListDetail(link, page = 1, limit = 20) {
    const favIdMatch = link.match(/favlist\?fid=(\d+)/)
    if (!favIdMatch) return Promise.reject(new Error('无效的Bilibili收藏夹链接'))

    const media_id = favIdMatch[1]
    const requestObj = httpFetch(
      `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${media_id}&pn=${page}&ps=${limit}&keyword=&order=mtime&type=0&tid=0&platform=web`,
      { headers: { Referer: 'https://www.bilibili.com/', Cookie: 'SESSDATA=xxx' } },
    )

    const { body } = await requestObj.promise
    if (body.code !== 0) throw new Error('获取收藏夹视频失败')

    const info = body.data.info
    const medias = body.data.medias || []

    const list = medias.map(video => {
      const time = video.duration
      const minutes = Math.floor(time / 60)
      const seconds = time % 60
      const paddedDuration = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      return {
        singer: video.upper.name,
        name: video.title,
        albumName: null,
        albumId: null,
        source: 'bili',
        interval: paddedDuration,
        songId: video.bvid,
        songmid: video.bvid,
        img: '//wsrv.nl/?url=' + video.cover + '&il', // proxied due to cors
        types: [],
        _types: {},
        typeUrl: {},
      }
    })

    return {
      list,
      page,
      limit,
      total: body.data.info.media_count,
      source: 'bili',
      info: {
        name: info.title,
        img: '//wsrv.nl/?url=' + info.cover + '&il',
        desc: info.intro,
        author: info.upper.name,
        play_count: info.view_count,
      },
    }
  },

  getTags() {
    return Promise.resolve({
      tags: [],
      hotTag: [],
      source: 'bili',
    })
  },

  search(text, page, limit = 20, retryNum = 0) {
    return Promise.resolve({
      list: [],
      limit,
      total: 0,
      source: 'bili',
    })
  },
}
