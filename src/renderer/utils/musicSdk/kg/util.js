import { inflate } from 'zlib'
import { toMD5 } from '../utils'

// https://github.com/lyswhut/lx-music-desktop/issues/296#issuecomment-683285784
const enc_key = Buffer.from([0x40, 0x47, 0x61, 0x77, 0x5e, 0x32, 0x74, 0x47, 0x51, 0x36, 0x31, 0x2d, 0xce, 0xd2, 0x6e, 0x69], 'binary')
export const decodeLyric = str => new Promise((resolve, reject) => {
  if (!str.length) return
  const buf_str = Buffer.from(str, 'base64').slice(4)
  for (let i = 0, len = buf_str.length; i < len; i++) {
    buf_str[i] = buf_str[i] ^ enc_key[i % 16]
  }
  inflate(buf_str, (err, result) => {
    if (err) return reject(err)
    resolve(result.toString())
  })
})

// s.content[0].lyricContent.forEach(([str]) => {
//   console.log(str)
// })

export const signatureParams = (params, apiver = 9) => {
  let keyparam = 'OIlwieks28dk2k092lksi2UIkp'
  if (apiver === 5) keyparam = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt'
  let param_list = params.split('&')
  param_list.sort()
  let sign_params = `${keyparam}${param_list.join('')}${keyparam}`
  return toMD5(sign_params)
}
