import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'

let boardList = [{ id: 'tx__4', name: '流行指数榜', bangid: '4' }, { id: 'tx__26', name: '热歌榜', bangid: '26' }, { id: 'tx__27', name: '新歌榜', bangid: '27' }, { id: 'tx__62', name: '飙升榜', bangid: '62' }, { id: 'tx__58', name: '说唱榜', bangid: '58' }, { id: 'tx__57', name: '喜力电音榜', bangid: '57' }, { id: 'tx__28', name: '网络歌曲榜', bangid: '28' }, { id: 'tx__5', name: '内地榜', bangid: '5' }, { id: 'tx__3', name: '欧美榜', bangid: '3' }, { id: 'tx__59', name: '香港地区榜', bangid: '59' }, { id: 'tx__16', name: '韩国榜', bangid: '16' }, { id: 'tx__60', name: '抖快榜', bangid: '60' }, { id: 'tx__29', name: '影视金曲榜', bangid: '29' }, { id: 'tx__17', name: '日本榜', bangid: '17' }, { id: 'tx__52', name: '腾讯音乐人原创榜', bangid: '52' }, { id: 'tx__36', name: 'K歌金曲榜', bangid: '36' }, { id: 'tx__61', name: '台湾地区榜', bangid: '61' }, { id: 'tx__63', name: 'DJ舞曲榜', bangid: '63' }, { id: 'tx__64', name: '综艺新歌榜', bangid: '64' }, { id: 'tx__65', name: '国风热歌榜', bangid: '65' }, { id: 'tx__67', name: '听歌识曲榜', bangid: '67' }, { id: 'tx__72', name: '动漫音乐榜', bangid: '72' }, { id: 'tx__73', name: '游戏音乐榜', bangid: '73' }, { id: 'tx__75', name: '有声榜', bangid: '75' }, { id: 'tx__131', name: '校园音乐人排行榜', bangid: '131' }]

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
    {
      id: 'txtybb',
      name: 'YouTube榜',
      bangid: 128,
    },
  ],
  listDetailRequest(id, period, limit) {
    // console.log(id, period, limit)
    return httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
      },
      body: {
        toplist: {
          module: 'musicToplist.ToplistInfoServer',
          method: 'GetDetail',
          param: {
            topid: id,
            num: limit,
            period,
          },
        },
        comm: {
          uin: 0,
          format: 'json',
          ct: 20,
          cv: 1859,
        },
      },
    }).promise
  },
  regExps: {
    periodList: /<i class="play_cover__btn c_tx_link js_icon_play" data-listkey=".+?" data-listname=".+?" data-tid=".+?" data-date=".+?" .+?<\/i>/g,
    period: /data-listname="(.+?)" data-tid=".*?\/(.+?)" data-date="(.+?)" .+?<\/i>/,
  },
  periods: {},
  periodUrl: 'https://c.y.qq.com/node/pc/wk_v15/top.html',
  _requestBoardsObj: null,
  getBoardsData() {
    if (this._requestBoardsObj) this._requestBoardsObj.cancelHttp()
    this._requestBoardsObj = httpFetch('https://c.y.qq.com/v8/fcg-bin/fcg_myqq_toplist.fcg?g_tk=1928093487&inCharset=utf-8&outCharset=utf-8&notice=0&format=json&uin=0&needNewCode=1&platform=h5')
    return this._requestBoardsObj.promise
  },
  getData(url) {
    const requestDataObj = httpFetch(url)
    return requestDataObj.promise
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
      if (item.file.size_flac !== 0) {
        let size = sizeFormate(item.file.size_flac)
        types.push({ type: 'flac', size })
        _types.flac = {
          size,
        }
      }
      if (item.file.size_hires !== 0) {
        let size = sizeFormate(item.file.size_hires)
        types.push({ type: 'flac24bit', size })
        _types.flac24bit = {
          size,
        }
      }
      // types.reverse()
      return {
        singer: formatSingerName(item.singer, 'name'),
        name: item.title,
        albumName: item.album.name,
        albumId: item.album.mid,
        source: 'tx',
        interval: formatPlayTime(item.interval),
        songId: item.id,
        albumMid: item.album.mid,
        strMediaMid: item.file.media_mid,
        songmid: item.mid,
        img: (item.album.name === '' || item.album.name === '空')
          ? item.singer?.length ? `https://y.gtimg.cn/music/photo_new/T001R500x500M000${item.singer[0].mid}.jpg` : ''
          : `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.album.mid}.jpg`,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  getPeriods(bangid) {
    return this.getData(this.periodUrl).then(({ body: html }) => {
      let result = html.match(this.regExps.periodList)
      if (!result) return Promise.reject(new Error('get data failed'))
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
  filterBoardsData(rawList) {
    // console.log(rawList)
    let list = []
    for (const board of rawList) {
      // 排除 MV榜
      if (board.id == 201) continue

      if (board.topTitle.startsWith('巅峰榜·')) {
        board.topTitle = board.topTitle.substring(4, board.topTitle.length)
      }
      if (!board.topTitle.endsWith('榜')) board.topTitle += '榜'
      list.push({
        id: 'tx__' + board.id,
        name: board.topTitle,
        bangid: String(board.id),
      })
    }
    return list
  },
  async getBoards(retryNum = 0) {
    // if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    // let response
    // try {
    //   response = await this.getBoardsData()
    // } catch (error) {
    //   return this.getBoards(retryNum)
    // }
    // // console.log(response.body)
    // if (response.statusCode !== 200 || response.body.code !== 0) return this.getBoards(retryNum)
    // const list = this.filterBoardsData(response.body.data.topList)
    // console.log(list)
    // console.log(JSON.stringify(list))
    // this.list = list
    // return {
    //   list,
    //   source: 'tx',
    // }
    this.list = boardList
    return {
      list: boardList,
      source: 'tx',
    }
  },
  getList(bangid, page, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    bangid = parseInt(bangid)
    let info = this.periods[bangid]
    let p = info ? Promise.resolve(info.period) : this.getPeriods(bangid)
    return p.then(period => {
      return this.listDetailRequest(bangid, period, this.limit).then(resp => {
        if (resp.body.code !== 0) return this.getList(bangid, page, retryNum)
        return {
          total: resp.body.toplist.data.songInfoList.length,
          list: this.filterData(resp.body.toplist.data.songInfoList),
          limit: this.limit,
          page: 1,
          source: 'tx',
        }
      })
    })
  },

  getDetailPageUrl(id) {
    if (typeof id == 'string') id = id.replace('tx__', '')
    return `https://y.qq.com/n/ryqq/toplist/${id}`
  },
}
