import http from 'http'
import {
  aesEncrypt,
  aesDecrypt,
  createClientKeyInfo,
  getClientKeyInfo,
  setClientKeyInfo,
} from './utils'

const authMsg = 'lx-music auth::'
const helloMsg = 'Hello~::^-^::~v2'

const requestIps = new Map<string, number>()

export const authCode = async(req: http.IncomingMessage, res: http.ServerResponse, authCode: string) => {
  let code = 401
  let msg = 'Forbidden'

  let ip = req.socket.remoteAddress
  // console.log(req.headers)
  if (typeof req.headers.m == 'string' && ip && (requestIps.get(ip) ?? 0) > 10) {
    if (req.headers.m) {
      label:
      if (req.headers.i) {
        if (typeof req.headers.i != 'string') break label
        const keyInfo = getClientKeyInfo(req.headers.i)
        if (!keyInfo) break label
        let text
        try {
          text = aesDecrypt(req.headers.m, keyInfo.key, keyInfo.iv)
        } catch (err) {
          break label
        }
        console.log(text)
        if (text.startsWith(authMsg)) {
          code = 200
          const deviceName = text.replace(authMsg, '') || 'Unknown'
          if (deviceName != keyInfo.deviceName) {
            keyInfo.deviceName = deviceName
            setClientKeyInfo(keyInfo)
          }
          msg = aesEncrypt(helloMsg, keyInfo.key, keyInfo.iv)
        }
      } else {
        let key = ''.padStart(16, Buffer.from(authCode).toString('hex'))
        const iv = Buffer.from(key.split('').reverse().join('')).toString('base64')
        key = Buffer.from(key).toString('base64')
        // console.log(authCode, key, iv)
        let text
        try {
          text = aesDecrypt(req.headers.m, key, iv)
        } catch (err) {
          break label
        }
        console.log(text)
        if (text.startsWith(authMsg)) {
          code = 200
          const deviceName = text.replace(authMsg, '') || 'Unknown'
          msg = aesEncrypt(JSON.stringify(createClientKeyInfo(deviceName)), key, iv)
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
  const url = new URL(req.url as string)
  const i = url.searchParams.get('i')
  const t = url.searchParams.get('t')
  label:
  if (i && t) {
    const keyInfo = getClientKeyInfo(i)
    if (!keyInfo) break label
    let text
    try {
      text = aesDecrypt(t, keyInfo.key, keyInfo.iv)
    } catch (err) {
      break label
    }
    if (text == 'lx-music connect') return
  }
  throw new Error('failed')
}

