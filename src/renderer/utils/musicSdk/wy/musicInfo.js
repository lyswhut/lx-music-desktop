// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/song_detail.js
import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'

export default songmid => {
  const requestObj = httpFetch('https://music.163.com/weapi/v3/song/detail', {
    method: 'post',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
      Referer: 'https://music.163.com/song?id=' + songmid,
      origin: 'https://music.163.com',
    },
    form: weapi({
      c: `[{"id":${songmid}}]`,
      ids: `[${songmid}]`,
    }),
  })
  requestObj.promise = requestObj.promise.then(({ body }) => {
    // console.log(body)
    if (body.code !== 200 || !body.songs.length) return Promise.reject(new Error('获取歌曲信息失败'))
    return body.songs[0]
  })
  return requestObj
}

