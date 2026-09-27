import { httpFetch } from '../../request'
import { formatPlayTime, decodeName } from '../../index'

// QQ 音乐专辑接口
// 搜索：桌面版搜索端点 DoSearchForQQMusicDesktop（search_type=2，分页）
//   注：移动版 client_search_cp（t=2）已下线，只会返回直达区内容，无法分页
// 详情：musicu 统一网关
//   AlbumInfoServer.GetAlbumDetail  → 专辑信息
//   AlbumSongList.GetAlbumSongList  → 专辑曲目（songList[].songInfo）

const postMusicu = (body) => {
  return httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'QQMusic 20.03.0 (pc)',
    },
    body,
  })
}

const handleAlbumList = (body, page, limit) => {
  const list = (body.req?.data?.body?.album?.list ?? []).map(item => ({
    id: item.albumMid,
    name: decodeName(item.albumName),
    img: item.albumPic,
    desc: decodeName(item.albumDesc || ''),
    author: (item.singers ?? []).map(s => decodeName(s.title || s.name)).join('、'),
    play_count: null,
    time: item.publicTime,
    song_count: parseInt(item.songCnt, 10) || null,
    source: 'tx',
  }))
  const total = body.req?.data?.meta?.sum ?? page * limit
  return { list, total, page, limit, source: 'tx' }
}

export default {
  search(keywords, page = 1, limit = 20) {
    const requestObj = postMusicu({
      comm: { cv: 0, uin: '0' },
      req: {
        c: {},
        method: 'DoSearchForQQMusicDesktop',
        module: 'music.search.SearchCgiService',
        param: { page_num: String(page), num_per_page: String(limit), query: keywords, search_type: 2 },
      },
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      if (body.code !== 0 || body.req?.code !== 0) throw new Error('专辑搜索请求失败')
      return handleAlbumList(body, page, limit)
    })
    return requestObj
  },

  getAlbumInfo(albumMid) {
    const requestObj = postMusicu({
      comm: { cv: 0, uin: '0' },
      req: {
        c: {},
        method: 'GetAlbumDetail',
        module: 'music.web.AlbumInfoServer',
        param: { albumMid },
      },
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      if (body.code !== 0 || body.req?.code !== 0) throw new Error('获取专辑信息失败')
      const info = body.req?.data?.basicInfo ?? {}
      return {
        name: decodeName(info.albumName ?? ''),
        img: info.picUrl ?? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg`,
        desc: decodeName(info.desc ?? ''),
        author: (info.singerList ?? []).map(s => decodeName(s.name ?? s.title ?? '')).join('、'),
        play_count: null,
        time: info.publishDate ?? '',
        source: 'tx',
      }
    })
    return requestObj
  },

  getAlbumDetail(albumMid, page = 1, limit = 50) {
    const requestObj = postMusicu({
      comm: { cv: 0, uin: '0' },
      req: {
        c: {},
        method: 'GetAlbumSongList',
        module: 'music.musichallAlbum.AlbumSongList',
        param: {
          albumMid,
          albumID: 0,
          begin: (page - 1) * limit,
          num: limit,
          order: 2,
        },
      },
    })
    requestObj.promise = requestObj.promise.then(async({ body }) => {
      if (body.code !== 0 || body.req?.code !== 0) throw new Error('获取专辑歌曲失败')
      const data = body.req?.data ?? {}
      const total = data.totalNum ?? page * limit
      let info = {}
      let albumName = ''
      if (page === 1) {
        info = await this.getAlbumInfo(albumMid).promise
        albumName = info.name
      }
      const list = (data.songList ?? []).map(({ songInfo: item }) => {
        if (!item) return null
        return {
          singer: (item.singer ?? []).map(s => decodeName(s.name)).join('、'),
          name: decodeName(item.title || item.name || ''),
          albumName: decodeName(item.album?.name || albumName),
          albumId: albumMid,
          songmid: item.mid,
          source: 'tx',
          interval: formatPlayTime(item.interval ?? 0),
          img: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg`,
          lrc: null,
          types: [],
          _types: {},
          typeUrl: {},
        }
      }).filter(Boolean)
      return { list, page, limit, total, source: 'tx', info }
    })
    return requestObj
  },
}
