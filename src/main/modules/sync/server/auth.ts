import http from 'http'
import { SYNC_CODE } from './config'
import {
  aesEncrypt,
  aesDecrypt,
  createClientKeyInfo,
  getClientKeyInfo,
  setClientKeyInfo,
  rsaEncrypt,
} from './utils'
import querystring from 'node:querystring'

const requestIps = new Map<string, number>()

export const authCode = async(req: http.IncomingMessage, res: http.ServerResponse, authCode: string) => {
  let code = 401
  let msg: string = SYNC_CODE.msgAuthFailed

  let ip = req.socket.remoteAddress
  // console.log(req.headers)
  if (typeof req.headers.m == 'string' && ip && (requestIps.get(ip) ?? 0) < 10) {
    if (req.headers.m) {
      label:
      if (req.headers.i) { // key验证
        if (typeof req.headers.i != 'string') break label
        const keyInfo = getClientKeyInfo(req.headers.i)
        if (!keyInfo) break label
        let text
        try {
          text = aesDecrypt(req.headers.m, keyInfo.key)
        } catch (err) {
          break label
        }
        // console.log(text)
        if (text.startsWith(SYNC_CODE.authMsg)) {
          code = 200
          const deviceName = text.replace(SYNC_CODE.authMsg, '') || 'Unknown'
          if (deviceName != keyInfo.deviceName) {
            keyInfo.deviceName = deviceName
            setClientKeyInfo(keyInfo)
          }
          msg = aesEncrypt(SYNC_CODE.helloMsg, keyInfo.key)
        }
      } else { // 连接码验证
        let key = ''.padStart(16, Buffer.from(authCode).toString('hex'))
        // const iv = Buffer.from(key.split('').reverse().join('')).toString('base64')
        key = Buffer.from(key).toString('base64')
        // console.log(req.headers.m, authCode, key)
        let text
        try {
          text = aesDecrypt(req.headers.m, key)
        } catch (err) {
          break label
        }
        // console.log(text)
        if (text.startsWith(SYNC_CODE.authMsg)) {
          code = 200
          const data = text.split('\n')
          const publicKey = `-----BEGIN PUBLIC KEY-----\n${data[1]}\n-----END PUBLIC KEY-----`
          const deviceName = data[2] || 'Unknown'
          msg = rsaEncrypt(Buffer.from(JSON.stringify(createClientKeyInfo(deviceName))), publicKey)
        }
      }
    }
  }
  res.writeHead(code)
  res.end(msg)

  if (ip && code != 200) {
    const num = requestIps.get(ip) ?? 0
    if (num > 20) return
    requestIps.set(ip, num + 1)
  }
}

export const authConnect = async(req: http.IncomingMessage) => {
  const query = querystring.parse((req.url as string).split('?')[1])
  const i = query.i
  const t = query.t
  label:
  if (typeof i == 'string' && typeof t == 'string') {
    const keyInfo = getClientKeyInfo(i)
    if (!keyInfo) break label
    let text
    try {
      text = aesDecrypt(t, keyInfo.key)
    } catch (err) {
      break label
    }
    // console.log(text)
    if (text == SYNC_CODE.msgConnect) return
  }
  throw new Error('failed')
}

