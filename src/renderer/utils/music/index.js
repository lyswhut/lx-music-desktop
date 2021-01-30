import kw from './kw'
import kg from './kg'
import tx from './tx'
import wy from './wy'
import mg from './mg'
import bd from './bd'
import xm from './xm'
import { supportQuality } from './api-source'


const sources = {
  sources: [
    {
      name: '酷我音乐',
      id: 'kw',
    },
    {
      name: '酷狗音乐',
      id: 'kg',
    },
    {
      name: 'QQ音乐',
      id: 'tx',
    },
    {
      name: '网易音乐',
      id: 'wy',
    },
    {
      name: '咪咕音乐',
      id: 'mg',
    },
    {
      name: '虾米音乐',
      id: 'xm',
    },
    // {
    //   name: '百度音乐',
    //   id: 'bd',
    // },
  ],
  kw,
  kg,
  tx,
  wy,
  mg,
  bd,
  xm,
}
export default {
  ...sources,
  init() {
    for (let source of sources.sources) {
      let sm = sources[source.id]
      sm && sm.init && sm.init()
    }
  },
  supportQuality,

  async findMusic(musicInfo) {
    const tasks = []
    const sortSingle = singer => singer.includes('、') ? singer.split('、').sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0)).join('、') : singer
    const sortMusic = (arr, callback) => {
      const tempResult = []
      for (let i = arr.length - 1; i > -1; i--) {
        const item = arr[i]
        if (callback(item)) {
          delete item.sortedSinger
          tempResult.push(item)
          arr.splice(i, 1)
        }
      }
      tempResult.reverse()
      return tempResult
    }
    const trimStr = str => typeof str == 'string' ? str.trim() : str
    const sortedSinger = sortSingle(musicInfo.singer)
    const musicName = trimStr(musicInfo.name)
    for (const source of sources.sources) {
      if (!sources[source.id].musicSearch || source.id === musicInfo.source || source.id === 'xm') continue

      tasks.push(sources[source.id].musicSearch.search(`${musicName} ${musicInfo.singer || ''}`.trim(), 1, { limit: 10 }).then(res => {
        for (const item of res.list) {
          item.sortedSinger = sortSingle(item.singer)
          item.name = trimStr(item.name)
          if (
            (
              item.sortedSinger === sortedSinger &&
              (item.name === musicName || item.interval === musicInfo.interval)
            ) ||
            (
              item.interval === musicInfo.interval && item.name === musicName &&
              (item.sortedSinger.includes(sortedSinger) || sortedSinger.includes(item.sortedSinger))
            ) ||
            (
              item.name === musicName && item.albumName === musicInfo.albumName &&
              item.interval === musicInfo.interval
            )
          ) {
            return item
          }
        }
        return null
      }).catch(_ => null))
    }
    const result = (await Promise.all(tasks)).filter(s => s)
    const newResult = []
    if (result.length) {
      newResult.push(...sortMusic(result, item => item.sortedSinger === sortedSinger && item.name === musicName && item.interval === musicInfo.interval))
      newResult.push(...sortMusic(result, item => item.sortedSinger === sortedSinger && item.interval === musicInfo.interval))
      newResult.push(...sortMusic(result, item => item.name === musicName && item.sortedSinger === sortedSinger && item.albumName === musicInfo.albumName))
      newResult.push(...sortMusic(result, item => item.sortedSinger === sortedSinger && item.name === musicName))
      for (const item of result) {
        delete item.sortedSinger
      }
      newResult.push(...result)
    }
    // console.log(newResult)
    return newResult
  },
}
