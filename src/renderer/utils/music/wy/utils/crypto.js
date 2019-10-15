// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/util/crypto.js
import { createCipheriv, publicEncrypt, constants, randomBytes } from 'crypto'
const iv = Buffer.from('0102030405060708')
const presetKey = Buffer.from('0CoJUm6Qyw8W8jud')
const linuxapiKey = Buffer.from('rFgB&h#%2?^eDg:Q')
const base62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const publicKey = '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB\n-----END PUBLIC KEY-----'

const aesEncrypt = (buffer, mode, key, iv) => {
  const cipher = createCipheriv('aes-128-' + mode, key, iv)
  return Buffer.concat([cipher.update(buffer), cipher.final()])
}

const rsaEncrypt = (buffer, key) => {
  buffer = Buffer.concat([Buffer.alloc(128 - buffer.length), buffer])
  return publicEncrypt({ key: key, padding: constants.RSA_NO_PADDING }, buffer)
}

export const weapi = object => {
  const text = JSON.stringify(object)
  const secretKey = randomBytes(16).map(n => (base62.charAt(n % 62).charCodeAt()))
  return {
    params: aesEncrypt(Buffer.from(aesEncrypt(Buffer.from(text), 'cbc', presetKey, iv).toString('base64')), 'cbc', secretKey, iv).toString('base64'),
    encSecKey: rsaEncrypt(secretKey.reverse(), publicKey).toString('hex'),
  }
}

export const linuxapi = object => {
  const text = JSON.stringify(object)
  return {
    eparams: aesEncrypt(Buffer.from(text), 'ecb', linuxapiKey, '').toString('hex').toUpperCase(),
  }
}
