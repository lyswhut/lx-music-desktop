import { httpFetch } from '../../request'
import { getMusicInfo } from './musicInfo'

// const key = 'karakal@123Qcomyidongtiantianhaoting'
const DELTA = 2654435769n
const MIN_LENGTH = 32
// const SPECIAL_CHAR = '0'
const keyArr = [
  27303562373562475n,
  18014862372307051n,
  22799692160172081n,
  34058940340699235n,
  30962724186095721n,
  27303523720101991n,
  27303523720101998n,
  31244139033526382n,
  28992395054481524n,
]

const teaDecrypt = (data, key) => {
  const length = data.length
  const lengthBitint = BigInt(length)
  if (length >= 1) {
    // let j = data[data.length - 1];
    let j2 = data[0]
    let j3 = toLong((6n + (52n / lengthBitint)) * DELTA)
    while (true) {
      let j4 = j3
      if (j4 == 0n) break
      let j5 = toLong(3n & toLong(j4 >> 2n))
      let j6 = lengthBitint
      while (true) {
        j6--
        if (j6 > 0n) {
          let j7 = data[(j6 - 1n)]
          let i = j6
          j2 = toLong(data[i] - (toLong(toLong(j2 ^ j4) + toLong(j7 ^ key[toLong(toLong(3n & j6) ^ j5)])) ^ toLong(toLong(toLong(j7 >> 5n) ^ toLong(j2 << 2n)) + toLong(toLong(j2 >> 3n) ^ toLong(j7 << 4n)))))
          data[i] = j2
        } else break
      }
      let j8 = data[lengthBitint - 1n]
      j2 = toLong(data[0n] - toLong(toLong(toLong(key[toLong(toLong(j6 & 3n) ^ j5)] ^ j8) + toLong(j2 ^ j4)) ^ toLong(toLong(toLong(j8 >> 5n) ^ toLong(j2 << 2n)) + toLong(toLong(j2 >> 3n) ^ toLong(j8 << 4n)))))
      data[0] = j2
      j3 = toLong(j4 - DELTA)
    }
  }
  return data
}

const longArrToString = (data) => {
  const arrayList = []
  for (const j of data) arrayList.push(longToBytes(j).toString('utf16le'))
  return arrayList.join('')
}

// https://stackoverflow.com/a/29132118
const longToBytes = (l) => {
  const result = Buffer.alloc(8)
  for (let i = 0; i < 8; i++) {
    result[i] = parseInt(l & 0xFFn)
    l >>= 8n
  }
  return result
}


const toBigintArray = (data) => {
  const length = Math.floor(data.length / 16)
  const jArr = Array(length)
  for (let i = 0; i < length; i++) {
    jArr[i] = toLong(data.substring(i * 16, (i * 16) + 16))
  }
  return jArr
}

// https://github.com/lyswhut/lx-music-desktop/issues/445#issuecomment-1139338682
const MAX = 9223372036854775807n
const MIN = -9223372036854775808n
const toLong = str => {
  const num = typeof str == 'string' ? BigInt('0x' + str) : str
  if (num > MAX) return toLong(num - (1n << 64n))
  else if (num < MIN) return toLong(num + (1n << 64n))
  return num
}

const mrcDecrypt = (data) => {
  // console.log(data.length)
  // -3551594764563790630
  // console.log(toLongArrayFromArr(Buffer.from(key)))
  // console.log(teaDecrypt(toBigintArray(data), keyArr))
  // console.log(longArrToString(teaDecrypt(toBigintArray(data), keyArr)))
  // console.log(toByteArray(teaDecrypt(toBigintArray(data), keyArr)))
  return (data == null || data.length < MIN_LENGTH)
    ? data
    : longArrToString(teaDecrypt(toBigintArray(data), keyArr))
}

// console.log(14895149309145760986n - )
// console.log(toLong('14895149309145760986'))
// console.log(mrcDecrypt(str))
// console.log(mrcDecrypt(str))
// console.log(toByteArray([6048138644744000495n]))
// console.log(toByteArray([16325999628386395n]))
// console.log(toLong(90994076459972177136n))

