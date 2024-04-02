import { createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'node:crypto'
// import { join } from 'node:path'
import zlib from 'node:zlib'
import type http from 'node:http'
// import getStore from '@/utils/store'
// import syncLog from '../../log'
// import { getUserName } from '../user/data'
// import { saveClientKeyInfo } from './data'

export const generateCode = (): string => {
  return Math.random().toString().substring(2, 8)
}

export const getIP = (request: http.IncomingMessage) => {
  return request.socket.remoteAddress
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


const gzip = async(data: string) => new Promise<string>((resolve, reject) => {
  zlib.gzip(data, (err, buf) => {
    if (err) {
      reject(err)
      return
    }
    resolve(buf.toString('base64'))
  })
})
const unGzip = async(data: string) => new Promise<string>((resolve, reject) => {
  zlib.gunzip(Buffer.from(data, 'base64'), (err, buf) => {
    if (err) {
      reject(err)
      return
    }
    resolve(buf.toString())
  })
})

export const encryptMsg = async(keyInfo: LX.Sync.ServerKeyInfo | null, msg: string): Promise<string> => {
  return msg.length > 1024
    ? 'cg_' + await gzip(msg)
    : msg
  // if (!keyInfo) return ''
  // return aesEncrypt(msg, keyInfo.key, keyInfo.iv)
}

export const decryptMsg = async(keyInfo: LX.Sync.ServerKeyInfo | null, enMsg: string): Promise<string> => {
  return enMsg.substring(0, 3) == 'cg_'
    ? await unGzip(enMsg.replace('cg_', ''))
    : enMsg
  // console.log('decmsg raw: ', len.length, 'en: ', enMsg.length)

  // if (!keyInfo) return ''
  // let msg = ''
  // try {
  //   msg = aesDecrypt(enMsg, keyInfo.key, keyInfo.iv)
  // } catch (err) {
  //   console.log(err)
  // }
  // return msg
}

// export const getSnapshotFilePath = (keyInfo: LX.Sync.KeyInfo): string => {
//   return join(global.lx.snapshotPath, `snapshot_${keyInfo.snapshotKey}.json`)
// }

// export const sendStatus = (status: LX.Sync.ServerStatus) => {
//   syncLog.info('status', status.devices.map(d => `${getUserName(d.clientId) ?? ''} ${d.deviceName}`))
// }

