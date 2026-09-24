import { httpFetch } from '../../request'
import { getMusicInfo } from './musicInfo'
import { decrypt } from './utils/mrc'

const mrcTools = {
  rxps: {
    lineTime: /^\s*\[(\d+),\d+]/,
    wordTime: /\(\d+,\d+\)/,
    wordTimeAll: /(\(\d+,\d+\))/g,
  },
  parseLyric(str: string): { lyric: string, lxlyric: string } {
    str = str.replace(/\r/g, '')
    const lines = str.split('\n')
    const lxlrcLines: string[] = []
    const lrcLines: string[] = []

    for (const line of lines) {
      if (line.length < 6) continue
      let result = this.rxps.lineTime.exec(line)
      if (!result) continue

      const startTime = parseInt(result[1])
      let time: number | string = startTime
      let ms = ((time) % 1000).toString().padStart(3, '0')
      time = (time) / 1000
      let m = Math.floor((time) / 60)
        .toString()
        .padStart(2, '0')
      time = (time) % 60
      let s = Math.floor(time).toString().padStart(2, '0')
      time = `${m}:${s}.${ms}`

      let words = line.replace(this.rxps.lineTime, '')

      lrcLines.push(`[${time}]${words.replace(this.rxps.wordTimeAll, '')}`)

      let times: string[] | null = words.match(this.rxps.wordTimeAll)
      if (!times) continue
      const parsedTimes = times.map((time) => {
        const result = /\((\d+),(\d+)\)/.exec(time)!
        return `<${Math.trunc(parseInt(result[1]) - startTime)},${result[2]}>`
      })
      const wordArr = words.split(this.rxps.wordTime)
      const newWords = parsedTimes.map((time, index) => `${time}${wordArr[index]}`).join('')
      lxlrcLines.push(`[${time}]${newWords}`)
    }
    return {
      lyric: lrcLines.join('\n'),
      lxlyric: lxlrcLines.join('\n'),
    }
  },
  async getText(url: string, tryNum: number = 0): Promise<any> {
    const requestObj = httpFetch(url, {
      headers: {
        Referer: 'https://app.c.nf.migu.cn/',
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
        channel: '0146921',
      },
    })
    return requestObj.promise.then(({ statusCode, body }: any) => {
      if (statusCode == 200) return body
      if (tryNum > 5 || statusCode == 404) return Promise.reject(new Error('歌词获取失败'))
      return this.getText(url, ++tryNum)
    })
  },
  async getMrc(url: string): Promise<{ lyric: string, lxlyric: string }> {
    const text = await this.getText(url)
    return this.parseLyric(decrypt(text))
  },
  async getLrc(url: string): Promise<{ lxlyric: string, lyric: string }> {
    const text = await this.getText(url)
    return ({ lxlyric: '', lyric: text })
  },
  async getTrc(url: string): Promise<string> {
    if (!url) return Promise.resolve('')
    return this.getText(url)
  },
  async getMusicInfo(songInfo: any): Promise<any> {
    return songInfo.mrcUrl == null ? getMusicInfo(songInfo.songmid) : songInfo
  },
  getLyric(songInfo: any): any {
    return {
      promise: this.getMusicInfo(songInfo).then(async(info: any) => {
        let p: Promise<any> | undefined
        if (info.mrcUrl) p = this.getMrc(info.mrcUrl)
        else if (info.lrcUrl) p = this.getLrc(info.lrcUrl)
        if (p == null) return Promise.reject(new Error('获取歌词失败'))
        const [lrcInfo, tlyric] = await Promise.all([p, this.getTrc(info.trcUrl)])
        lrcInfo.tlyric = tlyric
        return lrcInfo
      }),
      cancelHttp() {},
    }
  },
}

export default {
  getLyric(songInfo: any): any {
    return mrcTools.getLyric(songInfo)
  },
}
