import { sizeFormate } from '../../index'
import { createHttpFetch } from './utils'
import { formatSingerName } from '../utils'

const createGetMusicInfosTask = (ids) => {
  let list = ids
  let tasks = []
  while (list.length) {
    tasks.push(list.slice(0, 100))
    if (list.length < 100) break
    list = list.slice(100)
  }
  let url = 'https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?resourceType=2'
  return Promise.all(tasks.map(task => createHttpFetch(url, {
    method: 'POST',
    form: {
      resourceId: task.join('|'),
    },
  }).then(data => data.resource)))
}

export const filterMusicInfoList = (rawList) => {
  // console.log(rawList)
  let ids = new Set()
  const list = []
  rawList.forEach(item => {
    if (!item.songId || ids.has(item.songId)) return
    ids.add(item.songId)
    const types = []
    const _types = {}
    item.newRateFormats?.forEach(type => {
      let size
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
          types.push({ type: 'flac24bit', size })
          _types.flac24bit = {
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

export const getMusicInfo = async(copyrightId) => {
  return getMusicInfos([copyrightId]).then(data => data[0])
}

export const getMusicInfos = async(copyrightIds) => {
  return filterMusicInfoList(await Promise.all(createGetMusicInfosTask(copyrightIds)).then(data => data.flat()))
}
