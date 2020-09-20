import { httpFetch } from '../../request'
import { linuxapi } from './utils/crypto'

export default songmid => {
  const requestObj = httpFetch('https://music.163.com/api/linux/forward', {
    method: 'post',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    form: linuxapi({
      method: 'POST',
      url: 'https://music.163.com/api/song/lyric',
      params: {
        id: songmid,
        lv: -1,
        kv: -1,
        tv: -1,
      },
    }),
  })
  requestObj.promise = requestObj.promise.then(({ body }) => {
    if (body.code !== 200) return Promise.reject('获取歌词失败')
    return {
      lyric: body.lrc.lyric,
      tlyric: body.tlyric.lyric,
    }
  })
  return requestObj
}

