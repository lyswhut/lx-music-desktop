import { httpGet, cancelHttp } from '../../request'
import { formatPlayTime, decodeName } from '../../index'
import { formatSinger, getToken, matchToken } from './util'

export default {
  list: [
    {
      id: 'kwbiaosb',
      name: '飙升榜',
      bangid: 93,
    },
    {
      id: 'kwregb',
      name: '热歌榜',
      bangid: 16,
    },
    {
      id: 'kwhuiyb',
      name: '会员榜',
      bangid: 145,
    },
    {
      id: 'kwdouyb',
      name: '抖音榜',
      bangid: 158,
    },
    {
      id: 'kwqsb',
      name: '趋势榜',
      bangid: 187,
    },
    {
      id: 'kwhuaijb',
      name: '怀旧榜',
      bangid: 26,
    },
    {
      id: 'kwhuayb',
      name: '华语榜',
      bangid: 104,
    },
    {
      id: 'kwyueyb',
      name: '粤语榜',
      bangid: 182,
    },
    {
      id: 'kwoumb',
      name: '欧美榜',
      bangid: 22,
    },
    {
      id: 'kwhanyb',
      name: '韩语榜',
      bangid: 184,
    },
    {
      id: 'kwriyb',
      name: '日语榜',
      bangid: 183,
    },
  ],
  getUrl: (p, l, id) => `http://kbangserver.kuwo.cn/ksong.s?from=pc&fmt=json&pn=${p - 1}&rn=${l}&type=bang&data=content&id=${id}&show_copyright_off=0&pcmp4=1&isbang=1`,
  getUrl2: (p, l, id) => `http://www.kuwo.cn/api/www/bang/bang/musicList?bangId=${id}&pn=${p}&rn=${l}`,
  regExps: {

  },
  limit: 30,
  _cancelRequestObj: null,
  _cancelPromiseCancelFn: null,
  _cancelRequestObj2: null,
  _cancelPromiseCancelFn2: null,
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
  async getData2(url) {
    if (this._cancelRequestObj2 != null) {
      cancelHttp(this._cancelRequestObj2)
      this._cancelPromiseCancelFn2(new Error('取消http请求'))
    }
    let token = window.kw_token.token
    if (!token) token = await getToken()
    return new Promise((resolve, reject) => {
      this._cancelPromiseCancelFn2 = reject
      this._cancelRequestObj2 = httpGet(url, {
        headers: {
          Referer: 'http://www.kuwo.cn/',
          csrf: token,
          cookie: 'kw_token=' + token,
        },
      }, (err, resp, body) => {
        this._cancelRequestObj2 = null
        this._cancelPromiseCancelFn2 = null
        if (err) {
          console.log(err)
          return reject(err)
        }
        window.kw_token.token = matchToken(resp.headers)
        resolve(body)
      })
    })
  },
  filterData(rawList, rawList2) {
    // console.log(rawList)
    // console.log(rawList.length, rawList2.length)
    return rawList.map((item, inedx) => {
      let formats = item.formats.split('|')
      let types = []
      let _types = {}
      if (formats.includes('MP3128')) {
        types.push({ type: '128k', size: null })
        _types['128k'] = {
          size: null,
        }
      }
      // if (formats.includes('MP3192')) {
      //   types.push({ type: '192k', size: null })
      //   _types['192k'] = {
      //     size: null,
      //   }
      // }
      if (formats.includes('MP3H')) {
        types.push({ type: '320k', size: null })
        _types['320k'] = {
          size: null,
        }
      }
      // if (formats.includes('AL')) {
      //   types.push({ type: 'ape', size: null })
      //   _types.ape = {
      //     size: null,
      //   }
      // }
      if (formats.includes('ALFLAC')) {
        types.push({ type: 'flac', size: null })
        _types.flac = {
          size: null,
        }
      }
      // types.reverse()
      return {
        singer: formatSinger(decodeName(item.artist)),
        name: decodeName(item.name),
        albumName: decodeName(item.album),
        albumId: item.albumid,
        songmid: item.id,
        source: 'kw',
        interval: rawList2[inedx] && formatPlayTime(rawList2[inedx].duration),
        img: item.pic,
        lrc: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  loadData(p1, p2, page, bangid, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    return Promise.all([p1, p2]).then(([data1, data2]) => {
      // console.log(data1, data2)
      if (!data1.musiclist.length) {
        return this.loadData(this.getData(this.getUrl(page, this.limit, bangid)),
          data2.data.musicList.length
            ? Promise.resolve(data2)
            : this.getData2(this.getUrl2(page, this.limit, bangid)), page, bangid, retryNum)
      }
      if (!data2.data.musicList.length) {
        return this.loadData(Promise.resolve(data1), this.getData2(this.getUrl2(page, this.limit, bangid)), page, bangid, retryNum)
      }
      return Promise.resolve([data1, data2])
    })
  },
  getList(id, page) {
    let type = this.list.find(s => s.id === id)
    if (!type) return Promise.reject()
    return this.loadData(this.getData(this.getUrl(page, this.limit, type.bangid)), this.getData2(this.getUrl2(page, this.limit, type.bangid)), page, type.bangid).then(([data1, data2]) => {
      // console.log(data1.musiclist, data2.data)
      let total = parseInt(data1.num)
      let list = this.filterData(data1.musiclist, data2.data.musicList)
      return {
        total,
        list,
        limit: this.limit,
        page,
        source: 'kw',
      }
    })
  },
}
