import { sizeFormate, formatPlayTime } from '../../index'
import { createHttpFetch } from './utils'
import { formatSingerName } from '../utils'

const createGetMusicInfosTask = async(ids: string[]): Promise<any[]> => {
  let list: string[] = ids
  const tasks: string[][] = []
  while (list.length) {
    tasks.push(list.slice(0, 100))
    if (list.length < 100) break
    list = list.slice(100)
  }
  let url = 'https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?resourceType=2'
  return Promise.all(
    tasks.map(async(task) =>
      createHttpFetch(url, {
        method: 'POST',
        form: {
          resourceId: task.join('|'),
        },
      }).then((data: any) => data.resource),
    ),
  )
}

export const filterMusicInfoList = (rawList: any[]): any[] => {
  // console.log(rawList)
  let ids = new Set<string>()
  const list: any[] = []
  rawList.forEach((item: any) => {
    if (!item.songId || ids.has(item.songId)) return
    ids.add(item.songId)
    const types: any[] = []
    const _types: Record<string, any> = {}
    item.newRateFormats?.forEach((type: any) => {
      let size: string
      switch (type.formatType) {
        case 'PQ':
          size = sizeFormate(type.size ?? type.androidSize)
          types.push({ type: '128k', size })
          _types['128k'] = {
            size,
          }
          break
        case 'HQ':
          size = sizeFormate(type.size ?? type.androidSize)
          types.push({ type: '320k', size })
          _types['320k'] = {
            size,
          }
          break
        case 'SQ':
          size = sizeFormate(type.size ?? type.androidSize)
          types.push({ type: 'flac', size })
          _types.flac = {
            size,
          }
          break
        case 'ZQ':
          size = sizeFormate(type.size ?? type.androidSize)
          types.push({ type: 'hires', size })
          _types.hires = {
            size,
          }
          break
      }
    })

    const intervalTest = /(\d\d:\d\d)$/.test(item.length)

    list.push({
      singer: formatSingerName(item.artists, 'name'),
      name: item.songName,
      albumName: item.album,
      albumId: item.albumId,
      songmid: item.songId,
      copyrightId: item.copyrightId,
      source: 'mg',
      interval: intervalTest ? RegExp.$1 : null,
      img: item.albumImgs?.length ? item.albumImgs[0].img : null,
      lrc: null,
      lrcUrl: item.lrcUrl,
      mrcUrl: item.mrcUrl,
      trcUrl: item.trcUrl,
      otherSource: null,
      types,
      _types,
      typeUrl: {},
    })
  })
  return list
}

export const filterMusicInfoListV5 = (rawList: any[]): any[] => {
  // console.log(rawList)
  let ids = new Set<string>()
  const list: any[] = []
  rawList.forEach((item: any) => {
    if (!item.songId || ids.has(item.songId)) return
    ids.add(item.songId)
    const types: any[] = []
    const _types: Record<string, any> = {}
    item.audioFormats?.forEach((type: any) => {
      let size: string
      switch (type.formatType) {
        case 'PQ':
          size = sizeFormate(type.size ?? type.androidSize)
          types.push({ type: '128k', size })
          _types['128k'] = {
            size,
          }
          break
        case 'HQ':
          size = sizeFormate(type.size ?? type.androidSize)
          types.push({ type: '320k', size })
          _types['320k'] = {
            size,
          }
          break
        case 'SQ':
          size = sizeFormate(type.size ?? type.androidSize)
          types.push({ type: 'flac', size })
          _types.flac = {
            size,
          }
          break
        case 'ZQ':
          size = sizeFormate(type.size ?? type.androidSize)
          types.push({ type: 'hires', size })
          _types.hires = {
            size,
          }
          break
      }
    })

    list.push({
      singer: formatSingerName(item.singerList, 'name'),
      name: item.songName,
      albumName: item.album,
      albumId: item.albumId,
      songmid: item.songId,
      copyrightId: item.copyrightId,
      source: 'mg',
      interval: formatPlayTime(item.duration),
      img: item.img3 || item.img2 || item.img1 || null,
      lrc: null,
      lrcUrl: item.lrcUrl,
      mrcUrl: item.mrcUrl,
      trcUrl: item.trcUrl,
      otherSource: null,
      types,
      _types,
      typeUrl: {},
    })
  })
  return list
}

export const getMusicInfo = async(copyrightId: string): Promise<any> => {
  return getMusicInfos([copyrightId]).then((data: any[]) => data[0])
}

export const getMusicInfos = async(copyrightIds: string[]): Promise<any[]> => {
  return filterMusicInfoList(
    await createGetMusicInfosTask(copyrightIds).then((data: any[][]) => data.flat()),
  )
}
