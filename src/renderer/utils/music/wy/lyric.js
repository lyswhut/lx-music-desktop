import { httpFetch } from '../../request'
import { linuxapi } from './utils/crypto'
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

export default songmid => {
  const requestObj = httpFetch('https://music.163.com/api/linux/forward', {
    method: 'post',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    form: linuxapi({
      method: 'POST',
      url: 'https://music.163.com/api/song/lyric',
      params: {
        id: songmid,
        lv: -1,
        kv: -1,
        tv: -1,
      },
    }),
  })
  requestObj.promise = requestObj.promise.then(({ body }) => {
    if (body.code !== 200 || !body?.lrc?.lyric) return Promise.reject(new Error('Get lyric failed'))
    return {
      lyric: body.lrc.lyric,
      tlyric: body.tlyric.lyric,
      // lxlyric: parseLyric(body.klyric.lyric),
    }
  })
  return requestObj
}

