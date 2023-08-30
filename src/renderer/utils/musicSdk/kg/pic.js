import { httpFetch } from '../../request'

export default {
  getPic(songInfo) {
    const requestObj = httpFetch(
      'http://media.store.kugou.com/v1/get_res_privilege',
      {
        method: 'POST',
        headers: {
          'KG-RC': 1,
          'KG-THash': 'expand_search_manager.cpp:852736169:451',
          'User-Agent': 'KuGou2012-9020-ExpandSearchManager',
        },
        body: {
          appid: 1001,
          area_code: '1',
          behavior: 'play',
          clientver: '9020',
          need_hash_offset: 1,
          relate: 1,
          resource: [
            {
              album_audio_id:
                songInfo.songmid.length == 32 // 修复歌曲ID存储变更导致图片获取失败的问题
                  ? songInfo.audioId.split('_')[0]
                  : songInfo.songmid,
              album_id: songInfo.albumId,
              hash: songInfo.hash,
              id: 0,
              name: `${songInfo.singer} - ${songInfo.name}.mp3`,
              type: 'audio',
            },
          ],
          token: '',
          userid: 2626431536,
          vip: 1,
        },
      },
    )
    return requestObj.promise.then(({ body }) => {
      if (body.error_code !== 0) return Promise.reject(new Error('图片获取失败'))
      let info = body.data[0].info
      const img = info.imgsize ? info.image.replace('{size}', info.imgsize[0]) : info.image
      if (!img) return Promise.reject(new Error('Pic get failed'))
      return img
    })
  },
}
