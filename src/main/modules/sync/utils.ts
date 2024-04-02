import { createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'node:crypto'
import os from 'node:os'
import fs from 'node:fs'
import zlib from 'node:zlib'
import cp from 'node:child_process'


// https://stackoverflow.com/a/75309339
export const getComputerName = () => {
  let name: string | undefined
  switch (process.platform) {
    case 'win32':
      name = process.env.COMPUTERNAME
      break
    case 'darwin':
      try {
        name = cp.execSync('scutil --get ComputerName').toString().trim()
      } catch {}
      break
    case 'linux':
      // Don't fail even if hostnamectl is unavailable
      try {
        name = cp.execSync('hostnamectl --pretty').toString().trim()
      } catch {}
      break
  }
  if (!name) name = os.hostname()
  return name
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

export const encodeData = async(data: string) => {
  return data.length > 1024
    ? 'cg_' + await gzip(data)
    : data
}

export const decodeData = async(enData: string) => {
  return enData.substring(0, 3) == 'cg_'
    ? await unGzip(enData.replace('cg_', ''))
    : enData
}


export const aesEncrypt = (text: string, key: string) => {
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]).toString('base64')
}

export const aesDecrypt = (text: string, key: string) => {
  const decipher = createDecipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
}

export const rsaEncrypt = (buffer: Buffer, key: string): string => {
  return publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer).toString('base64')
}
export const rsaDecrypt = (buffer: Buffer, key: string): Buffer => {
  return privateDecrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer)
}


export const exists = async(path: string) => fs.promises.stat(path).then(() => true).catch(() => false)
