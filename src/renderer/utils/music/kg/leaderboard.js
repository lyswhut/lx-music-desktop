import { httpGet, cancelHttp } from '../../request'
import { formatPlayTime } from '../../index'

export default {
  list: [
    {
      id: 'kgtop500',
      name: '酷狗TOP500',
      bangid: '8888',
    },
    {
      id: 'kgwlhgb',
      name: '网络红歌榜',
      bangid: '23784',
    },
    {
      id: 'kgbsb',
      name: '飙升榜',
      bangid: '6666',
    },
    {
      id: 'kgfxb',
      name: '分享榜',
      bangid: '21101',
    },
    {
      id: 'kgcyyb',
      name: '纯音乐榜',
      bangid: '33164',
    },
    {
      id: 'kggfjqb',
      name: '古风金曲榜',
      bangid: '33161',
    },
    {
      id: 'kgyyjqb',
      name: '粤语金曲榜',
      bangid: '33165',
    },
    {
      id: 'kgomjqb',
      name: '欧美金曲榜',
      bangid: '33166',
    },
    // {
    //   id: 'kgdyrgb',
    //   name: '电音热歌榜',
    //   bangid: '33160',
    // },
    // {
    //   id: 'kgjdrgb',
    //   name: 'DJ热歌榜',
    //   bangid: '24971',
    // },
    // {
    //   id: 'kghyxgb',
    //   name: '华语新歌榜',
    //   bangid: '31308',
    // },
  ],
  getUrl(p, id) {
    return `http://www2.kugou.kugou.com/yueku/v9/rank/home/${p}-${id}.html`
  },
  regExps: {
    total: /total: '(\d+)',/,
    page: /page: '(\d+)',/,
    limit: /pagesize: '(\d+)',/,
    listData: /global\.features = (\[.+\]);/,
  },
  _cancelIndex: null,
  _cancelPromiseCancelFn: null,
  getData(url) {
    if (this._cancelIndex != null) {
      cancelHttp(this._cancelIndex)
      this._cancelPromiseCancelFn(new Error('取消http请求'))
    }
    return new Promise((resolve, reject) => {
      this._cancelPromiseCancelFn = reject
      this._cancelIndex = httpGet(url, (err, resp, body) => {
        this._cancelIndex = null
        this._cancelPromiseCancelFn = null
        if (err) {
          console.log(err)
          reject(err)
        }
        resolve(body)
      })
    })
  },
  filterData(rawList) {
    return rawList.map(item => ({
      singer: item.singername,
      name: item.songname,
      albumName: item.album_name,
      albumId: item.album_id,
      songmid: item.audio_id,
      source: 'kg',
      interval: formatPlayTime(item.duration / 1000),
      img: null,
      lrc: null,
      typeUrl: {},
    }))
  },
  getList(id, page) {
    let type = this.list.find(s => s.id === id)
    if (!type) return Promise.reject()
    return this.getData(this.getUrl(page, type.bangid)).then(html => {
      let total = html.match(this.regExps.total)
      if (total) total = parseInt(RegExp.$1)
      page = html.match(this.regExps.page)
      if (page) page = parseInt(RegExp.$1)
      let limit = html.match(this.regExps.limit)
      if (limit) limit = parseInt(RegExp.$1)
      let listData = html.match(this.regExps.listData)
      if (listData) listData = this.filterData(JSON.parse(RegExp.$1))
      return {
        total,
        list: listData,
        limit,
        page,
      }
    })
  },
}
