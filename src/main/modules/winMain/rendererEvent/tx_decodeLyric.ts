import { createInflate, constants as zlibConstants } from 'node:zlib'
// import path from 'path'
import { mainHandle } from '@common/mainIpc'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'

// eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/quotes
// const require = module[`require`].bind(module)

let qrc_decode: (buf: Buffer, len: number) => Buffer

const inflate = async(lrcBuf: Buffer) => new Promise<string>((resolve, reject) => {
  const buffer_builder: Buffer[] = []
  const decompress_stream = createInflate()
    .on('data', (chunk) => {
      buffer_builder.push(chunk)
    })
    .on('close', () => {
      resolve(Buffer.concat(buffer_builder).toString())
    })
    .on('error', (err: any) => {
      // console.log(err)
      if (err.errno !== zlibConstants.Z_BUF_ERROR) { // EOF: expected
        reject(err)
      }
    })
  // decompress_stream.write(lrcBuf)
  decompress_stream.end(lrcBuf)
})

const decode = async(str: string): Promise<string> => {
  if (!str) return ''
  const buf = Buffer.from(str, 'hex')
  return inflate(qrc_decode(buf, buf.length))
}


// 感谢某位不愿透露姓名的大佬提供的C++算法源码，但由于作者不希望公开，所以将会以预构建二进制文件的形式加入代码仓库中
const handleDecode = async(lrc: string, tlrc: string, rlrc: string) => {
  if (!qrc_decode) {
    // const nativeBindingPath = path.join(__dirname, '../build/Release/qrc_decode.node')
    // const nativeBindingPath = process.env.NODE_ENV !== 'production' ? path.join(__dirname, '../build/Release/qrc_decode.node')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const addon = require('qrc_decode.node')
    // console.log(addon)
    qrc_decode = addon.qrc_decode
  }

  const [lyric, tlyric, rlyric] = await Promise.all([decode(lrc), decode(tlrc), decode(rlrc)])
  return {
    lyric,
    tlyric,
    rlyric,
  }
}


export default () => {
  mainHandle<{ lrc: string, tlrc: string, rlrc: string }, { lyric: string, tlyric: string, rlyric: string }>(WIN_MAIN_RENDERER_EVENT_NAME.handle_tx_decode_lyric, async({ params: { lrc, tlrc, rlrc } }) => {
    return handleDecode(lrc, tlrc, rlrc)
  })
}
