import { httpFetch } from '../../../request'
import { formatPlayTime } from '../../../index'
// import { sizeFormate } from '../../index'


// const boardList = [{ id: 'mg__27553319', name: '咪咕尖叫新歌榜', bangid: '27553319' }, { id: 'mg__27186466', name: '咪咕尖叫热歌榜', bangid: '27186466' }, { id: 'mg__27553408', name: '咪咕尖叫原创榜', bangid: '27553408' }, { id: 'mg__23189800', name: '咪咕港台榜', bangid: '23189800' }, { id: 'mg__23189399', name: '咪咕内地榜', bangid: '23189399' }, { id: 'mg__19190036', name: '咪咕欧美榜', bangid: '19190036' }, { id: 'mg__23189813', name: '咪咕日韩榜', bangid: '23189813' }, { id: 'mg__23190126', name: '咪咕彩铃榜', bangid: '23190126' }, { id: 'mg__15140045', name: '咪咕KTV榜', bangid: '15140045' }, { id: 'mg__15140034', name: '咪咕网络榜', bangid: '15140034' }, { id: 'mg__23217754', name: 'MV榜', bangid: '23217754' }, { id: 'mg__23218151', name: '新专辑榜', bangid: '23218151' }, { id: 'mg__21958042', name: 'iTunes榜', bangid: '21958042' }, { id: 'mg__21975570', name: 'billboard榜', bangid: '21975570' }, { id: 'mg__22272815', name: '台湾Hito中文榜', bangid: '22272815' }, { id: 'mg__22272904', name: '中国TOP排行榜', bangid: '22272904' }, { id: 'mg__22272943', name: '韩国Melon榜', bangid: '22272943' }, { id: 'mg__22273437', name: '英国UK榜', bangid: '22273437' }]
const boardList = [
  { id: 'mg__27553319', name: '尖叫新歌榜', bangid: '27553319', webId: 'jianjiao_newsong' },
  { id: 'mg__27186466', name: '尖叫热歌榜', bangid: '27186466', webId: 'jianjiao_hotsong' },
  { id: 'mg__27553408', name: '尖叫原创榜', bangid: '27553408', webId: 'jianjiao_original' },
  { id: 'mg__migumusic', name: '音乐榜', bangid: 'migumusic', webId: 'migumusic' },
  { id: 'mg__movies', name: '影视榜', bangid: 'movies', webId: 'movies' },
  { id: 'mg__23189800', name: '港台榜', bangid: '23189800', webId: 'hktw' },
  { id: 'mg__23189399', name: '内地榜', bangid: '23189399', webId: 'mainland' },
  { id: 'mg__19190036', name: '欧美榜', bangid: '19190036', webId: 'eur_usa' },
  { id: 'mg__23189813', name: '日韩榜', bangid: '23189813', webId: 'jpn_kor' },
  { id: 'mg__23190126', name: '彩铃榜', bangid: '23190126', webId: 'coloring' },
  { id: 'mg__15140045', name: 'KTV榜', bangid: '15140045', webId: 'ktv' },
  { id: 'mg__15140034', name: '网络榜', bangid: '15140034', webId: 'network' },
  { id: 'mg__23217754', name: 'MV榜', bangid: '23217754', webId: 'mv' },
  { id: 'mg__23218151', name: '新专辑榜', bangid: '23218151', webId: 'newalbum' },
  { id: 'mg__21958042', name: '美国iTunes榜', bangid: '21958042', webId: 'itunes' },
  { id: 'mg__21975570', name: '美国billboard榜', bangid: '21975570', webId: 'billboard' },
  { id: 'mg__22272815', name: '台湾Hito中文榜', bangid: '22272815', webId: 'hito' },
  { id: 'mg__22272904', name: '中国TOP排行榜', bangid: '22272904' },
  { id: 'mg__22272943', name: '韩国Melon榜', bangid: '22272943', webId: 'mnet' },
  { id: 'mg__22273437', name: '英国UK榜', bangid: '22273437', webId: 'uk' },
]
// const boardList = [
//   { id: 'mg__jianjiao_newsong', bangid: 'jianjiao_newsong', name: '尖叫新歌榜' },
//   { id: 'mg__jianjiao_hotsong', bangid: 'jianjiao_hotsong', name: '尖叫热歌榜' },
//   { id: 'mg__jianjiao_original', bangid: 'jianjiao_original', name: '尖叫原创榜' },
//   { id: 'mg__migumusic', bangid: 'migumusic', name: '音乐榜' },
//   { id: 'mg__movies', bangid: 'movies', name: '影视榜' },
//   { id: 'mg__mainland', bangid: 'mainland', name: '内地榜' },
//   { id: 'mg__hktw', bangid: 'hktw', name: '港台榜' },
//   { id: 'mg__eur_usa', bangid: 'eur_usa', name: '欧美榜' },
//   { id: 'mg__jpn_kor', bangid: 'jpn_kor', name: '日韩榜' },
//   { id: 'mg__coloring', bangid: 'coloring', name: '彩铃榜' },
//   { id: 'mg__ktv', bangid: 'ktv', name: 'KTV榜' },
//   { id: 'mg__network', bangid: 'network', name: '网络榜' },
//   { id: 'mg__newalbum', bangid: 'newalbum', name: '新专辑榜' },
//   { id: 'mg__mv', bangid: 'mv', name: 'MV榜' },
//   { id: 'mg__itunes', bangid: 'itunes', name: '美国iTunes榜' },
//   { id: 'mg__billboard', bangid: 'billboard', name: '美国billboard榜' },
//   { id: 'mg__hito', bangid: 'hito', name: 'Hito中文榜' },
//   { id: 'mg__mnet', bangid: 'mnet', name: '韩国Melon榜' },
//   { id: 'mg__uk', bangid: 'uk', name: '英国UK榜' },
// ]

