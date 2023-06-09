import { httpFetch } from '../../request'
import { getMusicInfosByList } from './musicInfo'
import { createHttpFetch } from './util'

export default {
  getInfo(singerid) {
    if (singerid == 0) throw new Error('歌手不存在') // kg源某些歌曲在歌手没被kg收录时返回的歌手id为0
    return createHttpFetch(`http://mobiles.kugou.com/api/v5/singer/info?singerid=${singerid}`).then(body => {
      if (!body) throw new Error('get singer info faild.')

      return {
        source: 'kg',
        id: body.singerid,
        info: {
            name: body.singername,
            desc: body.intro,
            avatar: body.imgurl.replace('{size}', 480),
            gender: body.grade === 1 ? '1' : '2',
        },
        count: {
            music: body.songcount,
            album: body.albumcount,
        }
      }
    })
  },
  getAlbumList(singerid, page, limit) {
    if (singerid == 0) throw new Error('歌手不存在')
    return createHttpFetch(`http://mobiles.kugou.com/api/v5/singer/album?singerid=${singerid}&page=${page}&pagesize=${limit}`).then(body => {
      if (!body.info) throw new Error('get singer album faild.')

      const list = this.filterAlbumList(body.info)
      return {
        source: 'kg',
        list,
        limit,
        page,
        total: body.total,
      }
    })
  },
  async getSongList(singerid, page = 1, limit = 100) {
    if (singerid == 0) throw new Error('歌手不存在')
    const body = await createHttpFetch(`http://mobiles.kugou.com/api/v5/singer/song?singerid=${singerid}&page=${page}&pagesize=${limit}`)
    if (!body.info) throw new Error('get singer song list faild.')

    const list = await getMusicInfosByList(body.info)
    return {
      source: 'kg',
      list,
      limit,
      page,
      total: body.total,
    }
  },
  filterAlbumList(raw) {
    return raw.map(item => {
      return {
        id: item.albumid,
        count: item.songcount,
        info: {
          name: item.albumname,
          author: item.singername,
          img: item.replaceAll('{size}', '480'),
          desc: item.intro,
        },
      }
    })
  },
}

