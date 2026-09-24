import { httpFetch } from '../../../request'
import { zzcSign } from '@renderer/utils/musicSdk/tx/utils/sign'

export const signRequest = (data: any) => {
  console.log(data)
  const sign = zzcSign(JSON.stringify(data))
  console.log('sign', sign)
  return httpFetch(`https://u.y.qq.com/cgi-bin/musics.fcg?sign=${sign}`, {
    method: 'post',
    headers: {
      'User-Agent': 'QQMusic 14090508(android 12)',
    },
    body: data,
  })
}
