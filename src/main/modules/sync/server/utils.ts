import { networkInterfaces } from 'os'
import { randomBytes, createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'crypto'
import { join } from 'path'
import getStore from '@main/utils/store'

const STORE_NAME = 'sync'

type KeyInfos = Record<string, LX.Sync.KeyInfo>

export const getAddress = (): string[] => {
  const nets = networkInterfaces()
  const results: string[] = []
  // console.log(nets)

  for (const interfaceInfos of Object.values(nets)) {
    if (!interfaceInfos) continue
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    for (const interfaceInfo of interfaceInfos) {
      if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
        results.push(interfaceInfo.address)
      }
    }
  }
  return results
}

let serverId: string | undefined
export const getServerId = (): string => {
  if (serverId) return serverId
  const store = getStore(STORE_NAME)
  serverId = store.get('serverId') as string | undefined
  if (!serverId) {
    serverId = randomBytes(4 * 4).toString('base64')
    store.set('serverId', serverId)
  }
  return serverId
}

let keyInfos: KeyInfos
export const createClientKeyInfo = (deviceName: string): LX.Sync.KeyInfo => {
  const keyInfo: LX.Sync.KeyInfo = {
    clientId: randomBytes(4 * 4).toString('base64'),
    key: randomBytes(16).toString('base64'),
    deviceName,
  }
  const store = getStore(STORE_NAME)
  if (!keyInfos) keyInfos = store.get('keys') as KeyInfos || {}
  if (Object.keys(keyInfos).length > 101) throw new Error('max keys')

  keyInfos[keyInfo.clientId] = keyInfo
  store.set('keys', keyInfos)
  return keyInfo
}
export const setClientKeyInfo = (keyInfo: LX.Sync.KeyInfo) => {
  keyInfos[keyInfo.clientId] = keyInfo
  const store = getStore(STORE_NAME)
  store.set('keys', keyInfos)
}
export const getClientKeyInfo = (clientId: string): LX.Sync.KeyInfo | null => {
  if (!keyInfos) {
    const store = getStore(STORE_NAME)
    keyInfos = store.get('keys') as KeyInfos || {}
  }
  return keyInfos[clientId] ?? null
}

export const generateCode = (): string => {
  return Math.random().toString().substring(2, 8)
}

export const aesEncrypt = (buffer: string | Buffer, key: string): string => {
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([cipher.update(buffer), cipher.final()]).toString('base64')
}

export const aesDecrypt = (text: string, key: string): string => {
  const decipher = createDecipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
}

export const rsaEncrypt = (buffer: Buffer, key: string): string => {
  return publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer).toString('base64')
}
export const rsaDecrypt = (buffer: Buffer, key: string): Buffer => {
  return privateDecrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer)
}

export const encryptMsg = (keyInfo: LX.Sync.KeyInfo, msg: string): string => {
  return msg
  // if (!keyInfo) return ''
  // return aesEncrypt(msg, keyInfo.key, keyInfo.iv)
}

export const decryptMsg = (keyInfo: LX.Sync.KeyInfo, enMsg: string): string => {
  return enMsg
  // if (!keyInfo) return ''
  // let msg = ''
  // try {
  //   msg = aesDecrypt(enMsg, keyInfo.key, keyInfo.iv)
  // } catch (err) {
  //   console.log(err)
  // }
  // return msg
}

export const getSnapshotFilePath = (keyInfo: LX.Sync.KeyInfo): string => {
  return join(global.lxDataPath, `snapshot-${Buffer.from(keyInfo.clientId).toString('hex').substring(0, 10)}.json`)
}
