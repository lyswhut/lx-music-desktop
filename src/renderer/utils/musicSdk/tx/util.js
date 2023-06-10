import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'

export const filterMusicInfoItem = item => {
  const types = []
  const _types = {}
  if (item.file.size_128mp3 != 0) {
    let size = sizeFormate(item.file.size_128mp3)
    types.push({ type: '128k', size })
    _types['128k'] = {
      size,
    }
  }
  if (item.file.size_320mp3 !== 0) {
    let size = sizeFormate(item.file.size_320mp3)
    types.push({ type: '320k', size })
    _types['320k'] = {
      size,
    }
  }
  if (item.file.size_flac !== 0) {
    let size = sizeFormate(item.file.size_flac)
    types.push({ type: 'flac', size })
    _types.flac = {
      size,
    }
  }
  if (item.file.size_hires !== 0) {
    let size = sizeFormate(item.file.size_hires)
    types.push({ type: 'flac24bit', size })
    _types.flac24bit = {
      size,
    }
  }

  const albumId = item.album.id ?? ''
  const albumMid = item.album.mid ?? ''
  const albumName = item.album.name ?? ''
  return {
    source: 'tx',
    singer: formatSingerName(item.singer, 'name'),
    name: item.name,
    albumName,
    albumId,
    albumMid,
    interval: formatPlayTime(item.interval),
    songId: item.id,
    songmid: item.mid,
    strMediaMid: item.file.media_mid,
    img: (albumId === '' || albumId === '空')
      ? item.singer?.length ? `https://y.gtimg.cn/music/photo_new/T001R500x500M000${item.singer[0].mid}.jpg` : ''
      : `https://y.gtimg.cn/music/photo_new/T002R500x500M000${albumMid}.jpg`,
    types,
    _types,
    typeUrl: {},
  }
}
