import { httpFetch } from '../../request'
import { decodeName, formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'

let boardList = [{ id: 'kg__8888', name: 'TOP500', bangid: '8888' }, { id: 'kg__6666', name: '飙升榜', bangid: '6666' }, { id: 'kg__59703', name: '蜂鸟流行音乐榜', bangid: '59703' }, { id: 'kg__52144', name: '抖音热歌榜', bangid: '52144' }, { id: 'kg__52767', name: '快手热歌榜', bangid: '52767' }, { id: 'kg__24971', name: 'DJ热歌榜', bangid: '24971' }, { id: 'kg__23784', name: '网络红歌榜', bangid: '23784' }, { id: 'kg__44412', name: '说唱先锋榜', bangid: '44412' }, { id: 'kg__31308', name: '内地榜', bangid: '31308' }, { id: 'kg__33160', name: '电音榜', bangid: '33160' }, { id: 'kg__31313', name: '香港地区榜', bangid: '31313' }, { id: 'kg__51341', name: '民谣榜', bangid: '51341' }, { id: 'kg__54848', name: '台湾地区榜', bangid: '54848' }, { id: 'kg__31310', name: '欧美榜', bangid: '31310' }, { id: 'kg__33162', name: 'ACG新歌榜', bangid: '33162' }, { id: 'kg__31311', name: '韩国榜', bangid: '31311' }, { id: 'kg__31312', name: '日本榜', bangid: '31312' }, { id: 'kg__49225', name: '80后热歌榜', bangid: '49225' }, { id: 'kg__49223', name: '90后热歌榜', bangid: '49223' }, { id: 'kg__49224', name: '00后热歌榜', bangid: '49224' }, { id: 'kg__33165', name: '粤语金曲榜', bangid: '33165' }, { id: 'kg__33166', name: '欧美金曲榜', bangid: '33166' }, { id: 'kg__33163', name: '影视金曲榜', bangid: '33163' }, { id: 'kg__51340', name: '伤感榜', bangid: '51340' }, { id: 'kg__35811', name: '会员专享榜', bangid: '35811' }, { id: 'kg__37361', name: '雷达榜', bangid: '37361' }, { id: 'kg__21101', name: '分享榜', bangid: '21101' }, { id: 'kg__46910', name: '综艺新歌榜', bangid: '46910' }, { id: 'kg__30972', name: '酷狗音乐人原创榜', bangid: '30972' }, { id: 'kg__60170', name: '闽南语榜', bangid: '60170' }, { id: 'kg__65234', name: '儿歌榜', bangid: '65234' }, { id: 'kg__4681', name: '美国BillBoard榜', bangid: '4681' }, { id: 'kg__25028', name: 'Beatport电子舞曲榜', bangid: '25028' }, { id: 'kg__4680', name: '英国单曲榜', bangid: '4680' }, { id: 'kg__38623', name: '韩国Melon音乐榜', bangid: '38623' }, { id: 'kg__42807', name: 'joox本地热歌榜', bangid: '42807' }, { id: 'kg__36107', name: '小语种热歌榜', bangid: '36107' }, { id: 'kg__4673', name: '日本公信榜', bangid: '4673' }, { id: 'kg__46868', name: '日本SPACE SHOWER榜', bangid: '46868' }, { id: 'kg__42808', name: 'KKBOX风云榜', bangid: '42808' }, { id: 'kg__60171', name: '越南语榜', bangid: '60171' }, { id: 'kg__60172', name: '泰语榜', bangid: '60172' }, { id: 'kg__59895', name: 'R&B榜', bangid: '59895' }, { id: 'kg__59896', name: '摇滚榜', bangid: '59896' }, { id: 'kg__59897', name: '爵士榜', bangid: '59897' }, { id: 'kg__59898', name: '乡村音乐榜', bangid: '59898' }, { id: 'kg__59900', name: '纯音乐榜', bangid: '59900' }, { id: 'kg__59899', name: '古典榜', bangid: '59899' }, { id: 'kg__22603', name: '5sing音乐榜', bangid: '22603' }, { id: 'kg__21335', name: '繁星音乐榜', bangid: '21335' }, { id: 'kg__33161', name: '古风新歌榜', bangid: '33161' }]

export default {
  listDetailLimit: 100,
  list: [
    {
      id: 'kgtop500',
      name: 'TOP500',
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
  getUrl(p, id, limit) {
    return `http://mobilecdnbj.kugou.com/api/v3/rank/song?version=9108&ranktype=1&plat=0&pagesize=${limit}&area_code=1&page=${p}&rankid=${id}&with_res_tag=0&show_portrait_mv=1`
  },
  regExps: {
    total: /total: '(\d+)',/,
    page: /page: '(\d+)',/,
    limit: /pagesize: '(\d+)',/,
    listData: /global\.features = (\[.+\]);/,
  },
  _requestBoardsObj: null,
  getBoardsData() {
    if (this._requestBoardsObj) this._requestBoardsObj.cancelHttp()
    this._requestBoardsObj = httpFetch('http://mobilecdnbj.kugou.com/api/v5/rank/list?version=9108&plat=0&showtype=2&parentid=0&apiver=6&area_code=1&withsong=1')
    return this._requestBoardsObj.promise
  },
  getData(url) {
    const requestDataObj = httpFetch(url)
    return requestDataObj.promise
  },
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.author_name)
    })
    return arr.join('、')
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
      if (item['320filesize'] !== 0) {
        let size = sizeFormate(item['320filesize'])
        types.push({ type: '320k', size, hash: item['320hash'] })
        _types['320k'] = {
          size,
          hash: item['320hash'],
        }
      }
      if (item.sqfilesize !== 0) {
        let size = sizeFormate(item.sqfilesize)
        types.push({ type: 'flac', size, hash: item.sqhash })
        _types.flac = {
          size,
          hash: item.sqhash,
        }
      }
      if (item.filesize_high !== 0) {
        let size = sizeFormate(item.filesize_high)
        types.push({ type: 'flac24bit', size, hash: item.hash_high })
        _types.flac24bit = {
          size,
          hash: item.hash_high,
        }
      }
      return {
        singer: formatSingerName(item.authors, 'author_name'),
        name: decodeName(item.songname),
        albumName: decodeName(item.remark),
        albumId: item.album_id,
        songmid: item.audio_id,
        source: 'kg',
        interval: formatPlayTime(item.duration),
        img: null,
        lrc: null,
        hash: item.hash,
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
    // console.log(list)
    // // console.log(JSON.stringify(list))
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
  async getList(bangid, page, retryNum = 0) {
    if (++retryNum > 3) throw new Error('try max num')
    const { body } = await this.getData(this.getUrl(page, bangid, this.listDetailLimit))

    if (body.errcode != 0) return this.getList(bangid, page, retryNum)

    // console.log(body)
    let total = body.data.total
    let limit = 100
    let listData = this.filterData(body.data.info)
    // console.log(listData)
    return {
      total,
      list: listData,
      limit,
      page,
      source: 'kg',
    }
  },
  getDetailPageUrl(id) {
    if (typeof id == 'string') id = id.replace('kg__', '')
    return `https://www.kugou.com/yy/rank/home/1-${id}.html`
  },
}
