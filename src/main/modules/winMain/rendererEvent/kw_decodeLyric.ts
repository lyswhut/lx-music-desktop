import { inflate } from 'zlib'
import iconv from 'iconv-lite'
import { mainHandle } from '@common/mainIpc'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'

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

const decodeLyric = async(buf: Buffer, isGetLyricx: boolean) => {
  // const info = buf.slice(0, index).toString()
  // if (!info.startsWith('tp=content')) return null
  // const isLyric = info.includes('\r\nlrcx=0\r\n')
  if (buf.toString('utf8', 0, 10) != 'tp=content') return ''
  // const index = buf.indexOf('\r\n\r\n') + 4
  const lrcData = await handleInflate(buf.slice(buf.indexOf('\r\n\r\n') + 4))

  if (!isGetLyricx) return iconv.decode(lrcData, 'gb18030')

  const buf_str = Buffer.from(lrcData.toString(), 'base64')
  const buf_str_len = buf_str.length
  const output = new Uint16Array(buf_str_len)
  let i = 0
  while (i < buf_str_len) {
    let j = 0
    while (j < buf_key_len && i < buf_str_len) {
      output[i] = buf_str[i] ^ buf_key[j]
      i++
      j++
    }
  }

  return iconv.decode(Buffer.from(output), 'gb18030')
}


export default () => {
  mainHandle<{ lrcBase64: string, isGetLyricx: boolean }, string>(WIN_MAIN_RENDERER_EVENT_NAME.handle_kw_decode_lyric, async({ params: { lrcBase64, isGetLyricx } }) => {
    const lrc = await decodeLyric(Buffer.from(lrcBase64, 'base64'), isGetLyricx)
    return Buffer.from(lrc).toString('base64')
  })
}
