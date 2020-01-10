import { httpFetch } from '../../request'
// import { formatPlayTime } from '../../index'
// import jshtmlencode from 'js-htmlencode'

export default {
  limit: 200,
  list: [
    {
      id: 'mgyyb',
      name: '音乐榜',
      bangid: '23603703',
    },
    {
      id: 'mgysb',
      name: '影视榜',
      bangid: '23603721',
    },
    {
      id: 'mghybnd',
      name: '华语内地榜',
      bangid: '23603926',
    },
    {
      id: 'mghyjqbgt',
      name: '华语港台榜',
      bangid: '23603954',
    },
    {
      id: 'mgomb',
      name: '欧美榜',
      bangid: '23603974',
    },
    {
      id: 'mgrhb',
      name: '日韩榜',
      bangid: '23603982',
    },
    {
      id: 'mgwlb',
      name: '网络榜',
      bangid: '23604058',
    },
    {
      id: 'mgclb',
      name: '彩铃榜',
      bangid: '23604023',
    },
    {
      id: 'mgktvb',
      name: 'KTV榜',
      bangid: '23604040',
    },
    {
      id: 'mgrcb',
      name: '原创榜',
      bangid: '23604032',
    },
  ],
  getUrl(id, page) {
    return `http://m.music.migu.cn/migu/remoting/cms_list_tag?nid=${id}&pageSize=${this.limit}&pageNo=${page - 1}`
  },
  requestObj: null,
  getData(url) {
    if (this.requestObj) this.requestObj.cancelHttp()
    this.requestObj = httpFetch(url)
    return this.requestObj.promise
  },
  filterData(rawList) {
    // console.log(rawList)
    let ids = new Set()
    const list = []
    rawList.forEach(({ songData }) => {
      if (!songData) return
      if (ids.has(songData.copyrightId)) return
      ids.add(songData.copyrightId)

      const types = []
      const _types = {}
      let size = null
      types.push({ type: '128k', size })
      _types['128k'] = {
        size,
      }

      if (songData.hasHQqq === '1') {
        types.push({ type: '320k', size })
        _types['320k'] = {
          size,
        }
      }
      if (songData.hasSQqq === '1') {
        types.push({ type: 'flac', size })
        _types.flac = {
          size,
        }
      }
      // types.reverse()

      list.push({
        singer: songData.singerName.join('、'),
        name: songData.songName,
        // albumName: songData.album_title,
        // albumId: songData.album_id,
        source: 'mg',
        interval: null,
        songmid: songData.copyrightId,
        copyrightId: songData.copyrightId,
        img: songData.picL || songData.M || songData.picS,
        lrc: null,
        types,
        _types,
        typeUrl: {},
      })
    })

    return list
  },
  getList(id, page) {
    let type = this.list.find(s => s.id === id)
    if (!type) return Promise.reject()
    return this.getData(this.getUrl(type.bangid, page)).then(({ statusCode, body }) => {
      if (statusCode !== 200) return Promise.reject(new Error('获取列表失败'))
      const list = this.filterData(body.result.results)
      return {
        total: body.result.totalCount,
        list,
        limit: body.result.pageSize,
        page,
        source: 'mg',
      }
    })
  },
}
