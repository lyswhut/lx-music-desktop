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
  async getSongList(singerid, page = 1, limit = 100) {
    if (singerid == 0) throw new Error('歌手不存在') // kg源某些歌曲在歌手没被kg收录时返回的歌手id为0

    const body = await createHttpFetch(`http://mobiles.kugou.com/api/v5/singer/song?singerid=${singerid}&page=${page}&pagesize=${limit}`)
    if (!body.data.info) throw new Error('get singer song list faild.')

    const list = getMusicInfosByList(body.data.info)
    return {
      source: 'kg',
      list,
      id: `kg__singer_${singerid}`,
      singerid,
      total: body.data.total,
      allPage: Math.ceil(body.data.total / limit),
    }
  },
  async getAlbumList(singerid, page, limit) {
    if (singerid == 0) throw new Error('歌手不存在') // kg源某些歌曲在歌手没被kg收录时返回的歌手id为0

    const requestObj = httpFetch(`http://mobiles.kugou.com/api/v5/singer/song?singerid=${singerid}&page=${page}&pagesize=${limit}`)
    let { body, statusCode } = await requestObj.promise
    if (statusCode !== 200) throw new Error('获取歌手专辑列表失败')
    return {
      source: 'kg',
      albums: this.filterAlbum(body.data.info),
      singerid,
    }
  },
  filterAlbumList(raw) {
    const list = []
    raw.forEach((albumInfo) => {
      list.push({
        name: albumInfo.albumname,
        author: albumInfo.singername,
        img: albumInfo.replaceAll('{size}', '480'),
        album_id: albumInfo.albumid,
      })
    })
    return list
  },
}

