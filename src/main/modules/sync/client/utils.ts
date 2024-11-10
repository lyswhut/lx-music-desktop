import { generateKeyPair } from 'node:crypto'
import { httpFetch, type RequestOptions } from '@main/utils/request'
import { decodeData, encodeData } from '../utils'

export const request = async(url: string, options: RequestOptions = { }) => {
  return httpFetch(url, {
    ...options,
    timeout: options.timeout ?? 10000,
    follow_max: 5,
  }).then(response => {
    return {
      text: response.body,
      code: response.statusCode,
    }
  })
  // const controller = new AbortController()
  // let id: number | null = setTimeout(() => {
  //   id = null
  //   controller.abort()
  // }, timeout)
  // return fetch(url, {
  //   ...options,
  //   signal: controller.signal,
  // // eslint-disable-next-line @typescript-eslint/promise-function-async
  // }).then(async(response) => {
  //   const text = await response.text()
  //   return {
  //     text,
  //     code: response.status,
  //   }
  // }).catch(err => {
  //   // console.log(err, err.code, err.message)
  //   throw err
  // }).finally(() => {
  //   if (id == null) return
  //   clearTimeout(id)
  // })
}

// export const aesEncrypt = (text: string, key: string, iv: string) => {
//   const cipher = createCipheriv('aes-128-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))
//   return Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]).toString('base64')
// }

// export const aesDecrypt = (text: string, key: string, iv: string) => {
//   const decipher = createDecipheriv('aes-128-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))
//   return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
// }

export const generateRsaKey = async() => new Promise<{ publicKey: string, privateKey: string }>((resolve, reject) => {
  generateKeyPair(
    'rsa',
    {
      modulusLength: 2048, // It holds a number. It is the key size in bits and is applicable for RSA, and DSA algorithm only.
      publicKeyEncoding: {
        type: 'spki', // Note the type is pkcs1 not spki
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8', // Note again the type is set to pkcs1
        format: 'pem',
        // cipher: "aes-256-cbc", //Optional
        // passphrase: "", //Optional
      },
    },
    (err, publicKey, privateKey) => {
      if (err) {
        reject(err)
        return
      }
      resolve({
        publicKey,
        privateKey,
      })
    },
  )
})

export const encryptMsg = async(keyInfo: LX.Sync.ClientKeyInfo, msg: string): Promise<string> => {
  return encodeData(msg)
  // if (!keyInfo) return ''
  // return aesEncrypt(msg, keyInfo.key, keyInfo.iv)
}

export const decryptMsg = async(keyInfo: LX.Sync.ClientKeyInfo, enMsg: string): Promise<string> => {
  return decodeData(enMsg)
  // if (!keyInfo) return ''
  // let msg = ''
  // try {
  //   msg = aesDecrypt(enMsg, keyInfo.key, keyInfo.iv)
  // } catch (err) {
  //   console.log(err)
  // }
  // return msg
}


export const parseUrl = (host: string): LX.Sync.Client.UrlInfo => {
  const url = new URL(host)
  let hostPath = url.host + url.pathname
  let href = url.href
  if (hostPath.endsWith('/')) hostPath = hostPath.replace(/\/$/, '')
  if (href.endsWith('/')) href = href.replace(/\/$/, '')

  return {
    wsProtocol: url.protocol == 'https:' ? 'wss:' : 'ws:',
    httpProtocol: url.protocol,
    hostPath,
    href,
  }
}


export const sendStatus = (status: LX.Sync.ClientStatus) => {
  // syncLog.log(JSON.stringify(status))
}
