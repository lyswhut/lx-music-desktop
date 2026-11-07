import kw from './kw/index'
import kg from './kg/index'
import tx from './tx/index'
import wy from './wy/index'
import mg from './mg/index'
import git from './git/index'
import { supportQuality } from './api-source'
import { versionChars } from './versionChars'

interface SourceEntry {
  name: string
  id: string
}

interface SourceModule {
  init?: () => Promise<any>
  musicSearch?: {
    search: (keyword: string, page: number, limit: number) => Promise<any>
  }
  [key: string]: any
}

interface SearchMusicParams {
  name: string
  singer?: string
  source?: string
  limit?: number
}

interface FindMusicParams {
  name: string
  singer?: string
  albumName?: string
  interval?: string
  source?: string
}

const sources: Record<string, any> & { sources: SourceEntry[] } = {
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
      name: 'Gitcode',
      id: 'git',
    },
  ],
  kw,
  kg,
  tx,
  wy,
  mg,
  git,
}
const musicSdk: Record<string, any> & { sources: SourceEntry[], init: () => Promise<any[]>, supportQuality: typeof supportQuality, searchMusic: (params: SearchMusicParams) => Promise<any[]>, findMusic: (params: FindMusicParams) => Promise<any[]> } = {
  ...sources,
  async init(): Promise<any[]> {
    const tasks: Array<Promise<any>> = []
    for (let source of sources.sources) {
      let sm: SourceModule | undefined = sources[source.id]
      sm?.init && tasks.push(sm.init())
    }
    return Promise.all(tasks)
  },
  supportQuality,

  async searchMusic({ name, singer, source: s, limit = 25 }: SearchMusicParams): Promise<any[]> {
    const trimStr = (str: any): any => (typeof str == 'string' ? str.trim() : str)
    const musicName = trimStr(name)
    const tasks: Array<Promise<any>> = []
    const excludeSource = ['xm']
    for (const source of sources.sources) {
      if (!sources[source.id].musicSearch || source.id == s || excludeSource.includes(source.id)) { continue }
      tasks.push(
        sources[source.id].musicSearch
          .search(`${musicName} ${singer ?? ''}`.trim(), 1, limit)
          .catch((_: any) => null),
      )
    }
    return (await Promise.all(tasks)).filter((s: any) => s)
  },

  async findMusic({ name, singer, albumName, interval, source: s }: FindMusicParams): Promise<any[]> {
    const lists: any[] = await musicSdk.searchMusic({ name, singer, source: s, limit: 25 })

    const singersRxp = /、|&|;|；|\/|,|，|\|/
    const sortSingle = (singer: string): string =>
      singersRxp.test(singer)
        ? singer
          .split(singersRxp)
          .sort((a: string, b: string) => a.localeCompare(b))
          .join('、')
        : singer || ''
    const sortMusic = (arr: any[], callback: (item: any) => boolean): any[] => {
      const tempResult: any[] = []
      for (let i = arr.length - 1; i > -1; i--) {
        const item = arr[i]
        if (callback(item)) {
          delete item.fSinger
          delete item.fMusicName
          delete item.fAlbumName
          delete item.fInterval
          tempResult.push(item)
          arr.splice(i, 1)
        }
      }
      tempResult.reverse()
      return tempResult
    }
    const getIntv = (interval: string | undefined): number => {
      if (!interval) return 0
      let intvArr = interval.split(':')
      let intv = 0
      let unit = 1
      while (intvArr.length) {
        intv += parseInt(intvArr.pop()!) * unit
        unit *= 60
      }
      return intv
    }
    const trimStr = (str: any): string => (typeof str == 'string' ? str.trim() : str || '')
    const filterStr = (str: any): string =>
      typeof str == 'string'
        ? str.replace(/\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[|!|！/g, '')
        : String(str || '')
    const fMusicName = filterStr(name).toLowerCase()
    const fSinger = filterStr(sortSingle(singer ?? '')).toLowerCase()
    const fAlbumName = filterStr(albumName).toLowerCase()
    const fInterval = getIntv(interval)
    const isEqualsInterval = (intv: number): boolean => Math.abs((fInterval || intv) - (intv || fInterval)) <= 5
    const isEqualsVersionMusicNameChar = (name: string): boolean => {
      for (const char of versionChars) {
        if (name.includes(char) != fMusicName.includes(char)) return false
      }
      return true
    }
    const isIncludesName = (name: string): boolean =>
      (fMusicName.includes(name) || name.includes(fMusicName)) && isEqualsVersionMusicNameChar(name)
    const isIncludesSinger = (singer: string): boolean =>
      fSinger ? fSinger.includes(singer) || singer.includes(fSinger) : true
    const isEqualsAlbum = (album: string): boolean => (fAlbumName ? fAlbumName == album : true)

    const result: any[] = lists
      .map((source: any) => {
        for (const item of source.list) {
          item.name = trimStr(item.name)
          item.singer = trimStr(item.singer)
          item.fSinger = filterStr(sortSingle(item.singer).toLowerCase())
          item.fMusicName = filterStr(String(item.name ?? '').toLowerCase())
          item.fAlbumName = filterStr(String(item.albumName ?? '').toLowerCase())
          item.fInterval = getIntv(item.interval)
          if (!isEqualsInterval(item.fInterval)) {
            item.name = null
            continue
          }
          if (item.fMusicName == fMusicName && isIncludesSinger(item.fSinger)) return item
        }
        for (const item of source.list) {
          if (item.name == null) continue
          if (item.fSinger == fSinger && isIncludesName(item.fMusicName)) return item
        }
        for (const item of source.list) {
          if (item.name == null) continue
          if (
            isEqualsAlbum(item.fAlbumName) &&
            isIncludesSinger(item.fSinger) &&
            isIncludesName(item.fMusicName)
          ) { return item }
        }
        return null
      })
      .filter((s: any) => s)
    const newResult: any[] = []
    if (result.length) {
      newResult.push(
        ...sortMusic(
          result,
          (item: any) =>
            item.fSinger == fSinger && item.fMusicName == fMusicName && item.interval == interval,
        ),
      )
      newResult.push(
        ...sortMusic(
          result,
          (item: any) =>
            item.fMusicName == fMusicName &&
            item.fSinger == fSinger &&
            item.fAlbumName == fAlbumName,
        ),
      )
      newResult.push(
        ...sortMusic(result, (item: any) => item.fSinger == fSinger && item.fMusicName == fMusicName),
      )
      newResult.push(
        ...sortMusic(result, (item: any) => item.fMusicName == fMusicName && item.interval == interval),
      )
      newResult.push(
        ...sortMusic(result, (item: any) => item.fSinger == fSinger && item.interval == interval),
      )
      newResult.push(...sortMusic(result, (item: any) => item.interval == interval))
      newResult.push(...sortMusic(result, (item: any) => item.fMusicName == fMusicName))
      newResult.push(...sortMusic(result, (item: any) => item.fSinger == fSinger))
      newResult.push(...sortMusic(result, (item: any) => item.fAlbumName == fAlbumName))
      for (const item of result) {
        delete item.fSinger
        delete item.fMusicName
        delete item.fAlbumName
        delete item.fInterval
      }
      newResult.push(...result)
    }
    return newResult
  },
}
export default musicSdk
