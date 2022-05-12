import { weapi } from './utils/crypto'
import { httpFetch } from '../../request'
import musicDetailApi from './musicDetail'

const topList = [
  { id: 'wy__19723756', bangid: '19723756', name: '云音乐飙升榜' },
  { id: 'wy__3778678', bangid: '3778678', name: '云音乐热歌榜' },
  { id: 'wy__3779629', bangid: '3779629', name: '云音乐新歌榜' },
  { id: 'wy__2884035', bangid: '2884035', name: '云音乐原创榜' },
  { id: 'wy__2250011882', bangid: '2250011882', name: '抖音排行榜' },
  { id: 'wy__1978921795', bangid: '1978921795', name: '云音乐电音榜' },
  { id: 'wy__4395559', bangid: '4395559', name: '华语金曲榜' },
  { id: 'wy__71384707', bangid: '71384707', name: '云音乐古典音乐榜' },
  { id: 'wy__10520166', bangid: '10520166', name: '云音乐国电榜' },
  { id: 'wy__2006508653', bangid: '2006508653', name: '电竞音乐榜' },
  { id: 'wy__991319590', bangid: '991319590', name: '云音乐说唱榜' },
  { id: 'wy__180106', bangid: '180106', name: 'UK排行榜周榜' },
  { id: 'wy__60198', bangid: '60198', name: '美国Billboard周榜' },
  { id: 'wy__21845217', bangid: '21845217', name: 'KTV嗨榜' },
  { id: 'wy__11641012', bangid: '11641012', name: 'iTunes榜' },
  { id: 'wy__120001', bangid: '120001', name: 'Hit FM Top榜' },
  { id: 'wy__60131', bangid: '60131', name: '日本Oricon周榜' },
  { id: 'wy__3733003', bangid: '3733003', name: '韩国Melon排行榜周榜' },
  { id: 'wy__60255', bangid: '60255', name: '韩国Mnet排行榜周榜' },
  { id: 'wy__46772709', bangid: '46772709', name: '韩国Melon原声周榜' },
  { id: 'wy__64016', bangid: '64016', name: '中国TOP排行榜(内地榜)' },
  { id: 'wy__112504', bangid: '112504', name: '中国TOP排行榜(港台榜)' },
  { id: 'wy__3112516681', bangid: '3112516681', name: '中国新乡村音乐排行榜' },
  { id: 'wy__10169002', bangid: '10169002', name: '香港电台中文歌曲龙虎榜' },
  { id: 'wy__27135204', bangid: '27135204', name: '法国 NRJ EuroHot 30周榜' },
  { id: 'wy__1899724', bangid: '1899724', name: '中国嘻哈榜' },
  { id: 'wy__112463', bangid: '112463', name: '台湾Hito排行榜' },
  { id: 'wy__3812895', bangid: '3812895', name: 'Beatport全球电子舞曲榜' },
  { id: 'wy__2617766278', bangid: '2617766278', name: '新声榜' },
  { id: 'wy__745956260', bangid: '745956260', name: '云音乐韩语榜' },
  { id: 'wy__2847251561', bangid: '2847251561', name: '说唱TOP榜' },
  { id: 'wy__2023401535', bangid: '2023401535', name: '英国Q杂志中文版周榜' },
  { id: 'wy__2809513713', bangid: '2809513713', name: '云音乐欧美热歌榜' },
  { id: 'wy__2809577409', bangid: '2809577409', name: '云音乐欧美新歌榜' },
  { id: 'wy__71385702', bangid: '71385702', name: '云音乐ACG音乐榜' },
  { id: 'wy__3001835560', bangid: '3001835560', name: '云音乐ACG动画榜' },
  { id: 'wy__3001795926', bangid: '3001795926', name: '云音乐ACG游戏榜' },
  { id: 'wy__3001890046', bangid: '3001890046', name: '云音乐ACG VOCALOID榜' },
]

export default {
  limit: 100000,
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
  _requestBoardsObj: null,
  getBoardsData() {
    if (this._requestBoardsObj) this._requestBoardsObj.cancelHttp()
    this._requestBoardsObj = httpFetch('https://music.163.com/weapi/toplist', {
      method: 'post',
      form: weapi({}),
    })
    return this._requestBoardsObj.promise
  },
  getData(id) {
    const requestBoardsDetailObj = httpFetch('https://music.163.com/weapi/v3/playlist/detail', {
      method: 'post',
      form: weapi({
        id,
        n: 100000,
        p: 1,
      }),
    })
    return requestBoardsDetailObj.promise
  },

  filterBoardsData(rawList) {
    // console.log(rawList)
    let list = []
    for (const board of rawList) {
      // 排除 MV榜
      // if (board.id == 201) continue
      list.push({
        id: 'wy__' + board.id,
        name: board.name,
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
    // console.log(response.body)
    // if (response.statusCode !== 200 || response.body.code !== 200) return this.getBoards(retryNum)
    // const list = this.filterBoardsData(response.body.list)
    // console.log(list)
    // console.log(JSON.stringify(list))
    // this.list = list
    // return {
    //   list,
    //   source: 'wy',
    // }
    this.list = topList
    return {
      list: topList,
      source: 'wy',
    }
  },
  async getList(bangid, page, retryNum = 0) {
    if (++retryNum > 6) return Promise.reject(new Error('try max num'))
    // console.log(bangid)
    let resp
    try {
      resp = await this.getData(bangid)
    } catch (err) {
      if (err.message == 'try max num') {
        throw err
      } else {
        return this.getList(bangid, page, retryNum)
      }
    }
    if (resp.statusCode !== 200 || resp.body.code !== 200) return this.getList(bangid, page, retryNum)
    // console.log(resp.body)
    let musicDetail
    try {
      musicDetail = await musicDetailApi.getList(resp.body.playlist.trackIds.map(trackId => trackId.id))
    } catch (err) {
      console.log(err)
      if (err.message == 'try max num') {
        throw err
      } else {
        return this.getList(bangid, page, retryNum)
      }
    }
    // console.log(musicDetail)
    return {
      total: musicDetail.list.length,
      list: musicDetail.list,
      limit: this.limit,
      page,
      source: 'wy',
    }
  },

  getDetailPageUrl(id) {
    if (typeof id == 'string') id = id.replace('wy__', '')
    return `https://music.163.com/#/discover/toplist?id=${id}`
  },
}
