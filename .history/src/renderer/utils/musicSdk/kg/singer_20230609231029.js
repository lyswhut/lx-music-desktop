import { httpFetch } from '../../request'
import { getMusicInfosByList } from './musicInfo'
import { createHttpFetch } from './util'

export default {
  async getInfo(singerid) {
    if (singerid == 0) throw new Error('歌手不存在') // kg源某些歌曲在歌手没被kg收录时返回的歌手id为0

    const requestObj = httpFetch(`http://mobiles.kugou.com/api/v5/singer/info?singerid=${singerid}`)
    let { body, statusCode } = await requestObj.promise
    if (statusCode !== 200) throw new Error('获取歌手信息失败')
    return {
      source: 'kg',
      singerid,
      info: {
        name: body.data.singername,
        desc: body.data.intro,
        img: body.data.imgurl.replace('{size}', '480'),
      },
    }
  },
  async getSongList(singerid, page, limit) {
    if (singerid == 0) throw new Error('歌手不存在') // kg源某些歌曲在歌手没被kg收录时返回的歌手id为0

    const requestObj = httpFetch(`http://mobiles.kugou.com/api/v5/singer/song?singerid=${singerid}&page=${page}&pagesize=${limit}`)
    let { body, statusCode } = await requestObj.promise
    if (statusCode !== 200) throw new Error('获取歌手歌曲列表失败')
    let listData = await getMusicInfosByList(body.data.info)
    return {
      source: 'kg',
      list: listData,
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

