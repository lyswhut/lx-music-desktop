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
    for (const source of sources.sources) {
      if (!sources[source.id].musicSearch || source.id === musicInfo.source || source.id === 'xm') continue
      const sortedSinger = musicInfo.singer.includes('、') ? musicInfo.singer.split('、').sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0)).join('、') : null

      tasks.push(sources[source.id].musicSearch.search(`${musicInfo.name} ${musicInfo.singer || ''}`.trim(), 1, { limit: 10 }).then(res => {
        for (const item of res.list) {
          if (
            (
              item.singer === musicInfo.singer &&
              (item.name === musicInfo.name || item.interval === musicInfo.interval)
            ) ||
            (
              item.interval === musicInfo.interval && item.name === musicInfo.name &&
              (item.singer.includes(musicInfo.singer) || musicInfo.singer.includes(item.singer))
            ) ||
            (
              sortedSinger &&
              item.singer.includes('、') &&
              item.singer.split('、').sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0)).join('、') === sortedSinger
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
      for (let i = result.length - 1; i > -1; i--) {
        const item = result[i]
        if (item.singer === musicInfo.singer && item.name === musicInfo.name && item.interval === musicInfo.interval) {
          newResult.push(item)
          result.splice(i, 1)
        }
      }
      for (let i = result.length - 1; i > -1; i--) {
        const item = result[i]
        if (item.singer === musicInfo.singer && item.interval === musicInfo.interval) {
          newResult.push(item)
          result.splice(i, 1)
        }
      }
      for (let i = result.length - 1; i > -1; i--) {
        const item = result[i]
        if (item.name === musicInfo.name && item.singer === musicInfo.singer && item.albumName === musicInfo.albumName) {
          newResult.push(item)
          result.splice(i, 1)
        }
      }
      for (let i = result.length - 1; i > -1; i--) {
        const item = result[i]
        if (item.singer === musicInfo.singer && item.name === musicInfo.name) {
          newResult.push(item)
          result.splice(i, 1)
        }
      }
      newResult.reverse()
      newResult.push(...result)
    }
    // console.log(newResult)
    return newResult
  },
}
