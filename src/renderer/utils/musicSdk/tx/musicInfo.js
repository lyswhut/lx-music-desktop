import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate } from '../../index'

const getSinger = (singers) => {
  let arr = []
  singers.forEach(singer => {
    arr.push(singer.name)
  })
  return arr.join('、')
}

export default (songmid) => {
  const requestObj = httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
    method: 'post',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
    },
    body: {
      comm: {
        ct: '19',
        cv: '1859',
        uin: '0',
      },
      req: {
        module: 'music.pf_song_detail_svr',
        method: 'get_song_detail_yqq',
        param: {
          song_type: 0,
          song_mid: songmid,
        },
      },
    },
  })
  return requestObj.promise.then(({ body }) => {
    // console.log(body)
    if (body.code != 0 || body.req.code != 0) return Promise.reject(new Error('获取歌曲信息失败'))
    const item = body.req.data.track_info
    if (!item.file?.media_mid) return null

    let types = []
    let _types = {}
    const file = item.file
    if (file.size_128mp3 != 0) {
      let size = sizeFormate(file.size_128mp3)
      types.push({ type: '128k', size })
      _types['128k'] = {
        size,
      }
    }
    if (file.size_320mp3 !== 0) {
      let size = sizeFormate(file.size_320mp3)
      types.push({ type: '320k', size })
      _types['320k'] = {
        size,
      }
    }
    if (file.size_flac !== 0) {
      let size = sizeFormate(file.size_flac)
      types.push({ type: 'flac', size })
      _types.flac = {
        size,
      }
    }
    if (file.size_hires !== 0) {
      let size = sizeFormate(file.size_hires)
      types.push({ type: 'flac24bit', size })
      _types.flac24bit = {
        size,
      }
    }
    // types.reverse()
    let albumId = ''
    let albumName = ''
    if (item.album) {
      albumName = item.album.name
      albumId = item.album.mid
    }
    return {
      singer: getSinger(item.singer),
      name: item.title,
      albumName,
      albumId,
      source: 'tx',
      interval: formatPlayTime(item.interval),
      songId: item.id,
      albumMid: item.album?.mid ?? '',
      strMediaMid: item.file.media_mid,
      songmid: item.mid,
      img: (albumId === '' || albumId === '空')
        ? item.singer?.length ? `https://y.gtimg.cn/music/photo_new/T001R500x500M000${item.singer[0].mid}.jpg` : ''
        : `https://y.gtimg.cn/music/photo_new/T002R500x500M000${albumId}.jpg`,
      types,
      _types,
      typeUrl: {},
    }
  })
}

