import { weapi } from './utils/crypto'
import { httpFetch } from '../../request'
import musicDetailApi from './musicDetail'

const topList = [{ id: 'wy__19723756', name: '飙升榜', bangid: '19723756' },
  { id: 'wy__3779629', name: '新歌榜', bangid: '3779629' },
  { id: 'wy__2884035', name: '原创榜', bangid: '2884035' },
  { id: 'wy__3778678', name: '热歌榜', bangid: '3778678' },
  { id: 'wy__991319590', name: '说唱榜', bangid: '991319590' },
  { id: 'wy__71384707', name: '古典榜', bangid: '71384707' },
  { id: 'wy__1978921795', name: '电音榜', bangid: '1978921795' },
  { id: 'wy__5453912201', name: '黑胶VIP爱听榜', bangid: '5453912201' },
  { id: 'wy__71385702', name: 'ACG榜', bangid: '71385702' },
  { id: 'wy__745956260', name: '韩语榜', bangid: '745956260' },
  { id: 'wy__10520166', name: '国电榜', bangid: '10520166' },
  { id: 'wy__180106', name: 'UK排行榜周榜', bangid: '180106' },
  { id: 'wy__60198', name: '美国Billboard榜', bangid: '60198' },
  { id: 'wy__3812895', name: 'Beatport全球电子舞曲榜', bangid: '3812895' },
  { id: 'wy__21845217', name: 'KTV唛榜', bangid: '21845217' },
  { id: 'wy__60131', name: '日本Oricon榜', bangid: '60131' },
  { id: 'wy__2809513713', name: '欧美热歌榜', bangid: '2809513713' },
  { id: 'wy__2809577409', name: '欧美新歌榜', bangid: '2809577409' },
  { id: 'wy__27135204', name: '法国 NRJ Vos Hits 周榜', bangid: '27135204' },
  { id: 'wy__3001835560', name: 'ACG动画榜', bangid: '3001835560' },
  { id: 'wy__3001795926', name: 'ACG游戏榜', bangid: '3001795926' },
  { id: 'wy__3001890046', name: 'ACG VOCALOID榜', bangid: '3001890046' },
  { id: 'wy__3112516681', name: '中国新乡村音乐排行榜', bangid: '3112516681' },
  { id: 'wy__5059644681', name: '日语榜', bangid: '5059644681' },
  { id: 'wy__5059633707', name: '摇滚榜', bangid: '5059633707' },
  { id: 'wy__5059642708', name: '国风榜', bangid: '5059642708' },
  { id: 'wy__5338990334', name: '潜力爆款榜', bangid: '5338990334' },
  { id: 'wy__5059661515', name: '民谣榜', bangid: '5059661515' },
  { id: 'wy__6688069460', name: '听歌识曲榜', bangid: '6688069460' },
  { id: 'wy__6723173524', name: '网络热歌榜', bangid: '6723173524' },
  { id: 'wy__6732051320', name: '俄语榜', bangid: '6732051320' },
  { id: 'wy__6732014811', name: '越南语榜', bangid: '6732014811' },
  { id: 'wy__6886768100', name: '中文DJ榜', bangid: '6886768100' },
  { id: 'wy__6939992364', name: '俄罗斯top hit流行音乐榜', bangid: '6939992364' },
  { id: 'wy__7095271308', name: '泰语榜', bangid: '7095271308' },
  { id: 'wy__7356827205', name: 'BEAT排行榜', bangid: '7356827205' },
  { id: 'wy__7325478166', name: '编辑推荐榜VOL.44 天才女子摇滚乐队boygenius剖白卑微心迹', bangid: '7325478166' },
  { id: 'wy__7603212484', name: 'LOOK直播歌曲榜', bangid: '7603212484' },
  { id: 'wy__7775163417', name: '赏音榜', bangid: '7775163417' },
  { id: 'wy__7785123708', name: '黑胶VIP新歌榜', bangid: '7785123708' },
  { id: 'wy__7785066739', name: '黑胶VIP热歌榜', bangid: '7785066739' },
  { id: 'wy__7785091694', name: '黑胶VIP爱搜榜', bangid: '7785091694' },
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
