import { httpFetch } from '../../request'
// import { formatPlayTime } from '../../index'
// import jshtmlencode from 'js-htmlencode'

export default {
  limit: 20,
  list: [
    {
      id: 'bdrgb',
      name: '热歌榜',
      bangid: '2',
    },
    {
      id: 'bdxgb',
      name: '新歌榜',
      bangid: '1',
    },
    {
      id: 'bdycb',
      name: '原创榜',
      bangid: '200',
    },
    {
      id: 'bdhyjqb',
      name: '华语榜',
      bangid: '20',
    },
    {
      id: 'bdomjqb',
      name: '欧美榜',
      bangid: '21',
    },
    {
      id: 'bdwugqb',
      name: '网络榜',
      bangid: '25',
    },
    {
      id: 'bdjdlgb',
      name: '老歌榜',
      bangid: '22',
    },
    {
      id: 'bdysjqb',
      name: '影视金曲榜',
      bangid: '24',
    },
    {
      id: 'bdqgdcb',
      name: '情歌对唱榜',
      bangid: '23',
    },
    {
      id: 'bdygb',
      name: '摇滚榜',
      bangid: '11',
    },
  ],
  getUrl(id, p) {
    return `http://musicmini.qianqian.com/2018/static/bangdan/bangdanList_${id}_${p}.html`
  },
  regExps: {
    item: /data-song="({.+?})"/g,
    info: /{total[\s:]+"(\d+)", size[\s:]+"(\d+)", page[\s:]+"(\d+)"}/,
  },
  requestObj: null,
  getData(url) {
    if (this.requestObj) this.requestObj.cancelHttp()
    this.requestObj = httpFetch(url)
    return this.requestObj.promise
  },
  filterData(rawList) {
    // console.log(rawList)
    return rawList.map(item => {
      const types = []
      const _types = {}
      let size = null
      types.push({ type: '128k', size })
      _types['128k'] = {
        size,
      }
      if (item.biaoshi) {
        types.push({ type: '320k', size })
        _types['320k'] = {
          size,
        }
        types.push({ type: 'flac', size })
        _types.flac = {
          size,
        }
      }
      // types.reverse()

      return {
        singer: item.song_artist.replace(',', '、'),
        name: item.song_title,
        albumName: item.album_title,
        albumId: item.album_id,
        source: 'bd',
        interval: '',
        songmid: item.song_id,
        img: null,
        lrc: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  parseData(rawData) {
    // return rawData.map(item => JSON.parse(item.replace(this.regExps.item, '$1').replace(/&quot;/g, '"').replace(/\\\//g, '/').replace(/(@s_1,w_)\d+(,h_)\d+/, '$1500$2500')))
    return rawData.map(item => JSON.parse(item.replace(this.regExps.item, '$1').replace(/&quot;/g, '"').replace(/\\\//g, '/')))
  },
  getList(id, page) {
    let type = this.list.find(s => s.id === id)
    if (!type) return Promise.reject()
    return this.getData(this.getUrl(type.bangid, page)).then(({ body }) => {
      let result = body.match(this.regExps.item)
      if (!result) return Promise.reject(new Error('匹配list失败'))
      let info = body.match(this.regExps.info)
      if (!info) return Promise.reject(new Error('匹配info失败'))
      const list = this.filterData(this.parseData(result))
      this.limit = parseInt(info[2])
      return {
        total: parseInt(info[1]),
        list,
        limit: this.limit,
        page: parseInt(info[3]),
        source: 'bd',
      }
    })
  },
}
