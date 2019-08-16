import { httpGet, cancelHttp } from '../../request'
import { formatPlayTime } from '../../index'

export default {
  limit: 300,
  list: [
    {
      id: 'wybsb',
      name: '飙升榜',
      bangid: '19723756',
    },
    {
      id: 'wyrgb',
      name: '热歌榜',
      bangid: '3778678',
    },
    {
      id: 'wyxgb',
      name: '新歌榜',
      bangid: '3779629',
    },
    {
      id: 'wyycb',
      name: '原创榜',
      bangid: '2884035',
    },
    {
      id: 'wygdb',
      name: '古典榜',
      bangid: '71384707',
    },
    {
      id: 'wydouyb',
      name: '抖音榜',
      bangid: '2250011882',
    },
    {
      id: 'wyhyb',
      name: '韩语榜',
      bangid: '745956260',
    },
    {
      id: 'wydianyb',
      name: '电音榜',
      bangid: '1978921795',
    },
    {
      id: 'wydjb',
      name: '电竞榜',
      bangid: '2006508653',
    },
    {
      id: 'wyktvbb',
      name: 'KTV唛榜',
      bangid: '21845217',
    },
  ],
  getUrl(id) {
    return `https://music.163.com/discover/toplist?id=${id}`
  },
  regExps: {
    list: /<textarea id="song-list-pre-data" style="display:none;">(.+?)<\/textarea>/,
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
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.name)
    })
    return arr.join('、')
  },
  filterData(rawList) {
    // console.log(rawList)
    return rawList.map(item => {
      return {
        singer: this.getSinger(item.artists),
        name: item.name,
        albumName: item.album.name,
        albumId: item.album.id,
        source: 'wy',
        interval: formatPlayTime(item.duration / 1000),
        songmid: item.id,
        img: item.album.picUrl,
        lrc: null,
        typeUrl: {},
      }
    })
  },
  getList(id, page) {
    let type = this.list.find(s => s.id === id)
    if (!type) return Promise.reject()
    return this.getData(this.getUrl(type.bangid)).then(html => {
      let result = html.match(this.regExps.list)
      if (!result) return Promise.reject()
      const list = this.filterData(JSON.parse(RegExp.$1))
      return {
        total: list.length,
        list,
        limit: this.limit,
        page,
      }
    })
  },
}
