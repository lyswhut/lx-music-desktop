import { inflate } from 'zlib'
import { decodeName } from './util'

// https://github.com/lyswhut/lx-music-desktop/issues/296#issuecomment-683285784
const enc_key = Buffer.from([0x40, 0x47, 0x61, 0x77, 0x5e, 0x32, 0x74, 0x47, 0x51, 0x36, 0x31, 0x2d, 0xce, 0xd2, 0x6e, 0x69], 'binary')

// 解密酷狗 KRC：base64 -> 去前 4 字节 -> 与 enc_key 循环异或 -> zlib inflate
const decodeLyric = str => new Promise((resolve, reject) => {
  if (!str.length) return reject(new Error('empty lyric'))
  const buf_str = Buffer.from(str, 'base64').subarray(4)
  for (let i = 0, len = buf_str.length; i < len; i++) {
    buf_str[i] = buf_str[i] ^ enc_key[i % 16]
  }
  inflate(buf_str, (err, result) => {
    if (err) return reject(err)
    resolve(result.toString())
  })
})

const headExp = /^.*\[id:\$\w+\]\n/
// 行时间标签：[起始ms,时长ms]
const lineTimeExp = /^\[(\d+),(\d+)\]/
// 逐字标签：<偏移ms,时长ms[,附加]>文字（偏移相对行首，已是 lx 所需的相对格式）
const wordExp = /<(\d+),(\d+),?\d*>([^<\n]*)/g

// 毫秒 -> [mm:ss.SSS]；ms 段按 lx 约定作为原始毫秒解析（见 line-player.js）
const msFormat = (timeMs) => {
  const ms = timeMs % 1000
  const t = Math.floor(timeMs / 1000)
  const s = t % 60
  const m = Math.floor(t / 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

// 把 language 头里的一行（可能是音节数组/嵌套数组/字符串）摊平成音节字符串数组
const flattenSyllables = line => {
  if (Array.isArray(line)) return line.map(s => (Array.isArray(s) ? s.join('') : String(s)))
  return [String(line)]
}

/**
 * 解析解密后的 KRC 文本，输出 lx 所需的多类型歌词。
 * - lyric：逐行纯文本
 * - lxlyric：逐字（<相对偏移,时长>文字）
 * - rlyric：音译，有逐字网格时逐字（对齐主歌词词时间），否则整行纯文本
 * - tlyric：翻译，逐行纯文本
 * - plyric：AI 谐音（contentV2 type=2），逐行纯文本
 */
const parseLyric = (str) => {
  str = str.replace(/\r/g, '')
  if (headExp.test(str)) str = str.replace(headExp, '')

  // 解析 [language:base64] 头
  let romaCharList = null // 音译：每行音节字符串数组
  let transList = null // 翻译：每行整行字符串
  let phoneticList = null // AI 谐音：每行整行字符串
  const langMatch = str.match(/\[language:([\w=\\/+]+)\]/)
  if (langMatch) {
    str = str.replace(/\[language:[\w=\\/+]+\]\n/, '')
    try {
      const json = JSON.parse(Buffer.from(langMatch[1], 'base64').toString())
      for (const item of json.content ?? []) {
        const content = item.lyricContent ?? []
        if (item.type === 0) romaCharList = content.map(flattenSyllables)
        else if (item.type === 1) transList = content.map(line => flattenSyllables(line).join(''))
      }
      for (const item of json.contentV2 ?? []) {
        if (item.type === 2) {
          phoneticList = (item.lyricContent ?? []).map(line => flattenSyllables(line).join(''))
        }
      }
    } catch {}
  }

  const lyricLines = []
  const lxlyricLines = []
  const rlyricLines = []
  const tlyricLines = []
  const plyricLines = []
  let idx = 0

  for (const line of str.split('\n')) {
    lineTimeExp.lastIndex = 0
    const tMatch = lineTimeExp.exec(line)
    if (!tMatch) continue
    const timeTag = `[${msFormat(parseInt(tMatch[1]))}]`
    const body = line.replace(lineTimeExp, '')

    // 逐字解析：{偏移, 时长, 文字}
    const words = []
    wordExp.lastIndex = 0
    let wm
    while ((wm = wordExp.exec(body))) {
      words.push({ off: parseInt(wm[1]), dur: parseInt(wm[2]), text: wm[3] })
    }

    let plainText
    let lxText
    if (words.length) {
      plainText = words.map(w => w.text).join('')
      lxText = words.map(w => `<${w.off},${w.dur}>${w.text}`).join('')
    } else {
      plainText = body.replace(/<\d+,\d+,?\d*>/g, '')
      lxText = plainText
    }
    lyricLines.push(`${timeTag}${plainText}`)
    lxlyricLines.push(`${timeTag}${lxText}`)

    // 音译：逐字对齐主歌词词网格；无词网格则整行纯文本
    if (romaCharList && romaCharList[idx]) {
      const syls = romaCharList[idx]
      if (words.length) {
        const count = Math.min(syls.length, words.length)
        let rlxText = ''
        for (let j = 0; j < count; j++) rlxText += `<${words[j].off},${words[j].dur}>${syls[j]}`
        rlyricLines.push(`${timeTag}${rlxText}`)
      } else {
        rlyricLines.push(`${timeTag}${syls.join('')}`)
      }
    }

    if (transList && transList[idx] != null) tlyricLines.push(`${timeTag}${transList[idx]}`)
    if (phoneticList && phoneticList[idx] != null) plyricLines.push(`${timeTag}${phoneticList[idx]}`)

    idx++
  }

  return {
    lyric: decodeName(lyricLines.join('\n')),
    tlyric: decodeName(tlyricLines.join('\n')),
    rlyric: decodeName(rlyricLines.join('\n')),
    lxlyric: decodeName(lxlyricLines.join('\n')),
    plyric: decodeName(plyricLines.join('\n')),
  }
}

export const decodeKrc = async(data) => {
  return decodeLyric(data).then(parseLyric)
}
