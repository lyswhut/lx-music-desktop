// import { httpGet, httpFetch } from '../../request'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { rendererInvoke } from '@common/rendererIpc'

// const kw_token = {
//   token: null,
//   isGetingToken: false,
// }

// const translationMap = {
//   "{'": '{"',
//   "'}\n": '"}',
//   "'}": '"}',
//   "':'": '":"',
//   "','": '","',
//   "':{'": '":{"',
//   "':['": '":["',
//   "'}],'": '"}],"',
//   "':[{'": '":[{"',
//   "'},'": '"},"',
//   "'},{'": '"},{"',
//   "':[],'": '":[],"',
//   "':{},'": '":{},"',
//   "'}]}": '"}]}',
// }

// export const objStr2JSON = str => {
//   return JSON.parse(str.replace(/(^{'|'}\n$|'}$|':'|','|':\[{'|'}\],'|':{'|'},'|'},{'|':\['|':\[\],'|':{},'|'}]})/g, s => translationMap[s]))
// }

export const objStr2JSON = str => {
  return JSON.parse(str.replace(/('(?=(,\s*')))|('(?=:))|((?<=([:,]\s*))')|((?<={)')|('(?=}))/g, '"'))
}


export const formatSinger = rawData => rawData.replace(/&/g, '、')

export const matchToken = headers => {
  try {
    return headers['set-cookie'][0].match(/kw_token=(\w+)/)[1]
  } catch (err) {
    return null
  }
}

// const wait = time => new Promise(resolve => setTimeout(() => resolve(), time))


// export const getToken = (retryNum = 0) => new Promise((resolve, reject) => {
//   if (retryNum > 2) return Promise.reject(new Error('try max num'))

//   if (kw_token.isGetingToken) return wait(1000).then(() => getToken(retryNum).then(token => resolve(token)))
//   if (kw_token.token) return resolve(kw_token.token)
//   kw_token.isGetingToken = true
//   httpGet('http://www.kuwo.cn/', (err, resp) => {
//     kw_token.isGetingToken = false
//     if (err) return getToken(++retryNum)
//     if (resp.statusCode != 200) return reject(new Error('获取失败'))
//     const token = kw_token.token = matchToken(resp.headers)
//     resolve(token)
//   })
// })

export const decodeLyric = base64Data => rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.handle_kw_decode_lyric, base64Data)

// export const tokenRequest = async(url, options = {}) => {
//   let token = kw_token.token
//   if (!token) token = await getToken()
//   if (!options.headers) {
//     options.headers = {
//       Referer: 'http://www.kuwo.cn/',
//       csrf: token,
//       cookie: 'kw_token=' + token,
//     }
//   }
//   const requestObj = httpFetch(url, options)
//   requestObj.promise = requestObj.promise.then(resp => {
//     // console.log(resp)
//     if (resp.statusCode == 200) {
//       kw_token.token = matchToken(resp.headers)
//     }
//     return resp
//   })
//   return requestObj
// }

export const lrcTools = {
  rxps: {
    wordLine: /^(\[\d{1,2}:.*\d{1,4}\])\s*(\S+(?:\s+\S+)*)?\s*/,
    tagLine: /\[(ver|ti|ar|al|offset|by|kuwo):\s*(\S+(?:\s+\S+)*)\s*\]/,
    wordTimeAll: /<(-?\d+),(-?\d+)(?:,-?\d+)?>/g,
    wordTime: /<(-?\d+),(-?\d+)(?:,-?\d+)?>/,
  },
  offset: 1,
  offset2: 1,
  isOK: false,
  lines: [],
  tags: [],
  getWordInfo(str, str2, prevWord) {
    const offset = parseInt(str)
    const offset2 = parseInt(str2)
    let startTime = Math.abs((offset + offset2) / (this.offset * 2))
    let endTime = Math.abs((offset - offset2) / (this.offset2 * 2)) + startTime
    if (prevWord) {
      if (startTime < prevWord.endTime) {
        prevWord.endTime = startTime
        if (prevWord.startTime > prevWord.endTime) {
          prevWord.startTime = prevWord.endTime
        }

        prevWord.newTimeStr = `<${prevWord.startTime},${prevWord.endTime - prevWord.startTime}>`
        // console.log(prevWord)
      }
    }
    return {
      startTime,
      endTime,
      timeStr: `<${startTime},${endTime - startTime}>`,
    }
  },
  parseLine(line) {
    if (line.length < 6) return
    let result = this.rxps.wordLine.exec(line)
    if (result) {
      const time = result[1]
      let words = result[2]
      if (words == null) {
        words = ''
      }
      const wordTimes = words.match(this.rxps.wordTimeAll)
      if (!wordTimes) return
      // console.log(wordTimes)
      let preTimeInfo
      for (const timeStr of wordTimes) {
        const result = this.rxps.wordTime.exec(timeStr)
        const wordInfo = this.getWordInfo(result[1], result[2], preTimeInfo)
        words = words.replace(timeStr, wordInfo.timeStr)
        if (preTimeInfo?.newTimeStr) words = words.replace(preTimeInfo.timeStr, preTimeInfo.newTimeStr)
        preTimeInfo = wordInfo
      }
      this.lines.push(time + words)
      return
    }
    result = this.rxps.tagLine.exec(line)
    if (!result) return
    if (result[1] == 'kuwo') {
      let content = result[2]
      if (content != null && content.includes('][')) {
        content = content.substring(0, content.indexOf(']['))
      }
      const valueOf = parseInt(content, 8)
      this.offset = Math.trunc(valueOf / 10)
      this.offset2 = Math.trunc(valueOf % 10)
      if (this.offset == 0 || Number.isNaN(this.offset) || this.offset2 == 0 || Number.isNaN(this.offset2)) {
        this.isOK = false
      }
    } else {
      this.tags.push(line)
    }
  },
  parse(lrc) {
    // console.log(lrc)
    const lines = lrc.split(/\r\n|\r|\n/)
    const tools = Object.create(this)
    tools.isOK = true
    tools.offset = 1
    tools.offset2 = 1
    tools.lines = []
    tools.tags = []

    for (const line of lines) {
      if (!tools.isOK) throw new Error('failed')
      tools.parseLine(line)
    }
    if (!tools.lines.length) return ''
    let lrcs = tools.lines.join('\n')
    if (tools.tags.length) lrcs = `${tools.tags.join('\n')}\n${lrcs}`
    // console.log(lrcs)
    return lrcs
  },
}
