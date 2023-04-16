import { httpFetch } from '../../request'
import { sizeFormate } from '../../index'

const getSinger = (singers) => {
  let arr = []
  singers?.forEach(singer => {
    arr.push(singer.name)
  })
  return arr.join('、')
}

export const filterMusicInfoData = (rawList) => {
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
      singer: getSinger(item.artists),
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
  // console.log(list)
  return list
}

export const getMusicInfos = (copyrightIds, retry = 0) => {
  if (++retry > 2) return Promise.reject(new Error('Failed to get music info try max'))
  return httpFetch('https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?resourceType=2', {
    method: 'POST',
    form: {
      resourceId: copyrightIds.join('|'),
    },
  }).promise.then(({ body }) => {
    if (!body) return getMusicInfos(copyrightIds, retry)
    if (body.code !== '000000') return Promise.reject(new Error('Failed to get music info'))
    return filterMusicInfoData(body.resource)
  })
}

export const getMusicInfo = (copyrightId) => {
  return getMusicInfos([copyrightId]).then(([musicInfo]) => {
    if (musicInfo) return musicInfo
    throw new Error('failed')
  })
}
