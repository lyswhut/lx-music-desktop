import { httpGet, cancelHttp } from '../../request'
import { formatPlayTime, sizeFormate } from '../../index'

export default {
  limit: 300,
  list: [
    {
      id: 'txlxzsb',
      name: '流行榜',
      bangid: 4,
    },
    {
      id: 'txrgb',
      name: '热歌榜',
      bangid: 26,
    },
    {
      id: 'txwlhgb',
      name: '网络榜',
      bangid: 28,
    },
    {
      id: 'txdyb',
      name: '抖音榜',
      bangid: 60,
    },
    {
      id: 'txndb',
      name: '内地榜',
      bangid: 5,
    },
    {
      id: 'txxgb',
      name: '香港榜',
      bangid: 59,
    },
    {
      id: 'txtwb',
      name: '台湾榜',
      bangid: 61,
    },
    {
      id: 'txoumb',
      name: '欧美榜',
      bangid: 3,
    },
    {
      id: 'txhgb',
      name: '韩国榜',
      bangid: 16,
    },
    {
      id: 'txrbb',
      name: '日本榜',
      bangid: 17,
    },
    // {
    //   id: 'txtybb',
    //   name: 'YouTube榜',
    //   bangid: 128,
    // },
  ],
  getUrl(id, period, limit) {
    return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&inCharset=utf8&outCharset=utf-8&platform=yqq.json&needNewCode=0&data=${encodeURIComponent(JSON.stringify({
      comm: {
        cv: 1602,
        ct: 20,
      },
      toplist: {
        module: 'musicToplist.ToplistInfoServer',
        method: 'GetDetail',
        param: {
          topid: id,
          num: limit,
          period,
        },
      },
    }))}`
  },
  regExps: {
    periodList: /<i class="play_cover__btn c_tx_link js_icon_play" data-listkey=".+?" data-listname=".+?" data-tid=".+?" data-date=".+?" .+?<\/i>/g,
    period: /data-listname="(.+?)" data-tid=".*?\/(.+?)" data-date="(.+?)" .+?<\/i>/,
  },
  periods: {},
  periodUrl: 'https://c.y.qq.com/node/pc/wk_v15/top.html',
  _cancelRequestObj: null,
  _cancelPromiseCancelFn: null,
  getData(url) {
    if (this._cancelRequestObj != null) {
      cancelHttp(this._cancelRequestObj)
      this._cancelPromiseCancelFn(new Error('取消http请求'))
    }
    return new Promise((resolve, reject) => {
      this._cancelPromiseCancelFn = reject
      this._cancelRequestObj = httpGet(url, (err, resp, body) => {
        this._cancelRequestObj = null
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
      let types = []
      let _types = {}
      if (item.file.size_128mp3 !== 0) {
        let size = sizeFormate(item.file.size_128mp3)
        types.push({ type: '128k', size })
        _types['128k'] = {
          size,
        }
      }
      if (item.file.size_320mp3 !== 0) {
        let size = sizeFormate(item.file.size_320mp3)
        types.push({ type: '320k', size })
        _types['320k'] = {
          size,
        }
      }
      if (item.file.size_ape !== 0) {
        let size = sizeFormate(item.file.size_ape)
        types.push({ type: 'ape', size })
        _types.ape = {
          size,
        }
      }
      if (item.file.size_flac !== 0) {
        let size = sizeFormate(item.file.size_flac)
        types.push({ type: 'flac', size })
        _types.flac = {
          size,
        }
      }
      // types.reverse()
      return {
        singer: this.getSinger(item.singer),
        name: item.title,
        albumName: item.album.title,
        albumId: item.album.mid,
        source: 'tx',
        interval: formatPlayTime(item.interval),
        songId: item.id,
        albumMid: item.album.mid,
        strMediaMid: item.file.media_mid,
        songmid: item.mid,
        img: (item.album.name === '' || item.album.name === '空')
          ? `https://y.gtimg.cn/music/photo_new/T001R500x500M000${item.singer[0].mid}.jpg`
          : `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.album.mid}.jpg`,
        lrc: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  getPeriods(bangid) {
    return this.getData(this.periodUrl).then(html => {
      let result = html.match(this.regExps.periodList)
      if (!result) return Promise.reject()
      result.forEach(item => {
        let result = item.match(this.regExps.period)
        if (!result) return
        this.periods[result[2]] = {
          name: result[1],
          bangid: result[2],
          period: result[3],
        }
      })
      const info = this.periods[bangid]
      return info && info.period
    })
  },
  getList(id, page) {
    let type = this.list.find(s => s.id === id)
    if (!type) return Promise.reject()
    let info = this.periods[type.bangid]
    let p = info ? Promise.resolve(info.period) : this.getPeriods(type.bangid)
    return p.then(period => {
      return this.getData(this.getUrl(type.bangid, period, this.limit)).then(data => {
        // console.log(data)
        if (data.code !== 0) return Promise.reject()
        return {
          total: data.toplist.data.songInfoList.length,
          list: this.filterData(data.toplist.data.songInfoList),
          limit: this.limit,
          page: 1,
          source: 'tx',
        }
      })
    })
  },
}
