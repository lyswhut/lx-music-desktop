import { xmRequest } from './util'
import { formatPlayTime, sizeFormate } from '../../index'
// import jshtmlencode from 'js-htmlencode'

let boardList = [{ id: 'xm__102', name: '新歌榜', bangid: '102' }, { id: 'xm__103', name: '热歌榜', bangid: '103' }, { id: 'xm__104', name: '原创榜', bangid: '104' }, { id: 'xm__306', name: 'K歌榜', bangid: '306' }, { id: 'xm__332', name: '抖音热歌榜', bangid: '332' }, { id: 'xm__305', name: '歌单收录榜', bangid: '305' }, { id: 'xm__327', name: '趴间热歌榜', bangid: '327' }, { id: 'xm__324', name: '影视原声榜', bangid: '324' }, { id: 'xm__204', name: '美国Billboard单曲榜', bangid: '204' }, { id: 'xm__206', name: '韩国MNET音乐排行榜', bangid: '206' }, { id: 'xm__201', name: 'Hito 中文排行榜', bangid: '201' }, { id: 'xm__203', name: '英国UK单曲榜', bangid: '203' }, { id: 'xm__205', name: 'oricon公信单曲榜', bangid: '205' }, { id: 'xm__328', name: '美国iTunes榜', bangid: '328' }, { id: 'xm__329', name: 'Beatport电音榜', bangid: '329' }, { id: 'xm__330', name: '香港商业电台榜', bangid: '330' }]

export default {
  limit: 200,
  list: [
    {
      id: 'xmrgb',
      name: '热歌榜',
      bangid: '103',
    },
    {
      id: 'xmxgb',
      name: '新歌榜',
      bangid: '102',
    },
    {
      id: 'xmrcb',
      name: '原创榜',
      bangid: '104',
    },
    {
      id: 'xmdyb',
      name: '抖音榜',
      bangid: '332',
    },
    {
      id: 'xmkgb',
      name: 'K歌榜',
      bangid: '306',
    },
    {
      id: 'xmfxb',
      name: '分享榜',
      bangid: '307',
    },
    {
      id: 'xmrdtlb',
      name: '讨论榜',
      bangid: '331',
    },
    {
      id: 'xmgdslb',
      name: '歌单榜',
      bangid: '305',
    },
    {
      id: 'xmpjrgb',
      name: '趴间榜',
      bangid: '327',
    },
    {
      id: 'xmysysb',
      name: '影视榜',
      bangid: '324',
    },
  ],
  requestBoardsObj: null,
  requestObj: null,
  getBoardsData() {
    if (this.requestBoardsObj) this.requestBoardsObj.cancelHttp()
    this.requestBoardsObj = xmRequest('/api/billboard/getBillboards')
    return this.requestBoardsObj.promise
  },
  getData(id) {
    if (this.requestObj) this.requestObj.cancelHttp()
    this.requestObj = xmRequest('/api/billboard/getBillboardDetail', { billboardId: id })
    return this.requestObj.promise
  },
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.artistName)
    })
    return arr.join('、')
  },
  filterData(rawList) {
    // console.log(rawList)
    let ids = new Set()
    const list = []
    rawList.forEach(songData => {
      if (!songData) return
      if (ids.has(songData.songId)) return
      ids.add(songData.songId)

      const types = []
      const _types = {}
      let size = null
      for (const item of songData.purviewRoleVOs) {
        if (!item.filesize) continue
        size = sizeFormate(item.filesize)
        switch (item.quality) {
          case 's':
            types.push({ type: 'wav', size })
            _types.wav = {
              size,
            }
            break
          case 'h':
            types.push({ type: '320k', size })
            _types['320k'] = {
              size,
            }
            break
          case 'l':
            types.push({ type: '128k', size })
            _types['128k'] = {
              size,
            }
            break
        }
      }
      types.reverse()

      list.push({
        singer: this.getSinger(songData.singerVOs),
        name: songData.songName,
        albumName: songData.albumName,
        albumId: songData.albumId,
        source: 'xm',
        interval: formatPlayTime(parseInt(songData.length / 1000)),
        songmid: songData.songId,
        img: songData.albumLogo || songData.albumLogoS,
        songStringId: songData.songStringId,
        lrc: null,
        lrcUrl: songData.lyricInfo && songData.lyricInfo.lyricFile,
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
    if (rawList.xiamiBillboards) {
      for (const board of rawList.xiamiBillboards) {
        if (board.itemType != 1) continue
        list.push({
          id: 'xm__' + board.billboardId,
          name: board.name,
          bangid: String(board.billboardId),
        })
      }
    }
    if (rawList.spBillboards) {
      for (const board of rawList.spBillboards) {
        if (board.itemType != 1) continue
        list.push({
          id: 'xm__' + board.billboardId,
          name: board.name,
          bangid: String(board.billboardId),
        })
      }
    }
    if (rawList.globalBillboards) {
      for (const board of rawList.globalBillboards) {
        if (board.itemType != 1) continue
        list.push({
          id: 'xm__' + board.billboardId,
          name: board.name,
          bangid: String(board.billboardId),
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
    // if (response.statusCode !== 200 || response.body.code !== 'SUCCESS') return this.getBoards(retryNum)
    // const list = this.filterBoardsData(response.body.result.data)
    // this.list = list
    // return {
    //   list,
    //   source: 'xm',
    // }
    this.list = boardList
    return {
      list: boardList,
      source: 'xm',
    }
  },
  getList(bangid, page, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    return this.getData(bangid).then(({ statusCode, body }) => {
      if (statusCode !== 200 || body.code !== 'SUCCESS') return this.getList(bangid, page, retryNum)
      // console.log(body)
      const list = this.filterData(body.result.data.billboard.songs)

      return {
        total: parseInt(body.result.data.billboard.attributeMap.item_size),
        list,
        limit: this.limit,
        page,
        source: 'xm',
      }
    })
  },
}