const mrcTools = {
  rxps: {
    lineTime: /^\s*\[(\d+),\d+\]/,
    wordTime: /\(\d+,\d+\)/,
    wordTimeAll: /(\(\d+,\d+\))/g,
  },
  parseLyric(str) {
    str = str.replace(/\r/g, '')
    const lines = str.split('\n')
    const lxlrcLines = []
    const lrcLines = []

    for (const line of lines) {
      if (line.length < 6) continue
      let result = this.rxps.lineTime.exec(line)
      if (!result) continue

      const startTime = parseInt(result[1])
      let time = startTime
      let ms = time % 1000
      time /= 1000
      let m = parseInt(time / 60).toString().padStart(2, '0')
      time %= 60
      let s = parseInt(time).toString().padStart(2, '0')
      time = `${m}:${s}.${ms}`

      let words = line.replace(this.rxps.lineTime, '')

      lrcLines.push(`[${time}]${words.replace(this.rxps.wordTimeAll, '')}`)

      let times = words.match(this.rxps.wordTimeAll)
      if (!times) continue
      times = times.map(time => {
        const result = /\((\d+),(\d+)\)/.exec(time)
        return `<${parseInt(result[1]) - startTime},${result[2]}>`
      })
      const wordArr = words.split(this.rxps.wordTime)
      const newWords = times.map((time, index) => `${time}${wordArr[index]}`).join('')
      lxlrcLines.push(`[${time}]${newWords}`)
    }
    return {
      lyric: lrcLines.join('\n'),
      lxlyric: lxlrcLines.join('\n'),
    }
  },
  getText(url, tryNum = 0) {
    const requestObj = httpFetch(url, {
      headers: {
        Referer: 'https://app.c.nf.migu.cn/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
        channel: '0146921',
      },
    })
    return requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode == 200) return body
      if (tryNum > 5 || statusCode == 404) return Promise.reject('歌词获取失败')
      return this.getText(url, ++tryNum)
    })
  },
  getMrc(url) {
    return this.getText(url).then(text => {
      return this.parseLyric(mrcDecrypt(text))
    })
  },
  getLrc(url) {
    return this.getText(url).then(text => ({ lxlyric: '', lyric: text }))
  },
  getTrc(url) {
    if (!url) return Promise.resolve('')
    return this.getText(url)
  },
  getMusicInfo(songInfo) {
    return songInfo.mrcUrl == null
      ? getMusicInfo(songInfo.copyrightId)
      : songInfo
  },
  getLyric(songInfo) {
    return {
      promise: this.getMusicInfo(songInfo).then(info => {
        let p
        if (info.mrcUrl) p = this.getMrc(info.mrcUrl)
        else if (info.lrcUrl) p = this.getLrc(info.lrcUrl)
        if (p == null) return Promise.reject('获取歌词失败')
        return Promise.all([p, this.getTrc(info.trcUrl)]).then(([lrcInfo, tlyric]) => {
          lrcInfo.tlyric = tlyric
          return lrcInfo
        })
      }),
      cancelHttp() {},
    }
  },
}

export default {
  getLyricWeb(songInfo, tryNum = 0) {
    // console.log(songInfo.copyrightId)
    if (songInfo.lrcUrl) {
      let requestObj = httpFetch(songInfo.lrcUrl)
      requestObj.promise = requestObj.promise.then(({ body, statusCode }) => {
        if (statusCode !== 200) {
          if (tryNum > 5) return Promise.reject('歌词获取失败')
          let tryRequestObj = this.getLyricWeb(songInfo, ++tryNum)
          requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
          return tryRequestObj.promise
        }
        return {
          lyric: body,
          tlyric: '',
        }
      })
      return requestObj
    } else {
      let requestObj = httpFetch(`https://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=${songInfo.copyrightId}`, {
        headers: {
          Referer: 'https://music.migu.cn/v3/music/player/audio?from=migu',
        },
      })
      requestObj.promise = requestObj.promise.then(({ body }) => {
        if (body.returnCode !== '000000' || !body.lyric) {
          if (tryNum > 5) return Promise.reject(new Error('Get lyric failed'))
          let tryRequestObj = this.getLyricWeb(songInfo, ++tryNum)
          requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
          return tryRequestObj.promise
        }
        return {
          lyric: body.lyric,
          tlyric: '',
        }
      })
      return requestObj
    }
  },

  getLyric(songInfo) {
    let requestObj = mrcTools.getLyric(songInfo)
    requestObj.promise = requestObj.promise.catch(() => {
      let webRequestObj = this.getLyricWeb(songInfo)
      requestObj.cancelHttp = webRequestObj.cancelHttp.bind(webRequestObj)
      return webRequestObj.promise
    })
    return requestObj
  },
}
