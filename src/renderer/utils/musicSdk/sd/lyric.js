import { trackDetail } from './api'

const timeTag = /^\[(\d+):(\d{2})(?:\.(\d{1,3}))?\]/
const msTag = time => {
  const minutes = Math.floor(time / 60000).toString().padStart(2, '0')
  const seconds = Math.floor(time / 1000 % 60).toString().padStart(2, '0')
  return `[${minutes}:${seconds}.${(time % 1000).toString().padStart(3, '0')}]`
}

export const parseLines = raw => {
  const lyric = []
  const lxlyric = []
  for (let line of (raw ?? '').replace(/\r/g, '').split('\n')) {
    line = line.trim()
    const match = /^\[(\d+),\d+\](.*)$/.exec(line)
    if (match) {
      const tag = msTag(Number(match[1]))
      const words = match[2].replace(/<(\d+),(\d+),\d+>/g, '<$1,$2>')
      lyric.push(tag + words.replace(/<\d+,\d+>/g, ''))
      if (/<\d+,\d+>/.test(words)) lxlyric.push(tag + words)
    } else if (timeTag.test(line)) {
      lyric.push(line.replace(timeTag, (_, m, s, ms = '') => `[${m.padStart(2, '0')}:${s}.${ms.padEnd(3, '0')}]`))
    } else if (/^\[(?:ar|ti|al|by|offset):/.test(line)) {
      lyric.push(line)
      lxlyric.push(line)
    }
  }
  return { lyric: lyric.join('\n'), lxlyric: lxlyric.join('\n') }
}

export const parseLyric = lyricObject => {
  const raw = lyricObject?.content ?? ''
  const result = { ...parseLines(raw), tlyric: '', rlyric: '' }
  const times = result.lyric.split('\n').map(line => timeTag.exec(line)?.[0]).filter(Boolean)
  const translations = Object.entries(lyricObject?.lang_translations ?? {})
  let translation
  for (const lang of ['ZH-HANS-CN', 'ZH-HANS', 'ZH-CN', 'ZH']) {
    translation = translations.find(([key]) => key.toUpperCase() == lang)?.[1]?.content
    if (translation) break
  }
  translation ||= translations.find(([key, value]) => /^zh/i.test(key) || /^zh/i.test(value?.lang ?? ''))?.[1]?.content
  if (translation) {
    const lines = parseLines(translation).lyric.split('\n').filter(line => timeTag.test(line) && line.replace(timeTag, '').trim())
    result.tlyric = lines.map((line, index) => lines.length == times.length ? line.replace(timeTag, times[index]) : line).join('\n')
  } else {
    const language = /\[language:([\w+/=]+)\]/.exec(raw)?.[1]
    if (language) {
      try {
        const content = JSON.parse(Buffer.from(language, 'base64').toString()).content
        const translated = content.find(item => item.type == 1)?.lyricContent
        if (translated) result.tlyric = times.map((time, index) => time + (translated[index]?.join('') ?? '')).join('\n')
      } catch (_) {}
    }
  }
  return result
}

export default {
  getLyric(songInfo) {
    const requestObj = trackDetail(songInfo.songmid)
    requestObj.promise = requestObj.promise.then(body => {
      if (!body.lyric?.content) throw new Error('汽水音乐暂无歌词')
      return parseLyric(body.lyric)
    })
    return requestObj
  },
}
