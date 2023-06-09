import { httpFetch } from '../../../request'
import { eapi } from './crypto'

const buildEapiRequest = (data) => {
  return httpFetch('http://interface.music.163.com/eapi/batch', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
      origin: 'https://music.163.com',
    },
    form: data,
  })
}

export const eapiRequest = (url, data) => {
  return httpFetch('http://interface.music.163.com/eapi/batch', {
    method: 'post',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
      origin: 'https://music.163.com',
      // cookie: 'os=pc; deviceId=A9C064BB4584D038B1565B58CB05F95290998EE8B025AA2D07AE; osver=Microsoft-Windows-10-Home-China-build-19043-64bit; appver=2.5.2.197409; channel=netease; MUSIC_A=37a11f2eb9de9930cad479b2ad495b0e4c982367fb6f909d9a3f18f876c6b49faddb3081250c4980dd7e19d4bd9bf384e004602712cf2b2b8efaafaab164268a00b47359f85f22705cc95cb6180f3aee40f5be1ebf3148d888aa2d90636647d0c3061cd18d77b7a0; __csrf=05b50d54082694f945d7de75c210ef94; mode=Z7M-KP5(7)GZ; NMTID=00OZLp2VVgq9QdwokUgq3XNfOddQyIAAAF_6i8eJg; ntes_kaola_ad=1',
    },
    form: eapi(url, data),
  })
  // requestObj.promise = requestObj.promise.then(({ body }) => {
  //   // console.log(raw)
  //   console.log(body)
  //   // console.log(eapiDecrypt(raw))
  //   // return eapiDecrypt(raw)
  //   return body
  // })
  // return requestObj
}

/**
 * 创建一个适用于WY的Eapi请求
 * @param {*} url
 * @param {*} options
 * @param {*} retryNum
 */
export const createEapiFetch = async(url, data, retryNum = 0) => {
  if (retryNum > 2) throw new Error('try max num')
  const fromData = eapi(url, data)
  let result
  try {
    result = await buildEapiRequest(data).promise
  } catch (err) {
    console.log(err)
    return createEapiFetch(url, data, ++retryNum)
  }
  // console.log(result.statusCode, result.body)
  if (result.statusCode !== 200 ||
    (
      result.body.error_code ??
      result.body.errcode ??
      result.body.err_code) != 0
  ) return createEapiFetch(url, options, ++retryNum)
  if (result.body.data) return result.body.data
  if (Array.isArray(result.body.info)) return result.body
  return result.body.info
}
