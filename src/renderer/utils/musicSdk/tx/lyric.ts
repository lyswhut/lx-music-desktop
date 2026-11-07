import { httpFetch } from '../../request'
import getMusicInfo from './musicInfo'
import { handleDecode } from '@renderer/utils/musicSdk/tx/decodeLyric'

const songIdMap = new Map<string, any>()
const promises = new Map<string, Promise<any>>()

const parseTools = {
  rxps: {
    info: /^{"/,
    lineTime: /^\[(\d+),\d+]/,
    lineTime2: /^\[([\d:.]+)]/,
    wordTime: /\(\d+,\d+\)/,
    wordTimeAll: /(\(\d+,\d+\))/g,
    timeLabelFixRxp: /(?:\.0+|0+)$/,
  },
  msFormat(timeMs: number): string {
    if (Number.isNaN(timeMs)) return ''
    let ms = (timeMs % 1000).toString().padStart(3, '0')
    timeMs /= 1000
    let m = parseInt((timeMs / 60) as any)
      .toString()
      .padStart(2, '0')
    timeMs %= 60
    let s = parseInt(timeMs as any).toString().padStart(2, '0')
    return `[${m}:${s}.${ms}]`
  },
  parseLyric(lrc: string): { lyric: string, lxlyric: string } {
    lrc = lrc.trim()
    lrc = lrc.replace(/\r/g, '')
    if (!lrc) return { lyric: '', lxlyric: '' }
    const lines = lrc.split('\n')

    const lxlrcLines: string[] = []
    const lrcLines: string[] = []

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

      let times: any = words.match(this.rxps.wordTimeAll)
      if (!times) continue
      times = times.map((time: string) => {
        const result = /\((\d+),(\d+)\)/.exec(time)!
        return `<${Math.trunc(Math.max(parseInt(result[1]) - startMsTime, 0))},${result[2]}>`
      })
      const wordArr = words.split(this.rxps.wordTime)
      const newWords = times.map((time: string, index: number) => `${time}${wordArr[index]}`).join('')
      lxlrcLines.push(`${startTimeStr}${newWords}`)
    }
    return {
      lyric: lrcLines.join('\n'),
      lxlyric: lxlrcLines.join('\n'),
    }
  },
  parseRlyric(lrc: string): string {
    lrc = lrc.trim()
    lrc = lrc.replace(/\r/g, '')
    if (!lrc) return ''
    const lines = lrc.split('\n')

    const lrcLines: string[] = []

    for (let line of lines) {
      line = line.trim()
      let result = this.rxps.lineTime.exec(line)
      if (!result) continue

      const startMsTime = parseInt(result[1])
      const startTimeStr = this.msFormat(startMsTime)
      if (!startTimeStr) continue

      let words = line.replace(this.rxps.lineTime, '')

      lrcLines.push(`${startTimeStr}${words.replace(this.rxps.wordTimeAll, '')}`)
    }
    return lrcLines.join('\n')
  },
  removeTag(str: string): string {
    return str.replace(/^[\S\s]*?LyricContent="/, '').replace(/"\/>[\S\s]*?$/, '')
  },
  getIntv(interval: string): number {
    if (!interval) return 0
    if (!interval.includes('.')) interval += '.0'
    let arr = interval.split(/[:.]/)
    while (arr.length < 3) arr.unshift('0')
    const [m, s, ms] = arr
    return parseInt(m) * 3600000 + parseInt(s) * 1000 + parseInt(ms)
  },
  fixRlrcTimeTag(rlrc: string, lrc: string): string {
    const rlrcLines = rlrc.split('\n')
    let lrcLines = lrc.split('\n')
    let newLrc: string[] = []
    rlrcLines.forEach((line: string) => {
      const result = this.rxps.lineTime2.exec(line)
      if (!result) return
      const words = line.replace(this.rxps.lineTime2, '')
      if (!words.trim()) return
      const t1 = this.getIntv(result[1])

      while (lrcLines.length) {
        const lrcLine = lrcLines.shift()
        const lrcLineResult = this.rxps.lineTime2.exec(lrcLine!)
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
  fixTlrcTimeTag(tlrc: string, lrc: string): string {
    const tlrcLines = tlrc.split('\n')
    let lrcLines = lrc.split('\n')
    let newLrc: string[] = []
    tlrcLines.forEach((line: string) => {
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
        const lrcLineResult = this.rxps.lineTime2.exec(lrcLine!)
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
  parse(lrc: string, tlrc: string, rlrc: string): { lyric: string, tlyric: string, rlyric: string, lxlyric: string } {
    const info = {
      lyric: '',
      tlyric: '',
      rlyric: '',
      lxlyric: '',
    }
    if (lrc) {
      let { lyric, lxlyric } = this.parseLyric(this.removeTag(lrc))
      info.lyric = lyric
      info.lxlyric = lxlyric
    }
    if (rlrc) info.rlyric = this.fixRlrcTimeTag(this.parseRlyric(this.removeTag(rlrc)), info.lyric)
    if (tlrc) info.tlyric = this.fixTlrcTimeTag(tlrc, info.lyric)

    return info
  },
}


export default {
  successCode: 0,
  async getSongId({ songId, songmid }: { songId?: any, songmid?: string }): Promise<any> {
    if (songId) return songId
    if (songIdMap.has(songmid!)) return songIdMap.get(songmid!)
    if (promises.has(songmid!)) return (await promises.get(songmid!)).songId
    const promise = getMusicInfo(songmid!)
    promises.set(songmid!, promise)
    const info = await promise
    songIdMap.set(songmid!, info.songId)
    promises.delete(songmid!)
    return info.songId
  },
  async parseLyric(lrc: string, tlrc: string, rlrc: string): Promise<{ lyric: string, tlyric: string, rlyric: string, lxlyric: string }> {
    const { lyric, tlyric, rlyric } = await handleDecode(lrc, tlrc, rlrc)
    return parseTools.parse(lyric, tlyric, rlyric)
  },
  getLyric(mInfo: any, retryNum: number = 0): { cancelHttp: () => void, promise: Promise<any> } {
    if (retryNum > 3) return { cancelHttp() {}, promise: Promise.reject(new Error('Get lyric failed')) }

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
        return requestObj.promise.then(async({ body }: any) => {
          if (body.code !== this.successCode || body.req.code !== this.successCode) { return this.getLyric(songId, ++retryNum) }
          const data = body.req.data
          return this.parseLyric(data.lyric, data.trans, data.roma)
        })
      }),
    }
  },
}
