import { request, generateRsaKey } from './utils'
import { getSyncAuthKey, setSyncAuthKey } from './data'
import log from '../log'
import { aesDecrypt, aesEncrypt, getComputerName, rsaDecrypt } from '../utils'
import { toMD5 } from '@common/utils/nodejs'
import { SYNC_CODE } from '@common/constants_sync'


const hello = async(urlInfo: LX.Sync.Client.UrlInfo) => request(`${urlInfo.httpProtocol}//${urlInfo.hostPath}/hello`)
  .then(({ text }) => text == SYNC_CODE.helloMsg)
  .catch((err: any) => {
    log.error('[auth] hello', err.message)
    console.log(err)
    return false
  })

const getServerId = async(urlInfo: LX.Sync.Client.UrlInfo) => request(`${urlInfo.httpProtocol}//${urlInfo.hostPath}/id`)
  .then(({ text }) => {
    if (!text.startsWith(SYNC_CODE.idPrefix)) return ''
    return text.replace(SYNC_CODE.idPrefix, '')
  })
  .catch((err: any) => {
    log.error('[auth] getServerId', err.message)
    console.log(err)
    throw err
  })

const codeAuth = async(urlInfo: LX.Sync.Client.UrlInfo, serverId: string, authCode: string) => {
  let key = toMD5(authCode).substring(0, 16)
  // const iv = Buffer.from(key.split('').reverse().join('')).toString('base64')
  key = Buffer.from(key).toString('base64')
  let { publicKey, privateKey } = await generateRsaKey()
  publicKey = publicKey.replace(/\n/g, '')
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
  const msg = aesEncrypt(`${SYNC_CODE.authMsg}\n${publicKey}\n${getComputerName()}\nlx_music_desktop`, key)
  // console.log(msg, key)
  return request(`${urlInfo.httpProtocol}//${urlInfo.hostPath}/ah`, { headers: { m: msg } }).then(async({ text, code }) => {
    // console.log(text)
    switch (text) {
      case SYNC_CODE.msgBlockedIp:
        throw new Error(SYNC_CODE.msgBlockedIp)
      case SYNC_CODE.authFailed:
        throw new Error(SYNC_CODE.authFailed)
      default:
        if (code != 200) throw new Error(SYNC_CODE.authFailed)
    }
    let msg
    try {
      msg = rsaDecrypt(Buffer.from(text, 'base64'), privateKey).toString()
    } catch (err: any) {
      log.error('[auth] codeAuth decryptMsg error', err.message)
      throw new Error(SYNC_CODE.authFailed)
    }
    // console.log(msg)
    if (!msg) return Promise.reject(new Error(SYNC_CODE.authFailed))
    const info = JSON.parse(msg) as LX.Sync.ClientKeyInfo
    void setSyncAuthKey(serverId, info)
    return info
  })
}

const keyAuth = async(urlInfo: LX.Sync.Client.UrlInfo, keyInfo: LX.Sync.ClientKeyInfo) => {
  const msg = aesEncrypt(SYNC_CODE.authMsg + getComputerName(), keyInfo.key)
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return request(`${urlInfo.httpProtocol}//${urlInfo.hostPath}/ah`, { headers: { i: keyInfo.clientId, m: msg } }).then(({ text, code }) => {
    if (code != 200) throw new Error(SYNC_CODE.authFailed)

    let msg
    try {
      msg = aesDecrypt(text, keyInfo.key)
    } catch (err: any) {
      log.error('[auth] keyAuth decryptMsg error', err.message)
      throw new Error(SYNC_CODE.authFailed)
    }
    if (msg != SYNC_CODE.helloMsg) return Promise.reject(new Error(SYNC_CODE.authFailed))
  })
}

const auth = async(urlInfo: LX.Sync.Client.UrlInfo, serverId: string, authCode?: string) => {
  if (authCode) return codeAuth(urlInfo, serverId, authCode)
  const keyInfo = await getSyncAuthKey(serverId)
  if (!keyInfo) throw new Error(SYNC_CODE.missingAuthCode)
  await keyAuth(urlInfo, keyInfo)
  return keyInfo
}

export default async(urlInfo: LX.Sync.Client.UrlInfo, authCode?: string) => {
  console.log('connect: ', urlInfo.href, authCode)
  if (!await hello(urlInfo)) throw new Error(SYNC_CODE.connectServiceFailed)
  const serverId = await getServerId(urlInfo)
  if (!serverId) throw new Error(SYNC_CODE.getServiceIdFailed)
  return auth(urlInfo, serverId, authCode)
}
