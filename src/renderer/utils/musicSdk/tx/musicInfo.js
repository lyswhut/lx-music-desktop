import { filterMusicInfoItem } from './util'
import { httpFetch } from '../../request'

export const getMusicInfo = id => {
  return httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
    method: 'POST',
    body: {
      comm: {
        ct: '19',
        cv: '1859',
        uin: '0',
      },
      req: {
        module: 'music.pf_song_detail_svr',
        method: 'get_song_detail_yqq',
        param: {
          song_type: 0,
          song_mid: id,
        },
      },
    },
    headers: {
      'User-Angent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
    },
  }).then(({ body }) => {
    if (body.req.code != 0) throw new Error('get music info faild.')

    const item = body.req.data.track_info
    if (!item.file?.media_mid) return null

    return filterMusicInfoItem(item)
  })
}
