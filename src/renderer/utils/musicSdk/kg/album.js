import { httpFetch } from '../../request'
import { MusicSdkResponseError } from '../responseError'
import { parseNonEmptyString, parseNonNegativeInt, parseValidCatalogId } from '../utils'
import { getMusicInfosByList } from './musicInfo'
import { createHttpFetch } from './util'

export default {
  limit: 20,
  search(str, page = 1, limit = 20) {
    const req = httpFetch(
      `http://mobilecdn.kugou.com/api/v3/search/album?keyword=${encodeURIComponent(str)}&page=${page}&pagesize=${limit}`,
    )
    const promise = req.promise.then(({ statusCode, body }) => {
      if (statusCode !== 200 || !body || typeof body !== 'object' || Array.isArray(body) || body.status !== 1 || body.errcode !== 0) {
        throw new MusicSdkResponseError()
      }
      if (body.data === null) {
        return { list: [], total: 0, page, limit, source: 'kg' }
      }
      if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) throw new MusicSdkResponseError()
      const total = parseNonNegativeInt(body.data.total)
      if (total === null) throw new MusicSdkResponseError()
      const rawList = body.data.info
      if (!Array.isArray(rawList)) {
        if (total === 0 && rawList == null) return { list: [], total: 0, page, limit, source: 'kg' }
        throw new MusicSdkResponseError()
      }
      const list = rawList.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new MusicSdkResponseError()
        const id = parseValidCatalogId(item.albumid)
        const name = parseNonEmptyString(item.albumname)
        if (!id || !name) throw new MusicSdkResponseError()
        return {
          id,
          name,
          singer: typeof item.singername === 'string' ? item.singername : '',
          img: typeof item.imgurl === 'string' ? item.imgurl.replace('{size}', '480') : '',
          publishTime: typeof item.publishtime === 'string' ? item.publishtime.slice(0, 10) : '',
          songCount: parseNonNegativeInt(item.songcount),
          source: 'kg',
        }
      })
      return {
        list,
        total,
        page,
        limit,
        source: 'kg',
      }
    })
    promise.cancel = () => req.cancelHttp?.()
    return promise
  },
  /**
   * 通过AlbumId获取专辑信息
   * @param {*} id
   */
  async getAlbumInfo(id) {
    const albumInfoRequest = await createHttpFetch('http://kmrserviceretry.kugou.com/container/v1/album?dfid=1tT5He3kxrNC4D29ad1MMb6F&mid=22945702112173152889429073101964063697&userid=0&appid=1005&clientver=11589', {
      method: 'POST',
      body: {
        appid: 1005,
        clienttime: 1681833686,
        clientver: 11589,
        data: [{ album_id: id }],
        fields: 'language,grade_count,intro,mix_intro,heat,category,sizable_cover,cover,album_name,type,quality,publish_company,grade,special_tag,author_name,publish_date,language_id,album_id,exclusive,is_publish,trans_param,authors,album_tag',
        isBuy: 0,
        key: 'e6f3306ff7e2afb494e89fbbda0becbf',
        mid: '22945702112173152889429073101964063697',
        show_album_tag: 0,
      },
    })
    if (!albumInfoRequest) return Promise.reject(new Error('get album info failed.'))
    const albumInfo = albumInfoRequest[0]

    return {
      name: albumInfo.album_name,
      image: albumInfo.sizable_cover.replace('{size}', 240),
      desc: albumInfo.intro,
      authorName: albumInfo.author_name,
      // play_count: this.formatPlayCount(info.count),
    }
  },
  /**
   * 通过AlbumId获取专辑
   * @param {*} id
   * @param {*} page
   */
  async getAlbumDetail(id, page = 1, limit = 200) {
    const albumList = await createHttpFetch(`http://mobiles.kugou.com/api/v3/album/song?version=9108&albumid=${id}&plat=0&pagesize=${limit}&area_code=0&page=${page}&with_res_tag=0`)
    if (!albumList.info) return Promise.reject(new Error('Get album list failed.'))

    let result = await getMusicInfosByList(albumList.info)

    const info = await this.getAlbumInfo(id)

    return {
      list: result || [],
      page,
      limit,
      total: albumList.total,
      source: 'kg',
      info: {
        name: info.name,
        img: info.image,
        desc: info.desc,
        author: info.authorName,
        // play_count: this.formatPlayCount(info.count),
      },
    }
  },
}
