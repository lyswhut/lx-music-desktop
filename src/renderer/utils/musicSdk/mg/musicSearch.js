import { httpFetch } from '../../request'
import { sizeFormate, formatPlayTime } from '../../index'
import { toMD5 } from '../utils'

export default {
  limit: 20,
  total: 0,
  page: 0,
  allPage: 1,
  musicSearch(str, page, limit) {
    const time = Date.now().toString()
    const signData = this.signWithSearch(time, str)
    const searchRequest = httpFetch(`https://jadeite.migu.cn/music_search/v3/search/searchAll?pageNo=${page}&pageSize=${limit}&sort=0&text=${encodeURI(str)}&searchSwitch={"song":1}&isCopyright=1&isCorrect=1`, {
      headers: {
        uiVersion: 'A_music_3.6.1',
        deviceId: signData.deviceId,
        timestamp: time,
        sign: signData.sign,
        channel: '0146921',
        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 11.0.0; zh-cn; MI 11 Build/OPR1.170623.032) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
      },
    })
    // searchRequest = httpFetch(`https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/search_all.do?isCopyright=1&isCorrect=1&pageNo=${page}&pageSize=${limit}&searchSwitch={%22song%22:1,%22album%22:0,%22singer%22:0,%22tagSong%22:0,%22mvSong%22:0,%22songlist%22:0,%22bestShow%22:0}&sort=0&text=${encodeURIComponent(str)}`)
    return searchRequest.promise.then(({ body }) => body)
  },
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.name)
    })
    return arr.join('、')
  },
  async getMusicInfo(copyrightIds) {
    return httpFetch('https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?resourceType=2', {
      method: 'POST',
      formData: { resourceId: copyrightIds },
    }).promise.then(({ body }) => {
      if (body.code !== '000000') return Promise.reject(new Error('Failed to get music info.'))
      return body.resource
    })
  },
  signWithSearch(time, str) {
    const deviceId = '963B7AA0D21511ED807EE5846EC87D16'
    const signatureMd5 = '6cdc72a439cef99a3418d2a78aa28c73'
    const sign = toMD5(`${str}${signatureMd5}yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${time}`)
    return { sign, deviceId }
  },
  filterData(rawData) {
    // console.log(rawData)
    const list = new Map()
    const ids = new Set()

    rawData.forEach(item => {
      item.forEach(data => {
        if (ids.has(data.copyrightId) || !data.songId || !data.copyrightId) return
        ids.add(data.copyrightId)

        const types = []
        const _types = {}
        data.audioFormats && data.audioFormats.forEach(type => {
          let size
          switch (type.formatType) {
            case 'PQ':
              size = sizeFormate(type.asize ?? type.isize)
              types.push({ type: '128k', size })
              _types['128k'] = {
                size,
              }
              break
            case 'HQ':
              size = sizeFormate(type.asize ?? type.isize)
              types.push({ type: '320k', size })
              _types['320k'] = {
                size,
              }
              break
            case 'SQ':
              size = sizeFormate(type.asize ?? type.isize)
              types.push({ type: 'flac', size })
              _types.flac = {
                size,
              }
              break
            case 'ZQ24':
              size = sizeFormate(type.asize ?? type.isize)
              types.push({ type: 'flac24bit', size })
              _types.flac24bit = {
                size,
              }
              break
          }
        })

        list.set(data.songId, {
          singer: this.getSinger(data.singerList),
          name: data.name,
          albumName: data.album,
          albumId: data.albumId,
          songmid: data.copyrightId,
          songId: data.songId,
          copyrightId: data.copyrightId,
          source: 'mg',
          interval: formatPlayTime(data.duration),
          img: /https?:/.test(data.img3) ? data.img3 : 'http://d.musicapp.migu.cn' + data.img3,
          lrc: null,
          lrcUrl: data.lrcUrl,
          mrcUrl: data.mrcurl,
          trcUrl: data.trcUrl,
          otherSource: null,
          types,
          _types,
          typeUrl: {},
        })
      })
    })
    return list
  },
  async handleResult(rawData) {
    // console.log(rawData)
    const list = []
    const datas = this.filterData(rawData)
    if (!datas) throw new Error('Failed to filter data')
    const songInfo = await this.getMusicInfo([...datas.keys()].join('|'))
    songInfo.forEach(item => {
      let data = datas.get(item.songId)
      if (!data) return
      list.push({
        ...data,
        lrcUrl: item.lrcUrl,
        mrcUrl: item.mrcUrl,
        trcUrl: item.trcUrl,
      })
    })
    return list
  },
  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit
    // http://newlyric.kuwo.cn/newlyric.lrc?62355680
    return this.musicSearch(str, page, limit).then(async result => {
      // console.log(result)
      if (!result || result.code !== '000000') return Promise.reject(new Error(result ? result.info : '搜索失败'))
      const songResultData = result.songResultData || { result: [], totalCount: 0 }

      let list = await this.handleResult(songResultData.resultList)
      if (list == null) return this.search(str, page, limit, retryNum)

      this.total = parseInt(songResultData.totalCount)
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        limit,
        total: this.total,
        source: 'mg',
      })
    })
  },
}
