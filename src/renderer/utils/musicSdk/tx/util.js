import { httpFetch } from '../../request'

/**
 * 创建一个适用于TX的Http请求
 * @param {*} url
 * @param {*} options
 * @param {*} retryNum
 */
export const createMusicuFetch = async(data, options, retryNum = 0) => {
  if (retryNum > 2) throw new Error('try max num')

  let request
  try {
    request = await httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'POST',
      body: {
        comm: {
          cv: 4747474,
          ct: 24,
          format: 'json',
          inCharset: 'utf-8',
          outCharset: 'utf-8',
          uin: 0,
        },
        ...data,
      },
      headers: {
        'User-Angent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
      },
    }).promise
  } catch (err) {
    console.log(err)
    return createMusicuFetch(data, options, ++retryNum)
  }
  if (request.statusCode !== 200 || request.body.code != 0) return createMusicuFetch(data, options, ++retryNum)

  const result = {}
  Object.keys(data).forEach(item => {
    if (request.body[item].code != 0) return
    result[item] = request.body[item].data
  })
  return result
}
