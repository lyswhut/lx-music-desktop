import { httpFetch } from '../../request'
import { formatPlayTime, decodeName } from '../../index'
import { formatSinger } from './util'
import album from './album'

export default {
  _requestObj_tags: null,
  _requestObj_hotTags: null,
  _requestObj_list: null,
  _requestObj_listDetail: null,
  limit_list: 36,
  limit_song: 10000,
  successCode: 200,
  sortList: [
    {
      name: '最新',
      id: 'new',
    },
    {
      name: '最热',
      id: 'hot',
    },
  ],
  regExps: {
    mInfo: /bitrate:(\d+),format:(\w+),size:([\w.]+)/,
    // http://www.kuwo.cn/playlist_detail/2886046289
    // https://m.kuwo.cn/h5app/playlist/2736267853?t=qqfriend
    listDetailLink: /^.+\/playlist(?:_detail)?\/(\d+)(?:\?.*|&.*$|#.*$|$)/,
  },
  tagsUrl: 'http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576',
  hotTagUrl: 'http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmTagList?loginUid=0&loginSid=0&appUid=76039576',
  getListUrl({ sortId, id, type, page }) {
    if (!id) return `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&&pn=${page}&rn=${this.limit_list}&order=${sortId}`
    switch (type) {
      case '10000': return `http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page}&id=${id}&rn=${this.limit_list}`
      case '43': return `http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=${id}&prod=pc`
    }
    // http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&id=173&pn=1&rn=100
  },
  getListDetailUrl(id, page) {
    // http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=2858093057&pn=0&rn=100&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1
    return `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${id}&pn=${page - 1}&rn=${this.limit_song}&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1`
    // http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=140&prod=pc
  },

  // http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=2849349915&pn=0&rn=100&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1
  // 获取标签
  getTag(tryNum = 0) {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = httpFetch(this.tagsUrl)
    return this._requestObj_tags.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getTag(++tryNum)
      return this.filterTagInfo(body.data)
    })
  },
  // 获取标签
  getHotTag(tryNum = 0) {
    if (this._requestObj_hotTags) this._requestObj_hotTags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_hotTags = httpFetch(this.hotTagUrl)
    return this._requestObj_hotTags.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getHotTag(++tryNum)
      return this.filterInfoHotTag(body.data[0].data)
    })
  },
  filterInfoHotTag(rawList) {
    return rawList.map(item => ({
      id: `${item.id}-${item.digest}`,
      name: item.name,
      source: 'kw',
    }))
  },
  filterTagInfo(rawList) {
    return rawList.map(type => ({
      name: type.name,
      list: type.data.map(item => ({
        parent_id: type.id,
        parent_name: type.name,
        id: `${item.id}-${item.digest}`,
        name: item.name,
        source: 'kw',
      })),
    }))
  },

  // 获取列表数据
  getList(sortId, tagId, page, tryNum = 0) {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    let id
    let type
    if (tagId) {
      let arr = tagId.split('-')
      id = arr[0]
      type = arr[1]
    } else {
      id = null
    }
    this._requestObj_list = httpFetch(this.getListUrl({ sortId, id, type, page }))
    return this._requestObj_list.promise.then(({ body }) => {
      if (!id || type == '10000') {
        if (body.code !== this.successCode) return this.getList(sortId, tagId, page, ++tryNum)
        return {
          list: this.filterList(body.data.data),
          total: body.data.total,
          page: body.data.pn,
          limit: body.data.rn,
          source: 'kw',
        }
      } else if (!body.length) {
        return this.getList(sortId, id, type, page, ++tryNum)
      }
      return {
        list: this.filterList2(body),
        total: 1000,
        page,
        limit: 1000,
        source: 'kw',
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
      id: `digest-${item.digest}__${item.id}`,
      author: item.uname,
      name: item.name,
      // time: item.publish_time,
      img: item.img,
      grade: item.favorcnt / 10,
      desc: item.desc,
      source: 'kw',
    }))
  },
  filterList2(rawData) {
    // console.log(rawData)
    const list = []
    rawData.forEach(item => {
      if (!item.label) return
      list.push(...item.list.map(item => ({
        play_count: item.play_count && this.formatPlayCount(item.listencnt),
        id: `digest-${item.digest}__${item.id}`,
        author: item.uname,
        name: item.name,
        // time: item.publish_time,
        img: item.img,
        grade: item.favorcnt && item.favorcnt / 10,
        desc: item.desc,
        source: 'kw',
      })))
    })
    return list
  },

  getListDetailDigest8(id, page, tryNum = 0) {
    if (this._requestObj_listDetail) {
      this._requestObj_listDetail.cancelHttp()
    }
    if (tryNum > 2) return Promise.reject(new Error('try max num'))

    this._requestObj_listDetail = httpFetch(this.getListDetailUrl(id, page))
    return this._requestObj_listDetail.promise.then(({ body }) => {
      if (body.result !== 'ok') return this.getListDetail(id, page, ++tryNum)
      return {
        list: this.filterListDetail(body.musiclist),
        page,
        limit: body.rn,
        total: body.total,
        source: 'kw',
        info: {
          name: body.title,
          img: body.pic,
          desc: body.info,
          author: body.uname,
          play_count: this.formatPlayCount(body.playnum),
        },
      }
    })
  },
  getListDetailDigest5Info(id, tryNum = 0) {
    if (this._requestObj_listDetail) {
      this._requestObj_listDetail.cancelHttp()
    }
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_listDetail = httpFetch(`http://qukudata.kuwo.cn/q.k?op=query&cont=ninfo&node=${id}&pn=0&rn=1&fmt=json&src=mbox&level=2`)
    return this._requestObj_listDetail.promise.then(({ statusCode, body }) => {
      if (statusCode != 200 || !body.child) return this.getListDetail(id, ++tryNum)
      // console.log(body)
      return body.child.length ? body.child[0].sourceid : null
    })
  },
  getListDetailDigest5Music(id, page, tryNum = 0) {
    if (this._requestObj_listDetail) {
      this._requestObj_listDetail.cancelHttp()
    }
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_listDetail = httpFetch(`http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${id}&pn=${page - 1}}&rn=${this.limit_song}&encode=utf-8&keyset=pl2012&identity=kuwo&pcmp4=1`)
    return this._requestObj_listDetail.promise.then(({ body }) => {
      // console.log(body)
      if (body.result !== 'ok') return this.getListDetail(id, page, ++tryNum)
      return {
        list: this.filterListDetail(body.musiclist),
        page,
        limit: body.rn,
        total: body.total,
        source: 'kw',
        info: {
          name: body.title,
          img: body.pic,
          desc: body.info,
          author: body.uname,
          play_count: this.formatPlayCount(body.playnum),
        },
      }
    })
  },
  async getListDetailDigest5(id, page, retryNum) {
    const detailId = await this.getListDetailDigest5Info(id, retryNum)
    return this.getListDetailDigest5Music(detailId, page, retryNum)
  },

  // 获取歌曲列表内的音乐
  getListDetail(id, page, retryNum = 0) {
    // console.log(id)
    if ((/[?&:/]/.test(id))) id = id.replace(this.regExps.listDetailLink, '$1')
    else if (/^digest-/.test(id)) {
      let [digest, _id] = id.split('__')
      digest = digest.replace('digest-', '')
      id = _id
      switch (digest) {
        case '8':
          break
        case '13': return album.getAlbumListDetail(id, page, retryNum)
        case '5':
        default: return this.getListDetailDigest5(id, page, retryNum)
      }
    }
    return this.getListDetailDigest8(id, page, retryNum)
  },
  filterListDetail(rawData) {
    // console.log(rawData)
    return rawData.map(item => {
      let infoArr = item.MINFO.split(';')
      let types = []
      let _types = {}
      for (let info of infoArr) {
        info = info.match(this.regExps.mInfo)
        if (info) {
          switch (info[2]) {
            case 'flac':
              types.push({ type: 'flac', size: info[3] })
              _types.flac = {
                size: info[3].toLocaleUpperCase(),
              }
              break
            case 'mp3':
              switch (info[1]) {
                case '320':
                  types.push({ type: '320k', size: info[3] })
                  _types['320k'] = {
                    size: info[3].toLocaleUpperCase(),
                  }
                  break
                case '192':
                case '128':
                  types.push({ type: '128k', size: info[3] })
                  _types['128k'] = {
                    size: info[3].toLocaleUpperCase(),
                  }
                  break
              }
              break
          }
        }
      }
      types.reverse()

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
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  getTags() {
    return Promise.all([this.getTag(), this.getHotTag()]).then(([tags, hotTag]) => ({ tags, hotTag, source: 'kw' }))
  },
  getDetailPageUrl(id) {
    if ((/[?&:/]/.test(id))) id = id.replace(this.regExps.listDetailLink, '$1')
    else if (/^digest-/.test(id)) {
      let result = id.split('__')
      id = result[1]
    }
    return `http://www.kuwo.cn/playlist_detail/${id}`
  },
}

// getList
// getTags
// getListDetail
