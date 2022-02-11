import { httpFetch } from '../../request'
import { decodeName, formatPlayTime, sizeFormate } from '../../index'

let boardList = [{ id: 'kg__8888', name: '酷狗TOP500', bangid: '8888' }, { id: 'kg__6666', name: '酷狗飙升榜', bangid: '6666' }, { id: 'kg__37361', name: '酷狗雷达榜', bangid: '37361' }, { id: 'kg__23784', name: '网络红歌榜', bangid: '23784' }, { id: 'kg__24971', name: 'DJ热歌榜', bangid: '24971' }, { id: 'kg__35811', name: '会员专享热歌榜', bangid: '35811' }, { id: 'kg__31308', name: '华语新歌榜', bangid: '31308' }, { id: 'kg__31310', name: '欧美新歌榜', bangid: '31310' }, { id: 'kg__31311', name: '韩国新歌榜', bangid: '31311' }, { id: 'kg__31312', name: '日本新歌榜', bangid: '31312' }, { id: 'kg__31313', name: '粤语新歌榜', bangid: '31313' }, { id: 'kg__33162', name: 'ACG新歌榜', bangid: '33162' }, { id: 'kg__21101', name: '酷狗分享榜', bangid: '21101' }, { id: 'kg__30972', name: '腾讯音乐人原创榜', bangid: '30972' }, { id: 'kg__22603', name: '5sing音乐榜', bangid: '22603' }, { id: 'kg__33160', name: '电音热歌榜', bangid: '33160' }, { id: 'kg__21335', name: '繁星音乐榜', bangid: '21335' }, { id: 'kg__33161', name: '古风新歌榜', bangid: '33161' }, { id: 'kg__33163', name: '影视金曲榜', bangid: '33163' }, { id: 'kg__33166', name: '欧美金曲榜', bangid: '33166' }, { id: 'kg__33165', name: '粤语金曲榜', bangid: '33165' }, { id: 'kg__36107', name: '小语种热歌榜', bangid: '36107' }, { id: 'kg__4681', name: '美国BillBoard榜', bangid: '4681' }, { id: 'kg__4680', name: '英国单曲榜', bangid: '4680' }, { id: 'kg__4673', name: '日本公信榜', bangid: '4673' }, { id: 'kg__38623', name: '韩国Melon音乐榜', bangid: '38623' }, { id: 'kg__42807', name: 'joox本地热歌榜', bangid: '42807' }, { id: 'kg__42808', name: '台湾KKBOX风云榜', bangid: '42808' }]

export default {
  list: [
    {
      id: 'kgtop500',
      name: '酷狗TOP500',
      bangid: '8888',
    },
    {
      id: 'kgwlhgb',
      name: '网络榜',
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
      name: '古风榜',
      bangid: '33161',
    },
    {
      id: 'kgyyjqb',
      name: '粤语榜',
      bangid: '33165',
    },
    {
      id: 'kgomjqb',
      name: '欧美榜',
      bangid: '33166',
    },
    {
      id: 'kgdyrgb',
      name: '电音榜',
      bangid: '33160',
    },
    {
      id: 'kgjdrgb',
      name: 'DJ热歌榜',
      bangid: '24971',
    },
    {
      id: 'kghyxgb',
      name: '华语新歌榜',
      bangid: '31308',
    },
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
  _requestBoardsObj: null,
  _requestDataObj: null,
  getBoardsData() {
    if (this._requestBoardsObj) this._requestBoardsObj.cancelHttp()
    this._requestBoardsObj = httpFetch('http://mobilecdnbj.kugou.com/api/v3/rank/list?version=9108&plat=0&showtype=2&parentid=0&apiver=6&area_code=1&withsong=1')
    return this._requestBoardsObj.promise
  },
  getData(url) {
    if (this._requestDataObj) this._requestDataObj.cancelHttp()
    this._requestDataObj = httpFetch(url)
    return this._requestDataObj.promise
  },
  filterData(rawList) {
    // console.log(rawList)
    return rawList.map(item => {
      const types = []
      const _types = {}
      if (item.filesize !== 0) {
        let size = sizeFormate(item.filesize)
        types.push({ type: '128k', size, hash: item.hash })
        _types['128k'] = {
          size,
          hash: item.hash,
        }
      }
      if (item.filesize_320 !== 0) {
        let size = sizeFormate(item.filesize_320)
        types.push({ type: '320k', size, hash: item.hash_320 })
        _types['320k'] = {
          size,
          hash: item.hash_320,
        }
      }
      if (item.filesize_ape !== 0) {
        let size = sizeFormate(item.filesize_ape)
        types.push({ type: 'ape', size, hash: item.hash_ape })
        _types.ape = {
          size,
          hash: item.hash_ape,
        }
      }
      if (item.filesize_flac !== 0) {
        let size = sizeFormate(item.filesize_flac)
        types.push({ type: 'flac', size, hash: item.hash_flac })
        _types.flac = {
          size,
          hash: item.hash_flac,
        }
      }
      return {
        singer: decodeName(item.singername),
        name: decodeName(item.songname),
        albumName: decodeName(item.album_name),
        albumId: item.album_id,
        songmid: item.audio_id,
        source: 'kg',
        interval: formatPlayTime(item.duration / 1000),
        img: null,
        lrc: null,
        hash: item.HASH,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },

  filterBoardsData(rawList) {
    // console.log(rawList)
    let list = []
    for (const board of rawList) {
      if (board.isvol != 1) continue
      list.push({
        id: 'kg__' + board.rankid,
        name: board.rankname,
        bangid: String(board.rankid),
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
    // if (response.statusCode !== 200 || response.body.errcode !== 0) return this.getBoards(retryNum)
    // const list = this.filterBoardsData(response.body.data.info)
    // // console.log(list)
    // this.list = list
    // return {
    //   list,
    //   source: 'kg',
    // }
    this.list = boardList
    return {
      list: boardList,
      source: 'kg',
    }
  },
  getList(bangid, page) {
    return this.getData(this.getUrl(page, bangid)).then(({ body: html }) => {
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
        source: 'kg',
      }
    })
  },
  getDetailPageUrl(id) {
    if (typeof id == 'string') id = id.replace('kg__', '')
    return `https://www.kugou.com/yy/rank/home/1-${id}.html`
  },
}
