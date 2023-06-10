import { createMusicuFetch, filterMusicInfoItem } from './util'

export const getMusicInfo = (id) => {
  return createMusicuFetch({
    req: {
      module: 'music.pf_song_detail_svr',
      method: 'get_song_detail_yqq',
      param: {
        song_type: 0,
        song_mid: id,
      },
    },
  }).then(body => {
    if (!body.req) throw new Error('get music info faild.')

    const item = body.req.track_info
    if (!item.file?.media_mid) return null

    return filterMusicInfoItem(item)
  })
}
