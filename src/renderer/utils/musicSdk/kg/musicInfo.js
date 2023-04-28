import { decodeName, formatPlayTime, sizeFormate } from '../../index'
import { createHttpFetch } from './util'

const createGetMusicInfosTask = (hashs) => {
  let data = {
    appid: 1001,
    clienttime: 639437935,
    clientver: 9020,
    fields: 'album_info,author_name,audio_info,ori_audio_name',
    is_publish: '1',
    key: '0475af1457cd3363c7b45b871e94428a',
    mid: '21511157a05844bd085308bc76ef3342',
    show_privilege: 1,
  }
  let list = hashs
  let tasks = []
  while (list.length) {
    tasks.push(Object.assign({ data: list.slice(0, 100) }, data))
    if (list.length < 100) break
    list = list.slice(100)
  }
  let url = 'http://kmr.service.kugou.com/v2/album_audio/audio'
  return tasks.map(task => createHttpFetch(url, {
    method: 'POST',
    body: task,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
    },
  }).then(data => data.map(s => s[0])))
}

export const filterMusicInfoList = (rawList) => {
  // console.log(rawList)
  let ids = new Set()
  let list = []
  rawList.forEach(item => {
    if (!item) return
    if (ids.has(item.audio_info.audio_id)) return
    ids.add(item.audio_info.audio_id)
    const types = []
    const _types = {}
    if (item.audio_info.filesize !== '0') {
      let size = sizeFormate(parseInt(item.audio_info.filesize))
      types.push({ type: '128k', size, hash: item.audio_info.hash })
      _types['128k'] = {
        size,
        hash: item.audio_info.hash,
      }
    }
    if (item.audio_info.filesize_320 !== '0') {
      let size = sizeFormate(parseInt(item.audio_info.filesize_320))
      types.push({ type: '320k', size, hash: item.audio_info.hash_320 })
      _types['320k'] = {
        size,
        hash: item.audio_info.hash_320,
      }
    }
    if (item.audio_info.filesize_flac !== '0') {
      let size = sizeFormate(parseInt(item.audio_info.filesize_flac))
      types.push({ type: 'flac', size, hash: item.audio_info.hash_flac })
      _types.flac = {
        size,
        hash: item.audio_info.hash_flac,
      }
    }
    if (item.audio_info.filesize_high !== '0') {
      let size = sizeFormate(parseInt(item.audio_info.filesize_high))
      types.push({ type: 'flac24bit', size, hash: item.audio_info.hash_high })
      _types.flac24bit = {
        size,
        hash: item.audio_info.hash_high,
      }
    }
    list.push({
      singer: decodeName(item.author_name),
      name: decodeName(item.ori_audio_name),
      albumName: decodeName(item.album_info.album_name),
      albumId: item.album_info.album_id,
      songmid: item.audio_info.audio_id,
      source: 'kg',
      interval: formatPlayTime(parseInt(item.audio_info.timelength) / 1000),
      img: null,
      lrc: null,
      hash: item.audio_info.hash,
      otherSource: null,
      types,
      _types,
      typeUrl: {},
    })
  })
  return list
}

export const getMusicInfos = async(hashs) => {
  return filterMusicInfoList(await Promise.all(createGetMusicInfosTask(hashs)).then(data => data.flat()))
}

export const getMusicInfo = async(hash) => {
  return getMusicInfos([hash]).then(data => data[0])
}

export const getMusicInfosByList = (list) => {
  return getMusicInfos(list.map(item => ({ hash: item.hash })))
}
