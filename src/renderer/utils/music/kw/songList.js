import { httpFatch } from '../../request'
import { formatPlayTime, decodeName } from '../../index'
import { formatSinger } from './util'

export default {
  _requestObj_tags: null,
  _requestObj_hotTags: null,
  _requestObj_list: null,
  _requestObj_listDetail: null,
  limit_list: 100,
  limit_song: 25,
  successCode: 200,
  sortList: [
    {
      name: '最热',
      tabId: 'kwhot',
      id: 'hot',
    },
    {
      name: '最新',
      tabId: 'kwnew',
      id: 'new',
    },
  ],
  tagsUrl: 'http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576',
  hotTagUrl: 'http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmTagList?loginUid=0&loginSid=0&appUid=76039576',
  getListUrl({ sortType, id, page }) {
    return id
      ? `http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&id=${id}&pn=${page}&rn=${this.limit}`
      : `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page}&rn=${this.limit}&order=${sortType}`
  },
  getListDetailUrl(id, page) {
    return `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${id}&pn=${page - 1}&rn=${this.limit}&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1`
  },


  // 获取标签
  getTags() {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    this._requestObj_tags = httpFatch(this.tagsUrl)
    return this._requestObj_tags.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getTags()
      return this.filterTagInfo(body.data.tags)
    })
  },
  // 获取标签
  getHotTags() {
    if (this._requestObj_hotTags) this._requestObj_hotTags.cancelHttp()
    this._requestObj_hotTags = httpFatch(this.hotTagUrl)
    return this._requestObj_hotTags.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getHotTags()
      return this.filterInfoHotTag(body.data.data)
    })
  },
  filterInfoHotTag(rawList) {
    return rawList.map(item => ({
      id: item.id,
      name: item.name,
    }))
  },
  filterTagInfo(rawList) {
    return rawList.map(type => ({
      type: type.name,
      list: type.data.map(item => ({
        parent_id: type.id,
        parent_name: type.name,
        id: item.id,
        name: item.name,
      })),
    }))
  },

  // 获取列表数据
  getList(sortId, tagId, page) {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    this._requestObj_list = httpFatch(
      this.getListUrl({ sortId, id: tagId, page })
    )
    return this._requestObj_list.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getList({ sortId, id: tagId, page })
      return {
        list: this.filterList(body.data.data),
        total: body.data.total,
        page: body.data.pn,
        limit: body.data.rn,
      }
    })
  },


  /**
   * 格式化播放数量
   * @param {*} num
   */
  formatPlayCount(num) {
    if (num > 100000000) return parseInt(num / 10000000) / 10 + '亿'
    if (num > 10000) return parseInt(num / 1000) / 10 + '万'
    return num
  },
  filterList(rawData) {
    return rawData.map(item => ({
      play_count: this.formatPlayCount(item.listencnt),
      id: item.id,
      author: item.uname,
      name: item.name,
      // time: item.publish_time,
      img: item.img,
      grade: item.favorcnt / 10,
      desc: item.desc,
    }))
  },

  // 获取歌曲列表内的音乐
  getListDetail(id, page) {
    if (this._requestObj_listDetail) {
      this._requestObj_listDetail.cancelHttp()
    }
    this._requestObj_listDetail = httpFatch(this.getListDetailUrl(id, page))
    return this._requestObj_listDetail.promise.then(({ body }) => {
      if (body.result !== 'ok') return this.getListDetail(id, page)
      return {
        list: this.filterListDetail(body.data.musiclist),
        page,
        limit: body.rn,
        total: body.total,
      }
    })
  },
  filterListDetail(rawData) {
    // console.log(rawList)
    return rawData.map((item, inedx) => {
      let formats = item.formats.split('|')
      let types = []
      let _types = {}
      if (formats.indexOf('MP3128')) {
        types.push({ type: '128k', size: null })
        _types['128k'] = {
          size: null,
        }
      }
      if (formats.indexOf('MP3H')) {
        types.push({ type: '320k', size: null })
        _types['320k'] = {
          size: null,
        }
      }
      if (formats.indexOf('ALFLAC')) {
        types.push({ type: 'flac', size: null })
        _types['flac'] = {
          size: null,
        }
      }

      return {
        singer: formatSinger(decodeName(item.artist)),
        name: decodeName(item.name),
        albumName: decodeName(item.album),
        albumId: item.albumid,
        songmid: item.id,
        source: 'kw',
        interval: formatPlayTime(parseInt(item.duration)),
        img: null,
        lrc: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },

}

// getList
// getTags
// getListDetail
