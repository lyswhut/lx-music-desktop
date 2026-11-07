import { inflateRawSync, inflateSync, unzipSync } from 'zlib'
import { qrcDecrypt } from './tripledes'

const QRC_KEY = new Uint8Array(Buffer.from('!@#)(*$%123ZXC!@!@#)(NHL', 'utf8'))

// https://github.com/imsyy/SPlayer/blob/159f2e4de772f477ca72af3fb99938238f81a32f/electron/server/qqmusic/qrc.ts
const decryptQrc = (encryptedQrc: string): string => {
  if (!encryptedQrc || encryptedQrc.trim() === '') {
    throw new Error('没有可解密的数据')
  }

  const encryptedBuffer = Buffer.from(encryptedQrc, 'hex')
  const encryptedData = new Uint8Array(encryptedBuffer)

  const decrypted = qrcDecrypt(encryptedData, QRC_KEY)
  const decryptedBuffer = Buffer.from(decrypted)

  let decompressed: Buffer

  try {
    decompressed = inflateSync(decryptedBuffer)
    return decompressed.toString('utf8')
  } catch {
  }

  try {
    decompressed = inflateRawSync(decryptedBuffer)
    return decompressed.toString('utf8')
  } catch {
  }

  try {
    decompressed = unzipSync(decryptedBuffer)
    return decompressed.toString('utf8')
  } catch {
  }

  const str = decryptedBuffer.toString('utf8')
  if (str.includes('[') || str.includes('<')) {
    return str
  }

  throw new Error('无法解压数据')
}

const decode = async(str: string): Promise<string> => {
  if (!str?.trim()) {
    return ''
  }

  try {
    return decryptQrc(str)
  } catch (err) {
    return ''
  }
}

export const handleDecode = async(lrc: string, tlrc: string, rlrc: string) => {
  const [lyric, tlyric, rlyric] = await Promise.all([decode(lrc), decode(tlrc), decode(rlrc)])

  return {
    lyric, tlyric, rlyric,
  }
}
