import { httpFetch } from '../../request'
import { eapi } from './utils/crypto'
// import { decodeName } from '../..'

// const parseLyric = (str, lrc) => {
//   if (!str) return ''

//   str = str.replace(/\r/g, '')

//   let lxlyric = str.replace(/\[((\d+),\d+)\].*/g, str => {
//     let result = str.match(/\[((\d+),\d+)\].*/)
//     let time = parseInt(result[2])
//     let ms = time % 1000
//     time /= 1000
//     let m = parseInt(time / 60).toString().padStart(2, '0')
//     time %= 60
//     let s = parseInt(time).toString().padStart(2, '0')
//     time = `${m}:${s}.${ms}`
//     str = str.replace(result[1], time)

//     let startTime = 0
//     str = str.replace(/\(0,1\) /g, ' ').replace(/\(\d+,\d+\)/g, time => {
//       const [start, end] = time.replace(/^\((\d+,\d+)\)$/, '$1').split(',')

//       time = `<${parseInt(startTime + parseInt(start))},${end}>`
//       startTime = parseInt(startTime + parseInt(end))
//       return time
//     })

//     return str
//   })

//   lxlyric = decodeName(lxlyric)
//   return lxlyric.trim()
// }

const eapiRequest = (url, data) => {
  return httpFetch('https://interface3.music.163.com/eapi/song/lyric/v1', {
    method: 'post',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
      origin: 'https://music.163.com',
      // cookie: 'os=pc; deviceId=A9C064BB4584D038B1565B58CB05F95290998EE8B025AA2D07AE; osver=Microsoft-Windows-10-Home-China-build-19043-64bit; appver=2.5.2.197409; channel=netease; MUSIC_A=37a11f2eb9de9930cad479b2ad495b0e4c982367fb6f909d9a3f18f876c6b49faddb3081250c4980dd7e19d4bd9bf384e004602712cf2b2b8efaafaab164268a00b47359f85f22705cc95cb6180f3aee40f5be1ebf3148d888aa2d90636647d0c3061cd18d77b7a0; __csrf=05b50d54082694f945d7de75c210ef94; mode=Z7M-KP5(7)GZ; NMTID=00OZLp2VVgq9QdwokUgq3XNfOddQyIAAAF_6i8eJg; ntes_kaola_ad=1',
    },
    form: eapi(url, data),
  })
  // requestObj.promise = requestObj.promise.then(({ body }) => {
  //   // console.log(raw)
  //   console.log(body)
  //   // console.log(eapiDecrypt(raw))
  //   // return eapiDecrypt(raw)
  //   return body
  // })
  // return requestObj
}

