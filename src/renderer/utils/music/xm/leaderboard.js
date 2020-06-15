import { xmRequest } from './util'
import { formatPlayTime, sizeFormate } from '../../index'
// import jshtmlencode from 'js-htmlencode'

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
  requestObj: null,
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
        lrc: null,
        lrcUrl: songData.lyricInfo && songData.lyricInfo.lyricFile,
        types,
        _types,
        typeUrl: {},
      })
    })

    return list
  },
  getList(id, page, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    let type = this.list.find(s => s.id === id)
    if (!type) return Promise.reject()
    return this.getData(type.bangid).then(({ statusCode, body }) => {
      if (statusCode !== 200 || body.code !== 'SUCCESS') return this.getList(id, page, retryNum)
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
