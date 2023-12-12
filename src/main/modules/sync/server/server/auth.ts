import type http from 'http'
import {
  aesEncrypt,
  aesDecrypt,
  rsaEncrypt,
  getIP,
} from '../utils/tools'
import querystring from 'node:querystring'
import { getUserSpace, createClientKeyInfo } from '../user'
import { toMD5 } from '../utils'
import { getComputerName } from '../../utils'
import { SYNC_CODE } from '@common/constants_sync'

const requestIps = new Map<string, number>()

const getAvailableIP = (req: http.IncomingMessage) => {
  let ip = getIP(req)
  return ip && (requestIps.get(ip) ?? 0) < 10 ? ip : null
}

const verifyByKey = (encryptMsg: string, userId: string) => {
  const userSpace = getUserSpace()
  const keyInfo = userSpace.dataManage.getClientKeyInfo(userId)
  if (!keyInfo) return null
  let text
  try {
    text = aesDecrypt(encryptMsg, keyInfo.key)
  } catch (err) {
    return null
  }
  // console.log(text)
  if (text.startsWith(SYNC_CODE.authMsg)) {
    const deviceName = text.replace(SYNC_CODE.authMsg, '') || 'Unknown'
    if (deviceName != keyInfo.deviceName) {
      keyInfo.deviceName = deviceName
      userSpace.dataManage.saveClientKeyInfo(keyInfo)
    }
    return aesEncrypt(SYNC_CODE.helloMsg, keyInfo.key)
  }
  return null
}

const verifyByCode = (encryptMsg: string, password: string) => {
  let key = toMD5(password).substring(0, 16)
  // const iv = Buffer.from(key.split('').reverse().join('')).toString('base64')
  key = Buffer.from(key).toString('base64')
  // console.log(req.headers.m, authCode, key)
  let text
  try {
    text = aesDecrypt(encryptMsg, key)
  } catch {
    return null
  }
  // console.log(text)
  if (text.startsWith(SYNC_CODE.authMsg)) {
    const data = text.split('\n')
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${data[1]}\n-----END PUBLIC KEY-----`
    const deviceName = data[2] || 'Unknown'
    const isMobile = data[3] == 'lx_music_mobile'
    const keyInfo = createClientKeyInfo(deviceName, isMobile)
    const userSpace = getUserSpace()
    userSpace.dataManage.saveClientKeyInfo(keyInfo)
    return rsaEncrypt(Buffer.from(JSON.stringify({
      clientId: keyInfo.clientId,
      key: keyInfo.key,
      serverName: getComputerName(),
    })), publicKey)
  }
  return null
}

export const authCode = async(req: http.IncomingMessage, res: http.ServerResponse, password: string) => {
  let code = 401
  let msg: string = SYNC_CODE.msgAuthFailed

  let ip = getAvailableIP(req)
  if (ip) {
    if (typeof req.headers.m == 'string' && req.headers.m) {
      const userId = req.headers.i
      const _msg = typeof userId == 'string' && userId
        ? verifyByKey(req.headers.m, userId)
        : verifyByCode(req.headers.m, password)
      if (_msg != null) {
        msg = _msg
        code = 200
      }
    }

    if (code != 200) {
      const num = requestIps.get(ip) ?? 0
      // if (num > 20) return
      requestIps.set(ip, num + 1)
    }
  } else {
    code = 403
    msg = SYNC_CODE.msgBlockedIp
  }
  // console.log(req.headers)

  res.writeHead(code)
  res.end(msg)
}

const verifyConnection = (encryptMsg: string, userId: string) => {
  const userSpace = getUserSpace()
  const keyInfo = userSpace.dataManage.getClientKeyInfo(userId)
  if (!keyInfo) return false
  let text
  try {
    text = aesDecrypt(encryptMsg, keyInfo.key)
  } catch (err) {
    return false
  }
  // console.log(text)
  return text == SYNC_CODE.msgConnect
}
export const authConnect = async(req: http.IncomingMessage) => {
  let ip = getAvailableIP(req)
  if (ip) {
    const query = querystring.parse((req.url!).split('?')[1])
    const i = query.i
    const t = query.t
    if (typeof i == 'string' && typeof t == 'string' && verifyConnection(t, i)) return

    const num = requestIps.get(ip) ?? 0
    requestIps.set(ip, num + 1)
  }
  throw new Error('failed')
}

