import { httpFetch } from '../../request'
import { decodeName } from '../../index'
import songList from './songList'

export default {
  successCode: 0,
  getAlbumDetail(id, page = 1, tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))

    const requestObj = httpFetch(`https://c.y.qq.com/v8/fcg-bin/fcg_v8_album_detail_cp.fcg?albummid=${id}&format=json&newsong=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
        Referer: 'https://y.qq.com/',
      },
    })
    return requestObj.promise.then(({ body }) => {
      if (!body || body.code !== this.successCode || !body.data) return this.getAlbumDetail(id, page, ++tryNum)
      const data = body.data
      const albumInfo = data.getAlbumInfo ?? data.albumInfo ?? {}
      const list = songList.filterListDetail(data.getSongInfo ?? data.songlist ?? [])
      return {
        list,
        page,
        limit: list.length + 1,
        total: list.length,
        source: 'tx',
        info: {
          name: albumInfo.Falbum_name,
          img: `https://y.gtimg.cn/music/photo_new/T002R500x500M000${id}.jpg`,
          desc: (data.getAlbumDesc ?? {}).Falbum_desc,
          author: decodeName(data.singerInfo?.[0]?.Fsinger_name),
          company: data.company?.name,
          time: albumInfo.Fpublic_time,
        },
      }
    })
  },
}
