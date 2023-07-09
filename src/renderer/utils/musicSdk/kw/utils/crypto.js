import { createCipheriv, createDecipheriv, createHash } from 'crypto'

const createAesEncrypt = (buffer, mode, key, iv) => {
  const cipher = createCipheriv(mode, key, iv)
  return Buffer.concat([cipher.update(buffer), cipher.final()])
}

const createAesDecrypt = (buffer, mode, key, iv) => {
  const cipher = createDecipheriv(mode, key, iv)
  return Buffer.concat([cipher.update(buffer), cipher.final()])
}

const createMD5 = str => createHash('md5').update(str).digest('hex')

const strToUint8Array = str => {
  const length = Math.floor(str.length / 2)
  const bArr = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    const i2 = i * 2
    bArr[i] = parseInt(str.substring(i2, i2 + 2), 16)
  }
  return bArr
}

export const wbdCrypto = {
  aesMode: 'aes-128-ecb',
  aesKey: strToUint8Array('7057273DC7FA29BF39442D72DD5E8CE4'),
  aesIv: '',
  appId: 'y67sprxhhpws',
  decodeData(base64Result) {
    const data = Buffer.from(decodeURIComponent(base64Result), 'base64')
    return JSON.parse(createAesDecrypt(data, this.aesMode, this.aesKey, this.aesIv).toString())
  },
  createSign(data, time) {
    const str = `${this.appId}${data}${time}`
    return createMD5(str).toUpperCase()
  },
  buildParam(jsonData) {
    const data = Buffer.from(JSON.stringify(jsonData))
    const time = Date.now()

    const encodeData = createAesEncrypt(data, this.aesMode, this.aesKey, this.aesIv).toString('base64')
    const sign = this.createSign(encodeData, time)

    return `data=${encodeURIComponent(encodeData)}&time=${time}&appId=${this.appId}&sign=${sign}`
  },
}

