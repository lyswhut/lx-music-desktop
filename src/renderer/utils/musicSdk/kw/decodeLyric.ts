import { inflate } from 'zlib'

const handleInflate = async(data: Buffer) => {
  return new Promise((resolve: (result: Buffer) => void, reject) => {
    inflate(data, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result)
    })
  })
}

const buf_key = Buffer.from('yeelion')
const buf_key_len = buf_key.length

export const decodeLyric = async(rawData: Buffer | string, isGetLyricx: boolean): Promise<string> => {
  const buf = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData)
  if (buf.toString('utf8', 0, 10).toLowerCase() !== 'tp=content') return ''
  const lrcData = await handleInflate(buf.subarray(buf.indexOf('\r\n\r\n') + 4))

  if (!isGetLyricx) return lrcData.toString('utf8')

  const buf_str = Buffer.from(lrcData.toString(), 'base64')
  const buf_str_len = buf_str.length
  const output = new Uint8Array(buf_str_len)
  let i = 0
  while (i < buf_str_len) {
    let j = 0
    while (j < buf_key_len && i < buf_str_len) {
      output[i] = buf_str[i] ^ buf_key[j]
      i++
      j++
    }
  }

  return Buffer.from(output).toString('utf8')
}
