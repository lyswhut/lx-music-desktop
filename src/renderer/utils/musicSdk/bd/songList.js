import { httpFetch } from '../../request'
import { formatPlayTime, toMD5 } from '../../index'
import CryptoJS from 'crypto-js'

export default {
  _requestObj_tags: null,
  _requestObj_list: null,
  _requestObj_listRecommend: null,
  limit_list: 30,
  limit_song: 10000,
  successCode: 22000,
  sortList: [
    {
      name: '最热',
      id: '1',
    },
    {
      name: '最新',
      id: '0',
    },
  ],
  regExps: {
    // http://music.taihe.com/songlist/566347741
    listDetailLink: /^.+\/songlist\/(\d+)(?:\?.*|&.*$|#.*$|$)/,
  },
  aesPassEncod(jsonData) {
    let timestamp = Math.floor(Date.now() / 1000)
    let privateKey = toMD5('baidu_taihe_music_secret_key' + timestamp).substr(8, 16)
    let key = CryptoJS.enc.Utf8.parse(privateKey)
    let iv = CryptoJS.enc.Utf8.parse(privateKey)
    let arrData = []
    let strData = ''
    for (let key in jsonData) arrData.push(key)
    arrData.sort()
    for (let i = 0; i < arrData.length; i++) {
      let key = arrData[i]
      strData +=
        (i === 0 ? '' : '&') + key + '=' + encodeURIComponent(jsonData[key])
    }
    let JsonFormatter = {
      stringify(cipherParams) {
        let jsonObj = {
          ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
        }
        if (cipherParams.iv) {
          jsonObj.iv = cipherParams.iv.toString()
        }
        if (cipherParams.salt) {
          jsonObj.s = cipherParams.salt.toString()
        }
        return jsonObj
      },
      parse(jsonStr) {
        let jsonObj = JSON.parse(jsonStr)
        let cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct),
        })
        if (jsonObj.iv) {
          cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
        }
        if (jsonObj.s) {
          cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
        }
        return cipherParams
      },
    }
    let encrypted = CryptoJS.AES.encrypt(strData, key, {
      iv,
      blockSize: 16,
      mode: CryptoJS.mode.CBC,
      format: JsonFormatter,
    })
    let ciphertext = encrypted.toString().ct
    let sign = toMD5('baidu_taihe_music' + ciphertext + timestamp)
    let jsonRet = {
      timestamp,
      param: ciphertext,
      sign,
    }
    return jsonRet
  },
  createUrl(param, method) {
    let data = this.aesPassEncod(param)
    return `http://musicmini.qianqian.com/v1/restserver/ting?method=${method}&time=${Date.now()}&timestamp=${data.timestamp}&param=${data.param}&sign=${data.sign}`
  },
  getTagsUrl() {
    return this.createUrl({
      from: 'qianqianmini',
      type: 'diy',
      version: '10.1.8',
    }, 'baidu.ting.ugcdiy.getChannels')
  },
  getListUrl(sortType, tagName, page) {
    return this.createUrl({
      channelname: tagName || '全部',
      from: 'qianqianmini',
      offset: (page - 1) * this.limit_list,
      order_type: sortType,
      size: this.limit_list,
      version: '10.1.8',
    }, 'baidu.ting.ugcdiy.getChanneldiy')
  },
  getListDetailUrl(list_id, page) {
    return this.createUrl({
      list_id,
      offset: (page - 1) * this.limit_song,
      size: this.limit_song,
      withcount: '1',
      withsong: '1',
    }, 'baidu.ting.ugcdiy.getBaseInfo')
  },

  // 获取标签
  getTags(tryNum = 0) {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = httpFetch(this.getTagsUrl())
    return this._requestObj_tags.promise.then(({ body }) => {
      if (body.error_code !== this.successCode) return this.getTags(++tryNum)
      return {
        hotTag: this.filterInfoHotTag(body.result.hot),
        tags: this.filterTagInfo(body.result.tags),
        source: 'bd',
      }
    })
  },
  filterInfoHotTag(rawList) {
    return rawList.map(item => ({
      name: item,
      id: item,
      source: 'bd',
    }))
  },
  filterTagInfo(rawList) {
    return rawList.map(type => ({
      name: type.first,
      list: type.second.map(item => ({
        parent_id: type.first,
        parent_name: type.first,
        id: item,
        name: item,
        source: 'bd',
      })),
    }))
  },

  // 获取列表数据
  getList(sortId, tagId, page, tryNum = 0) {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_list = httpFetch(this.getListUrl(sortId, tagId, page))
    return this._requestObj_list.promise.then(({ body }) => {
      if (body.error_code !== this.successCode) return this.getList(sortId, tagId, page, ++tryNum)
      return {
        list: this.filterList(body.diyInfo),
        total: body.nums,
        page,
        limit: this.limit_list,
        source: 'bd',
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
      play_count: this.formatPlayCount(item.listen_num),
      id: String(item.list_id),
      author: item.username,
      name: item.title,
      // time: item.publish_time,
      img: item.list_pic_large || item.list_pic,
      grade: item.grade,
      desc: item.desc || item.tag,
      source: 'bd',
    }))
  },

  // 获取歌曲列表内的音乐
  getListDetail(id, page, tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))

    if ((/[?&:/]/.test(id))) id = id.replace(this.regExps.listDetailLink, '$1')

    const requestObj_listDetail = httpFetch(this.getListDetailUrl(id, page))
    return requestObj_listDetail.promise.then(({ body }) => {
      if (body.error_code !== this.successCode) return this.getListDetail(id, page, ++tryNum)
      let listData = this.filterData(body.result.songlist)
      return {
        list: listData,
        page,
        limit: this.limit_song,
        total: body.result.song_num,
        source: 'bd',
        info: {
          name: body.result.info.list_title,
          img: body.result.info.list_pic,
          desc: body.result.info.list_desc,
          author: body.result.info.userinfo.username,
          play_count: this.formatPlayCount(body.result.listen_num),
        },
      }
    })
  },
  filterData(rawList) {
    // console.log(rawList)
    return rawList.map(item => {
      const types = []
      const _types = {}
      let size = null
      let itemTypes = item.all_rate.split(',')
      if (itemTypes.includes('128')) {
        types.push({ type: '128k', size })
        _types['128k'] = {
          size,
        }
      }
      if (itemTypes.includes('320')) {
        types.push({ type: '320k', size })
        _types['320k'] = {
          size,
        }
      }
      if (itemTypes.includes('flac')) {
        types.push({ type: 'flac', size })
        _types.flac = {
          size,
        }
      }
      // types.reverse()

      return {
        singer: item.author.replace(',', '、'),
        name: item.title,
        albumName: item.album_title,
        albumId: item.album_id,
        source: 'bd',
        interval: formatPlayTime(parseInt(item.file_duration)),
        songmid: item.song_id,
        img: item.pic_s500,
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
