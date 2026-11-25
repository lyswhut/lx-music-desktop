import { createHttpFetch } from './utils'
import { filterMusicInfoList } from './musicInfo'
import { formatPlayCount } from '../../index'
import { MusicSdkResponseError } from '../responseError'
import { parseNonEmptyString, parseNonNegativeInt, parseValidCatalogId } from '../utils'
import { normalizeMiguImg, searchMiguCatalog } from './singer'

export default {
  limit: 20,
  search(str, page = 1, limit = 20) {
    const req = searchMiguCatalog(str, page, limit, 'album')
    const promise = req.then(body => {
      const data = body.albumResultData
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new MusicSdkResponseError()
      const total = parseNonNegativeInt(data.totalCount)
      if (total === null) throw new MusicSdkResponseError()
      const rawList = data.result
      if (!Array.isArray(rawList)) {
        if (total === 0 && rawList == null) return { list: [], total: 0, page, limit, source: 'mg' }
        throw new MusicSdkResponseError()
      }
      const list = rawList.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        const id = parseValidCatalogId(item.id)
        const name = parseNonEmptyString(item.name)
        if (!id || !name) throw new MusicSdkResponseError()
        return {
          id,
          name,
          singer: typeof item.singer === 'string' ? item.singer : '',
          img: normalizeMiguImg(item.imgItems),
          publishTime: typeof item.publishDate === 'string' ? item.publishDate.trim() : '',
          songCount: parseNonNegativeInt(item.songCount ?? item.totalCount),
          source: 'mg',
        }
      })
      return {
        list,
        total,
        page,
        limit,
        source: 'mg',
      }
    })
    promise.cancel = () => req.cancel?.()
    return promise
  },
  /**
   * 通过AlbumId获取专辑
   * @param {*} id
   * @param {*} page
   */
  async getAlbumDetail(id, page = 1) {
    const list = await createHttpFetch(`http://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/queryAlbumSong?albumId=${id}&pageNo=${page}`)
    if (!list.songList) return Promise.reject(new Error('Get album list error.'))

    const songList = filterMusicInfoList(list.songList)
    const listInfo = await this.getAlbumInfo(id)

    return {
      list: songList || [],
      page,
      limit: listInfo.total,
      total: listInfo.total,
      source: 'mg',
      info: {
        name: listInfo.name,
        img: listInfo.image,
        desc: listInfo.desc,
        author: listInfo.author,
        play_count: listInfo.play_count,
      },
    }
  },
  /**
   * 通过AlbumId获取专辑信息
   * @param {*} id
   * @param {*} page
   */
  async getAlbumInfo(id) {
    const info = await createHttpFetch(`https://app.c.nf.migu.cn/MIGUM3.0/resource/album/v2.0?albumId=${id}`)
    if (!info) return Promise.reject(new Error('Get album info error.'))

    return {
      name: info.title,
      image: info.imgItems.length ? info.imgItems[0].img : null,
      desc: info.summary,
      author: info.singer,
      play_count: formatPlayCount(info.opNumItem.playNum),
      total: info.totalCount,
    }
  },
}
