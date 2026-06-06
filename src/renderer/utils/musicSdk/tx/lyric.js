import { httpFetch } from '../../request'
import getMusicInfo from './musicInfo'
import { decodeQrc } from './utils/qrcDecode'

const songIdMap = new Map()
const promises = new Map()
export const decodeLyric = (lrc, tlrc, rlrc) => ({
  lyric: decodeQrc(lrc),
  tlyric: decodeQrc(tlrc),
  rlyric: decodeQrc(rlrc),
})


const parseTools = {
  rxps: {
    info: /^{"/,
    lineTime: /^\[(\d+),\d+\]/,
    lineTime2: /^\[([\d:.]+)\]/,
    wordTime: /\(\d+,\d+\)/,
    wordTimeAll: /(\(\d+,\d+\))/g,
    timeLabelFixRxp: /(?:\.0+|0+)$/,
  },
  msFormat(timeMs) {
    if (Number.isNaN(timeMs)) return ''
    let ms = timeMs % 1000
    timeMs /= 1000
    let m = parseInt(timeMs / 60).toString().padStart(2, '0')
    timeMs %= 60
    let s = parseInt(timeMs).toString().padStart(2, '0')
    return `[${m}:${s}.${String(ms).padStart(3, '0')}]`
  },
  parseLyric(lrc) {
    lrc = lrc.trim()
    lrc = lrc.replace(/\r/g, '')
    if (!lrc) {
      return {
        lyric: '',
        lxlyric: '',
        lines: [],
      }
    }
    const lines = lrc.split('\n')

    const lxlrcLines = []
    const lrcLines = []
    // 结构化字网格：{ startMsTime, timeStr, words:[{off, dur, text}] }
    // 供音译逐字化复用主歌词每个字的相对偏移/时长（与 font-player 同索引联动对齐）
    const wordLines = []

    for (let line of lines) {
      line = line.trim()
      let result = this.rxps.lineTime.exec(line)
      if (!result) {
        if (line.startsWith('[offset')) {
          lxlrcLines.push(line)
          lrcLines.push(line)
        }
        if (this.rxps.lineTime2.test(line)) {
          lrcLines.push(line)
        }
        continue
      }

      const startMsTime = parseInt(result[1])
      const startTimeStr = this.msFormat(startMsTime)
      if (!startTimeStr) continue

      let words = line.replace(this.rxps.lineTime, '')

      lrcLines.push(`${startTimeStr}${words.replace(this.rxps.wordTimeAll, '')}`)

      let times = words.match(this.rxps.wordTimeAll)
      if (!times) {
        wordLines.push({ startMsTime, timeStr: startTimeStr, words: [] })
        continue
      }
      // tx 逐字格式为 `word(off,dur)`，文字在时间标签之前；转为 lx 的 `<off,dur>word`
      const wordArr = words.split(this.rxps.wordTime)
      const grid = times.map((time, index) => {
        const r = /\((\d+),(\d+)\)/.exec(time)
        const off = Math.max(parseInt(r[1]) - startMsTime, 0)
        const dur = parseInt(r[2])
        return { off, dur, text: wordArr[index] ?? '' }
      })
      const newWords = grid.map(w => `<${w.off},${w.dur}>${w.text}`).join('')
      lxlrcLines.push(`${startTimeStr}${newWords}`)
      wordLines.push({ startMsTime, timeStr: startTimeStr, words: grid })
    }
    return {
      lyric: lrcLines.join('\n'),
      lxlyric: lxlrcLines.join('\n'),
      lines: wordLines,
    }
  },
  parseRlyric(lrc) {
    lrc = lrc.trim()
    lrc = lrc.replace(/\r/g, '')
    if (!lrc) {
      return {
        lyric: '',
        lines: [],
      }
    }
    const lines = lrc.split('\n')

    const lrcLines = []
    // 结构化音节网格：{ startMsTime, timeStr, syllables:[音节文字] }
    const sylLines = []

    for (let line of lines) {
      line = line.trim()
      let result = this.rxps.lineTime.exec(line)
      if (!result) continue

      const startMsTime = parseInt(result[1])
      const startTimeStr = this.msFormat(startMsTime)
      if (!startTimeStr) continue

      let words = line.replace(this.rxps.lineTime, '')

      const plain = words.replace(this.rxps.wordTimeAll, '')
      lrcLines.push(`${startTimeStr}${plain}`)

      // 拆出每个音节文字（去掉 `(off,dur)` 标记后按音节切分）
      const syllables = words.match(this.rxps.wordTimeAll)
        ? words.split(this.rxps.wordTime).filter(s => s !== '')
        : null
      sylLines.push({ startMsTime, timeStr: startTimeStr, syllables, plain })
    }
    return {
      lyric: lrcLines.join('\n'),
      lines: sylLines,
    }
  },
  /**
   * 音译逐字化：让音译每个音节直接复用主歌词同行同索引字的相对偏移/时长，
   * 这样音译逐字与主歌词同时间网格、同索引，font-player 才能联动卡拉OK同步。
   * 仅当某行音节数与主歌词字数一致时逐字化，否则该行降级为纯文本（仍带时间标签）。
   * 任一行无法逐字化或网格缺失时，整体降级走 fixRlrcTimeTag 纯文本路径（返回 null）。
   */
  buildWordByWordRlyric(rlrcLines, mainLines) {
    if (!rlrcLines.length || !mainLines.length) return null
    // 主歌词按起始时间建索引，便于与音译行就近匹配
    const mainByTime = new Map()
    for (const ml of mainLines) {
      if (!mainByTime.has(ml.startMsTime)) mainByTime.set(ml.startMsTime, ml)
    }
    let matched = 0
    const out = []
    for (const rl of rlrcLines) {
      // 就近匹配主歌词行（容差 100ms）
      let main = mainByTime.get(rl.startMsTime)
      if (!main) {
        for (const ml of mainLines) {
          if (Math.abs(ml.startMsTime - rl.startMsTime) < 100) { main = ml; break }
        }
      }
      if (main?.words?.length && rl.syllables && rl.syllables.length === main.words.length) {
        let lxText = ''
        for (let j = 0; j < rl.syllables.length; j++) {
          lxText += `<${main.words[j].off},${main.words[j].dur}>${rl.syllables[j]}`
        }
        out.push(`${main.timeStr}${lxText}`)
        matched++
      } else {
        out.push(`${(main ?? rl).timeStr}${rl.plain}`)
      }
    }
    // 没有任何一行能逐字化时视为失败，让调用方回退
    return matched ? out.join('\n') : null
  },
  removeTag(str) {
    return str.replace(/^[\S\s]*?LyricContent="/, '').replace(/"\/>[\S\s]*?$/, '')
  },
  getIntv(interval) {
    if (!interval) return 0
    if (!interval.includes('.')) interval += '.0'
    let arr = interval.split(/:|\./)
    while (arr.length < 3) arr.unshift('0')
    const [m, s, ms] = arr
    return parseInt(m) * 3600000 + parseInt(s) * 1000 + parseInt(ms)
  },
  fixRlrcTimeTag(rlrc, lrc) {
    const rlrcLines = rlrc.split('\n')
    let lrcLines = lrc.split('\n')
    let newLrc = []
    rlrcLines.forEach((line) => {
      const result = this.rxps.lineTime2.exec(line)
      if (!result) return
      const words = line.replace(this.rxps.lineTime2, '')
      if (!words.trim()) return
      const t1 = this.getIntv(result[1])

      while (lrcLines.length) {
        const lrcLine = lrcLines.shift()
        const lrcLineResult = this.rxps.lineTime2.exec(lrcLine)
        if (!lrcLineResult) continue
        const t2 = this.getIntv(lrcLineResult[1])
        if (Math.abs(t1 - t2) < 100) {
          newLrc.push(line.replace(this.rxps.lineTime2, lrcLineResult[0]))
          break
        }
      }
    })
    return newLrc.join('\n')
  },
  fixTlrcTimeTag(tlrc, lrc) {
    const tlrcLines = tlrc.split('\n')
    let lrcLines = lrc.split('\n')
    let newLrc = []
    tlrcLines.forEach((line) => {
      const result = this.rxps.lineTime2.exec(line)
      if (!result) return
      const words = line.replace(this.rxps.lineTime2, '')
      if (!words.trim()) return
      let time = result[1]
      if (time.includes('.')) {
        time += ''.padStart(3 - time.split('.')[1].length, '0')
      }
      const t1 = this.getIntv(time)

      while (lrcLines.length) {
        const lrcLine = lrcLines.shift()
        const lrcLineResult = this.rxps.lineTime2.exec(lrcLine)
        if (!lrcLineResult) continue
        const t2 = this.getIntv(lrcLineResult[1])
        if (Math.abs(t1 - t2) < 100) {
          newLrc.push(line.replace(this.rxps.lineTime2, lrcLineResult[0]))
          break
        }
      }
    })
    return newLrc.join('\n')
  },
  parse(lrc, tlrc, rlrc) {
    const info = {
      lyric: '',
      tlyric: '',
      rlyric: '',
      lxlyric: '',
    }
    let mainLines = []
    if (lrc) {
      let {
        lyric,
        lxlyric,
        lines,
      } = this.parseLyric(this.removeTag(lrc))
      info.lyric = lyric
      info.lxlyric = lxlyric
      mainLines = lines
    }
    if (rlrc) {
      const { lyric: rlyricPlain, lines: rlrcLines } = this.parseRlyric(this.removeTag(rlrc))
      // 优先尝试逐字音译（复用主歌词字网格、与之同索引联动）；失败再回退纯文本对齐
      const wbw = this.buildWordByWordRlyric(rlrcLines, mainLines)
      info.rlyric = wbw ?? this.fixRlrcTimeTag(rlyricPlain, info.lyric)
    }
    if (tlrc) info.tlyric = this.fixTlrcTimeTag(tlrc, info.lyric)

    return info
  },
}


export default {
  successCode: 0,
  async getSongId({
    songId,
    songmid,
  }) {
    if (songId) return songId
    if (songIdMap.has(songmid)) return songIdMap.get(songmid)
    if (promises.has(songmid)) return (await promises.get(songmid)).songId
    const promise = getMusicInfo(songmid)
    promises.set(promise)
    const info = await promise
    songIdMap.set(songmid, info.songId)
    promises.delete(songmid)
    return info.songId
  },
  parseLyric(lrc, tlrc, rlrc) {
    const {
      lyric,
      tlyric,
      rlyric,
    } = decodeLyric(lrc, tlrc, rlrc)

    return parseTools.parse(lyric, tlyric, rlyric)
  },
  getLyric(mInfo, retryNum = 0) {
    if (retryNum > 3) return Promise.reject(new Error('Get lyric failed'))

    return {
      cancelHttp() {

      },
      promise: this.getSongId(mInfo).then(songId => {
        const requestObj = httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
          method: 'post',
          headers: {
            referer: 'https://y.qq.com',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
          },
          body: {
            comm: {
              ct: '19',
              cv: '1859',
              uin: '0',
            },
            req: {
              method: 'GetPlayLyricInfo',
              module: 'music.musichallSong.PlayLyricInfo',
              param: {
                format: 'json',
                crypt: 1,
                ct: 19,
                cv: 1873,
                interval: 0,
                lrc_t: 0,
                qrc: 1,
                qrc_t: 0,
                roma: 1,
                roma_t: 0,
                songID: songId,
                trans: 1,
                trans_t: 0,
                type: -1,
              },
            },
          },
        })
        return requestObj.promise.then(({ body }) => {
          if (body.code != this.successCode || body.req.code != this.successCode) return this.getLyric(songId, ++retryNum)
          const data = body.req.data
          return this.parseLyric(data.lyric, data.trans, data.roma)
        })
      }),
    }
  },
}

