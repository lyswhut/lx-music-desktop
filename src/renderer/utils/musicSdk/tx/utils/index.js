
import { httpFetch } from '../../../request'
import { zzcSign } from './crypto'

export const signRequest = async(data) => {
  // console.log(data)
  const sign = await zzcSign(JSON.stringify(data))
  // console.log('sign', sign)
  return httpFetch(`https://u.y.qq.com/cgi-bin/musics.fcg?sign=${sign}`, {
    method: 'post',
    headers: {
      'User-Agent': 'QQMusic 14090508(android 12)',
    },
    body: data,
  }).promise
}