const parseTools = {
  rxps: {
    info: /^{"/,
    lineTime: /^\[(\d+),\d+\]/,
    wordTime: /\(\d+,\d+,\d+\)/,
    wordTimeAll: /(\(\d+,\d+,\d+\))/g,
  },
  msFormat(timeMs) {
    if (Number.isNaN(timeMs)) return ''
    let ms = timeMs % 1000
    timeMs /= 1000
    let m = parseInt(timeMs / 60).toString().padStart(2, '0')
    timeMs %= 60
    let s = parseInt(timeMs).toString().padStart(2, '0')
    return `[${m}:${s}.${ms}]`
  },
  parseLyric(lines) {
    const lxlrcLines = []
    const lrcLines = []

    for (let line of lines) {
      line = line.trim()
      let result = this.rxps.lineTime.exec(line)
      if (!result) {
        if (line.startsWith('[offset')) {
          lxlrcLines.push(line)
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
      if (!times) continue
      times = times.map(time => {
        const result = /\((\d+),(\d+),\d+\)/.exec(time)
        return `<${Math.max(parseInt(result[1]) - startMsTime, 0)},${result[2]}>`
      })
      const wordArr = words.split(this.rxps.wordTime)
      wordArr.shift()
      const newWords = times.map((time, index) => `${time}${wordArr[index]}`).join('')
      lxlrcLines.push(`${startTimeStr}${newWords}`)
    }
    return {
      lyric: lrcLines.join('\n'),
      lxlyric: lxlrcLines.join('\n'),
    }
  },
  parseHeaderInfo(str) {
    str = str.trim()
    str = str.replace(/\r/g, '')
    if (!str) return null
    const lines = str.split('\n')
    return lines.map(line => {
      if (!this.rxps.info.test(line)) return line
      try {
        const info = JSON.parse(line)
        const timeTag = this.msFormat(info.t)
        return timeTag ? `${timeTag}${info.c.map(t => t.tx).join('')}` : ''
      } catch {
        return ''
      }
    })
  },
  getIntv(interval) {
    if (!interval.includes('.')) interval += '.0'
    let arr = interval.split(/:|\./)
    while (arr.length < 3) arr.unshift('0')
    const [m, s, ms] = arr
    return parseInt(m) * 3600000 + parseInt(s) * 1000 + parseInt(ms)
  },
  fixTimeTag(lrc, targetlrc) {
    let lrcLines = lrc.split('\n')
    const targetlrcLines = targetlrc.split('\n')
    const timeRxp = /^\[([\d:.]+)\]/
    let temp = []
    let newLrc = []
    targetlrcLines.forEach((line) => {
      const result = timeRxp.exec(line)
      if (!result) return
      const words = line.replace(timeRxp, '')
      if (!words.trim()) return
      const t1 = this.getIntv(result[1])

      while (lrcLines.length) {
        const lrcLine = lrcLines.shift()
        const lrcLineResult = timeRxp.exec(lrcLine)
        if (!lrcLineResult) continue
        const t2 = this.getIntv(lrcLineResult[1])
        if (Math.abs(t1 - t2) < 100) {
          const lrc = line.replace(timeRxp, lrcLineResult[0]).trim()
          if (!lrc) continue
          newLrc.push(lrc)
          break
        }
        temp.push(lrcLine)
      }
      lrcLines = [...temp, ...lrcLines]
      temp = []
    })
    return newLrc.join('\n')
  },
  parse(ylrc, ytlrc, yrlrc, lrc, tlrc, rlrc) {
    const info = {
      lyric: '',
      tlyric: '',
      rlyric: '',
      lxlyric: '',
    }
    if (ylrc) {
      let lines = this.parseHeaderInfo(ylrc)
      if (lines) {
        const result = this.parseLyric(lines)
        if (ytlrc) {
          const lines = this.parseHeaderInfo(ytlrc)
          if (lines) {
            // if (lines.length == result.lyricLines.length) {
            info.tlyric = this.fixTimeTag(result.lyric, lines.join('\n'))
            // } else info.tlyric = lines.join('\n')
          }
        }
        if (yrlrc) {
          const lines = this.parseHeaderInfo(yrlrc)
          if (lines) {
            // if (lines.length == result.lyricLines.length) {
            info.rlyric = this.fixTimeTag(result.lyric, lines.join('\n'))
            // } else info.rlyric = lines.join('\n')
          }
        }

        const timeRxp = /^\[[\d:.]+\]/
        const headers = lines.filter(l => timeRxp.test(l)).join('\n')
        info.lyric = `${headers}\n${result.lyric}`
        info.lxlyric = result.lxlyric
        return info
      }
    }
    if (lrc) {
      const lines = this.parseHeaderInfo(lrc)
      if (lines) info.lyric = lines.join('\n')
    }
    if (tlrc) {
      const lines = this.parseHeaderInfo(tlrc)
      if (lines) info.tlyric = lines.join('\n')
    }
    if (rlrc) {
      const lines = this.parseHeaderInfo(rlrc)
      if (lines) info.rlyric = lines.join('\n')
    }

    return info
  },
}


// https://github.com/Binaryify/NeteaseCloudMusicApi/pull/1523/files
// export default songmid => {
//   const requestObj = httpFetch('https://music.163.com/api/linux/forward', {
//     method: 'post',
//     'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
//     form: linuxapi({
//       method: 'POST',
//       url: 'https://music.163.com/api/song/lyric?_nmclfl=1',
//       params: {
//         id: songmid,
//         tv: -1,
//         lv: -1,
//         rv: -1,
//         kv: -1,
//       },
//     }),
//   })
//   requestObj.promise = requestObj.promise.then(({ body }) => {
//     if (body.code !== 200 || !body?.lrc?.lyric) return Promise.reject(new Error('Get lyric failed'))
//     // console.log(body)
//     return {
//       lyric: body.lrc.lyric,
//       tlyric: body.tlyric?.lyric ?? '',
//       rlyric: body.romalrc?.lyric ?? '',
//       // lxlyric: parseLyric(body.klyric.lyric),
//     }
//   })
//   return requestObj
// }


// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/lyric_new.js
export default songmid => {
  const requestObj = eapiRequest('/api/song/lyric/v1', {
    id: songmid,
    cp: false,
    tv: 0,
    lv: 0,
    rv: 0,
    kv: 0,
    yv: 0,
    ytv: 0,
    yrv: 0,
  })
  requestObj.promise = requestObj.promise.then(({ body }) => {
    // console.log(body)
    if (body.code !== 200 || !body?.lrc?.lyric) return Promise.reject(new Error('Get lyric failed'))
    const info = parseTools.parse(body.yrc?.lyric, body.ytlrc?.lyric, body.yromalrc?.lyric, body.lrc.lyric, body.tlyric?.lyric, body.romalrc?.lyric)
    // console.log(info)
    if (!info.lyric) return Promise.reject(new Error('Get lyric failed'))
    return info
  })
  return requestObj
}
