import { MusicSdkResponseError } from '../responseError'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'
import { signRequest } from './utils'

export const buildSearchComm = () => ({
  _channelid: '0',
  _os_version: '6.2.9200-2',
  ct: '19',
  cv: '2151',
  guid: '1F70E520B2EAA7D25E11760783C53CA9',
  patch: '118',
  psrf_access_token_expiresAt: 0,
  psrf_qqaccess_token: '',
  psrf_qqopenid: '',
  psrf_qqunionid: '',
  tmeAppID: 'qqmusic',
  tmeLoginType: 0,
  uin: '0',
  wid: '7223299733393904640',
})

/**
 * PC 客户端版 searchid：32 位大写十六进制 GUID + 5 位补零随机数 = 37 字符。
 * 对应 QQ 音乐 PC 端 searchid 形状（服务端只需要唯一的会话 ID，形状一致即可）。
 */
export const getTxSearchId = () => {
  let guid = ''
  for (let i = 0; i < 32; i++) guid += Math.floor(Math.random() * 16).toString(16)
  return guid.toUpperCase() + String(Math.floor(Math.random() * 100000)).padStart(5, '0')
}

export default {
  limit: 50,
  total: 0,
  page: 0,
  allPage: 1,
  successCode: 0,
  musicSearch(str, page, limit, retryNum = 0, cancelState = { cancelled: false, request: null }) {
    if (cancelState.cancelled) return Promise.reject(new Error('request cancelled'))
    const searchRequest = signRequest({
      comm: buildSearchComm(),
      'music.search.SearchCgiService': {
        module: 'music.search.SearchCgiService',
        method: 'DoSearchForQQMusicDesktop',
        param: {
          grp: 1,
          num_per_page: limit,
          page_num: page,
          query: str,
          remoteplace: 'txt.newclient.top',
          search_type: 0,
          searchid: this.getSearchId(),
        },
      },
    })
    cancelState.request = searchRequest
    const promise = searchRequest.then(({ body }) => {
      if (cancelState.cancelled) throw new Error('request cancelled')
      // console.log(body)
      const req = body?.['music.search.SearchCgiService'] ?? body?.req
      if (!req || typeof body.code !== 'number' || typeof req.code !== 'number') throw new MusicSdkResponseError()
      if (body.code !== this.successCode || req.code !== this.successCode) {
        const err = new Error(`搜索失败 (code=${body.code}/${req.code})`)
        err.bodyCode = body.code
        err.reqCode = req.code
        throw err
      }
      const data = req.data
      if (!Array.isArray(data?.body?.song?.list) || !Number.isFinite(data?.meta?.sum) || data.meta.sum < 0) throw new MusicSdkResponseError()
      return data
    })
    promise.cancel = () => {
      cancelState.cancelled = true
      cancelState.request?.cancel?.()
    }
    return promise
  },
  getSearchId() {
    return getTxSearchId()
  },
  handleResult(rawList) {
    // console.log(rawList)
    if (!rawList || !Array.isArray(rawList)) return []
    const list = []
    rawList.forEach(item => {
      if (!item.file?.media_mid) return

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
      list.push({
        singer: formatSingerName(item.singer, 'name'),
        artists: item.singer?.map(artist => ({ id: artist.mid, name: artist.name })),
        // name: item.name + (item.title_extra ?? ''),
        name: item.title,
        albumName,
        albumId,
        source: 'tx',
        interval: item.interval ? formatPlayTime(item.interval) : null,
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
      })
    })
    // console.log(list)
    return list
  },
  search(str, page = 1, limit) {
    if (limit == null) limit = this.limit
    const cancelState = { cancelled: false, request: null }
    const request = this.musicSearch(str, page, limit, 0, cancelState)
    const promise = request.then(({ body, meta }) => {
      let list = this.handleResult(body.song.list)

      this.total = meta.sum
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        limit,
        total: this.total,
        source: 'tx',
      })
    })
    promise.cancel = () => {
      cancelState.cancelled = true
      cancelState.request?.cancel?.()
    }
    return promise
  },
}
