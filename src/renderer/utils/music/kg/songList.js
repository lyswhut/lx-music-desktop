import { httpFatch } from '../../request'
import { formatPlayTime, sizeFormate } from '../../index'

export default {
  _requestObj_tagInfo: null,
  _requestObj_songList: null,
  _requestObj_songListRecommend: null,
  _requestObj_songListDetail: null,
  sortList: [
    {
      name: '推荐',
      id: '5',
    },
    {
      name: '最热',
      id: '6',
    },
    {
      name: '最新',
      id: '7',
    },
    {
      name: '热藏',
      id: '3',
    },
    {
      name: '飙升',
      id: '8',
    },
  ],
  regExps: {
    listData: /global\.data = (\[.+\]);/,
  },
  getInfoUrl(tagId) {
    return tagId
      ? `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&cdn=cdn&t=5&c=${tagId}`
      : `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&`
  },
  getSongListUrl(sortId, tagId, page) {
    return `http://www2.kugou.kugou.com/yueku/v9/special/index/getData/getData.html&cdn=cdn&t=${sortId}&c=${tagId}?is_ajax=1&p=${page}`
  },
  getSongListDetailUrl(id) {
    return `http://www2.kugou.kugou.com/yueku/v9/special/single/${id}-5-9999.html`
  },

  getTypeInfo(tagId) {
    if (this._requestObj_tagInfo) this._requestObj_tagInfo.cancelHttp()
    this._requestObj_tagInfo = httpFatch(this.getInfoUrl(tagId))
    return this._requestObj_tagInfo.promise.then(({ body }) => {
      if (body.status !== 1) return this.getTypeInfo(tagId)
      return {
        hotTag: this.filterInfoHotTag(body.data.hotTag),
        tags: this.filterTagInfo(),
        tagInfo: {
          limit: body.data.params.pagesize,
          page: body.data.params.p,
          total: body.data.params.total,
        },
      }
    })
  },
  filterInfoHotTag(rawData) {
    const result = []
    if (rawData.status !== 1) return result
    for (let index = 0; index < Object.keys(rawData.data).lengt; index++) {
      let tag = rawData.data[index.toString()]
      result.push({
        id: tag.id,
        name: tag.special_name,
      })
    }
    return result
  },
  filterTagInfo(rawData) {
    const result = []
    for (const type of Object.keys(rawData)) {
      result.push({
        type,
        list: rawData[type].map(tag => ({
          parent_id: tag.parent_id,
          parent_name: tag.pname,
          id: tag.id,
          name: tag.name,
        })),
      })
    }
  },

  getSongList(sortId, tagId, page) {
    if (this._requestObj_songList) this._requestObj_songList.cancelHttp()
    this._requestObj_songList = httpFatch(
      this.getSongListUrl(sortId, tagId, page)
    )
    return this._requestObj_songList.promise.then(({ body }) => {
      if (body.status !== 1) return this.getSongList(sortId, tagId, page)
      return this.filterSongList(body.data)
    })
  },
  getSongListRecommend() {
    if (this._requestObj_songListRecommend) this._requestObj_songListRecommend.cancelHttp()
    this._requestObj_songListRecommendRecommend = httpFatch(
      'http://everydayrec.service.kugou.com/guess_special_recommend',
      {
        method: 'post',
        headers: {
          'User-Agent': 'KuGou2012-8275-web_browser_event_handler',
        },
        body: {
          appid: 1001,
          clienttime: 1566798337219,
          clientver: 8275,
          key: 'f1f93580115bb106680d2375f8032d96',
          mid: '21511157a05844bd085308bc76ef3343',
          platform: 'pc',
          userid: '262643156',
          return_min: 6,
          return_max: 15,
        },
      }
    )
    return this._requestObj_songListRecommend.promise.then(({ body }) => {
      if (body.status !== 1) return this.getSongListRecommend()
      return this.filterSongList(body.data)
    })
  },
  filterSongList(rawData) {
    return rawData.map(item => ({
      play_count: item.play_count,
      total_play_count: item.total_play_count,
      id: item.specialid,
      author: item.nickname,
      name: item.specialname,
      time: item.publish_time,
      img: item.img,
      grade: item.grade,
      desc: item.intro,
    }))
  },

  getSongListDetail(id) { // 获取歌曲列表内的音乐
    if (this._requestObj_songListDetail) this._requestObj_songListDetail.cancelHttp()
    this._requestObj_songListDetail = httpFatch(this.getSongListDetailUrl(id))
    return this._requestObj_songListDetail.promise.then(({ body }) => {
      let listData = body.match(this.regExps.listData)
      if (listData) listData = this.filterData(JSON.parse(RegExp.$1))
      return listData
    })
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
        singer: item.singername,
        name: item.songname,
        albumName: item.album_name,
        albumId: item.album_id,
        songmid: item.audio_id,
        source: 'kg',
        interval: formatPlayTime(item.duration / 1000),
        img: null,
        lrc: null,
        hash: item.HASH,
        types,
        _types,
        typeUrl: {},
      }
    })
  },

  getListInfo(tagId) { // 获取列表信息
    return this.getTypeInfo(tagId).then(info => {
      return {
        limit: info.tagInfo.limit,
        page: info.tagInfo.page,
        total: info.tagInfo.total,
      }
    })
  },

  getList(sortId, tagId, page) { // 获取列表数据
    let tasks = [this.getSongList(sortId, tagId, page)]
    if (!tagId) tasks.push(this.getSongListRecommend())
    Promise.all(tasks).then(([list, recommendList]) => {
      if (recommendList) list.unshift(...recommendList)
      return list
    })
  },

  getTags() { // 获取标签
    return this.getTypeInfo().then(info => {
      return {
        hotTag: info.hotTag,
        tags: info.tags,
      }
    })
  },
}
