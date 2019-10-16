import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'

export default songmid => {
  const requestObj = httpFetch('http://music.163.com/weapi/song/lyric?csrf_token=', {
    method: 'post',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
      Referer: 'https://music.163.com/song?id=' + songmid,
      origin: 'https://music.163.com',
    },
    form: weapi({ id: songmid, lv: -1, tv: -1, csrf_token: '' }),
  })
  requestObj.promise = requestObj.promise.then(({ body }) => {
    // console.log(body)
    if (body.code !== 200) return Promise.reject('获取歌词失败')
    return body.lrc.lyric
  })
  return requestObj
}

