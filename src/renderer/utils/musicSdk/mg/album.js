import { createHttpFetch } from './utils'
import { filterMusicInfoList } from './musicInfo'
import { formatPlayCount } from '../../index'

export default {
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
