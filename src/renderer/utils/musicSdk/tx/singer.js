import { createMusicuFetch, createMusicuFetchs } from './util'
import { filterMusicInfo } from './musicInfo'

export default {
  /**
   * 获取歌手信息
   * @param {*} id
   */
  getInfo(id) {
    return createMusicuFetchs({
      req_1: {
        module: 'music.musichallSinger.SingerInfoInter',
        method: 'GetSingerDetail',
        param: {
          singer_mid: [id],
          ex_singer: 1,
          wiki_singer: 1,
          group_singer: 0,
          pic: 1,
          photos: 0,
        },
      },
      req_2: {
        module: 'music.musichallAlbum.AlbumListServer',
        method: 'GetAlbumList',
        param: {
          singerMid: id,
          order: 0,
          begin: 0,
          num: 1,
          songNumTag: 0,
          singerID: 0,
        },
      },
      req_3: {
        module: 'musichall.song_list_server',
        method: 'GetSingerSongList',
        param: {
          singerMid: id,
          order: 1,
          begin: 0,
          num: 1,
        },
      },
    }).then(body => {
      if (body.req_1.code != 0 || body.req_2.code != 0 || body.req_3.code != 0) throw new Error('get singer info faild.')

      const info = body.req_1.data.singer_list[0]
      const music = body.req_3.data
      const album = body.req_3.data
      return {
        source: 'tx',
        id: info.basic_info.singer_mid,
        info: {
          name: info.basic_info.name,
          desc: info.ex_info.desc,
          avatar: info.pic.pic,
          gender: info.ex_info.genre === 1 ? 'man' : 'woman',
        },
        count: {
          music: music.totalNum,
          album: album.total,
        },
      }
    })
  },
  /**
   * 获取歌手专辑列表
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  getAlbumList(id, page = 1, limit = 10) {
    if (page === 1) page = 0
    return createMusicuFetch({
      module: 'music.musichallAlbum.AlbumListServer',
      method: 'GetAlbumList',
      param: {
        singerMid: id,
        order: 0,
        begin: page * limit,
        num: limit,
        songNumTag: 0,
        singerID: 0,
      },
    }).then(body => {
      if (!body.albumList) throw new Error('get singer album faild.')

      const list = this.filterAlbumList(body.albumList)
      return {
        source: 'tx',
        list,
        limit,
        page,
        total: body.total,
      }
    })
  },
  /**
   * 获取歌手歌曲列表
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  async getSongList(id, page = 1, limit = 100) {
    if (page === 1) page = 0
    return createMusicuFetch({
      module: 'musichall.song_list_server',
      method: 'GetSingerSongList',
      param: {
        singerMid: id,
        order: 1,
        begin: page * limit,
        num: limit,
      },
    }).then(body => {
      if (!body.albumList) throw new Error('get singer song list faild.')

      const list = this.filterSongList(body.songList)
      return {
        source: 'tx',
        list,
        limit,
        page,
        total: body.totalNum,
      }
    })
  },
  filterAlbumList(raw) {
    return raw.map(item => {
      return {
        id: item.albumID,
        mid: item.albumMid,
        count: item.totalNum,
        info: {
          name: item.albumName,
          author: item.singerName,
          img: `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.albumMid}.jpg`,
          desc: null,
        },
      }
    })
  },
  filterSongList(raw) {
    const list = []
    raw.forEach(item => {
      list.push(filterMusicInfo(item.songInfo))
    })
    return list
  }
}