export default {
  limit: 10000,
  getUrl(id, page) {
    const targetBoard = boardList.find(board => board.bangid == id)
    return `https://music.migu.cn/v3/music/top/${targetBoard.webId}`
    // return `http://m.music.migu.cn/migu/remoting/cms_list_tag?nid=${id}&pageSize=${this.limit}&pageNo=${page - 1}`
  },
  successCode: '000000',
  requestBoardsObj: null,
  regExps: {
    listData: /var listData = (\{.+\})<\/script>/,
  },
  getData(url) {
    const requestObj = httpFetch(url)
    return requestObj.promise
  },
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.name)
    })
    return arr.join('、')
  },
  getIntv(interval) {
    if (!interval) return 0
    let intvArr = interval.split(':')
    let intv = 0
    let unit = 1
    while (intvArr.length) {
      intv += (intvArr.pop()) * unit
      unit *= 60
    }
    return parseInt(intv)
  },
  formateIntv() {

  },
  filterData(rawData) {
    // console.log(JSON.stringify(rawData))
    // console.log(rawData)
    let ids = new Set()
    const list = []
    rawData.forEach(item => {
      if (ids.has(item.copyrightId)) return
      ids.add(item.copyrightId)

      const types = []
      const _types = {}

      const size = null
      types.push({ type: '128k', size })
      _types['128k'] = { size }

      if (item.hq) {
        const size = null
        types.push({ type: '320k', size })
        _types['320k'] = { size }
      }
      if (item.sq) {
        const size = null
        types.push({ type: 'flac', size })
        _types.flac = { size }
      }

      list.push({
        singer: this.getSinger(item.singers),
        name: item.name,
        albumName: item.album && item.album.albumName,
        albumId: item.album && item.album.albumId,
        songmid: item.id,
        copyrightId: item.copyrightId,
        source: 'mg',
        interval: item.duration ? formatPlayTime(this.getIntv(item.duration)) : null,
        img: item.mediumPic ? `https:${item.mediumPic}` : null,
        lrc: null,
        // lrcUrl: item.lrcUrl,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
  filterBoardsData(rawList) {
    // console.log(rawList)
    let list = []
    for (const board of rawList) {
      if (board.template != 'group1') continue
      for (const item of board.itemList) {
        if ((item.template != 'row1' && item.template != 'grid1' && !item.actionUrl) || !item.actionUrl.includes('rank-info')) continue

        let data = item.displayLogId.param
        list.push({
          id: 'mg__' + data.rankId,
          name: data.rankName,
          bangid: String(data.rankId),
        })
      }
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
    // // console.log(response.body.data.contentItemList)
    // if (response.statusCode !== 200 || response.body.code !== this.successCode) return this.getBoards(retryNum)
    // const list = this.filterBoardsData(response.body.data.contentItemList)
    // // console.log(list)
    // // console.log(JSON.stringify(list))
    // this.list = list
    // return {
    //   list,
    //   source: 'mg',
    // }
    this.list = boardList
    return {
      list: boardList,
      source: 'mg',
    }
  },
  getList(bangid, page, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    return this.getData(this.getUrl(bangid, page)).then(({ statusCode, body }) => {
      if (statusCode !== 200) return this.getList(bangid, page, retryNum)
      let listData = body.match(this.regExps.listData)
      if (!listData) return this.getList(bangid, page, retryNum)
      const datas = JSON.parse(RegExp.$1)
      // console.log(datas)
      listData = this.filterData(datas.songs.items)
      return {
        total: datas.songs.itemTotal,
        list: this.filterData(datas.songs.items),
        limit: this.limit,
        page,
        source: 'mg',
      }
    })
  },
}
