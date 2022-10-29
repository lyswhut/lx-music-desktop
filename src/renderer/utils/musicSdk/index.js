import kw from './kw/index'
import kg from './kg/index'
import tx from './tx/index'
import wy from './wy/index'
import mg from './mg/index'
import bd from './bd/index'
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
    const tasks = []
    for (let source of sources.sources) {
      let sm = sources[source.id]
      sm && sm.init && tasks.push(sm.init())
    }
    return Promise.all(tasks)
  },
  supportQuality,

  async findMusic({ name, singer, albumName, interval, source: s }) {
    const tasks = []
    const singersRxp = /、|&|;|；|\/|,|，|\|/
    const sortSingle = singer => singersRxp.test(singer)
      ? singer.split(singersRxp).sort((a, b) => a.localeCompare(b)).join('、')
      : singer
    const sortMusic = (arr, callback) => {
      const tempResult = []
      for (let i = arr.length - 1; i > -1; i--) {
        const item = arr[i]
        if (callback(item)) {
          delete item.sortedSinger
          delete item.lowerCaseName
          delete item.lowerCaseAlbumName
          tempResult.push(item)
          arr.splice(i, 1)
        }
      }
      tempResult.reverse()
      return tempResult
    }
    const trimStr = str => typeof str == 'string' ? str.trim() : str
    const filterStr = str => typeof str == 'string' ? str.replace(/\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[/g, '') : str
    const musicName = trimStr(name)
    const sortedSinger = filterStr(String(sortSingle(singer)).toLowerCase())
    const lowerCaseName = filterStr(String(musicName).toLowerCase())
    const lowerCaseAlbumName = filterStr(String(albumName).toLowerCase())
    const excludeSource = ['xm']
    for (const source of sources.sources) {
      if (!sources[source.id].musicSearch || source.id == s || excludeSource.includes(source.id)) continue

      tasks.push(sources[source.id].musicSearch.search(`${musicName} ${singer || ''}`.trim(), 1, 25).then(res => {
        for (const item of res.list) {
          item.name = trimStr(item.name)
          item.sortedSinger = filterStr(String(sortSingle(item.singer)).toLowerCase())
          item.lowerCaseName = filterStr(String(item.name ?? '').toLowerCase())
          item.lowerCaseAlbumName = filterStr(String(item.albumName ?? '').toLowerCase())
          // console.log(lowerCaseName, item.lowerCaseName, item.source)
          if (
            (
              item.sortedSinger == sortedSinger && item.lowerCaseName == lowerCaseName
            ) ||
            (
              (interval ? item.interval == interval : true) && item.lowerCaseName == lowerCaseName &&
              (item.sortedSinger.includes(sortedSinger) || sortedSinger.includes(item.sortedSinger))
            ) ||
            (
              item.lowerCaseName == lowerCaseName && (lowerCaseAlbumName ? item.lowerCaseAlbumName == lowerCaseAlbumName : true) &&
              (interval ? item.interval == interval : true)
            ) ||
            (
              item.lowerCaseName == lowerCaseName && (lowerCaseAlbumName ? item.lowerCaseAlbumName == lowerCaseAlbumName : true) &&
              (item.sortedSinger.includes(sortedSinger) || sortedSinger.includes(item.sortedSinger))
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
      newResult.push(...sortMusic(result, item => item.sortedSinger == sortedSinger && item.lowerCaseName == lowerCaseName && item.interval == interval))
      newResult.push(...sortMusic(result, item => item.lowerCaseName == lowerCaseName && item.sortedSinger == sortedSinger && item.lowerCaseAlbumName == lowerCaseAlbumName))
      newResult.push(...sortMusic(result, item => item.sortedSinger == sortedSinger && item.lowerCaseName == lowerCaseName))
      newResult.push(...sortMusic(result, item => item.sortedSinger == sortedSinger && item.interval == interval))
      for (const item of result) {
        delete item.sortedSinger
        delete item.lowerCaseName
        delete item.lowerCaseAlbumName
      }
      newResult.push(...result)
    }
    // console.log(newResult)
    return newResult
  },
}
