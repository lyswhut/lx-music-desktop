import { httpFetch } from '../../../request'
import { formatSingerName } from '../../utils'
import { decodeName, formatPlayTime, sizeFormate, dateFormat, formatPlayCount } from '../../../index'
import { signatureParams, createHttpFetch } from './../util'
import { getMusicInfosByList } from '../musicInfo'
import album from '../album'

export default {
  _requestObj_tags: null,
  _requestObj_listInfo: null,
  _requestObj_list: null,
  _requestObj_listRecommend: null,
  listDetailLimit: 10000,
  currentTagInfo: {
    id: undefined,
    info: undefined,
  },
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
  cache: new Map(),
  collectionIdListInfoCache: new Map(),
  regExps: {
    listData: /global\.data = (\[.+\]);/,
    listInfo: /global = {[\s\S]+?name: "(.+)"[\s\S]+?pic: "(.+)"[\s\S]+?};/,
    // https://www.kugou.com/yy/special/single/1067062.html
    listDetailLink: /^.+\/(\d+)\.html(?:\?.*|&.*$|#.*$|$)/,
  },

  /**
   * 获取歌曲列表内的音乐
   * @param {*} id
   * @param {*} page
   */
  async getListDetail(id, page) {
    id = id.toString()

    if (id.includes('special/single/')) id = id.replace(this.regExps.listDetailLink, '$1')
    // fix https://www.kugou.com/songlist/xxx/?uid=xxx&chl=qq_client&cover=http%3A%2F%2Fimge.kugou.com%xxx.jpg&iszlist=1
    if (/https?:/.test(id)) {
      if (id.includes('#')) id = id.replace(/#.*$/, '')
      if (id.includes('global_collection_id')) return this.getUserListDetailByCollectionId(id.replace(/^.*?global_collection_id=(\w+)(?:&.*$|#.*$|$)/, '$1'), page)
      if (id.includes('chain=')) return this.getUserListDetail3(id.replace(/^.*?chain=(\w+)(?:&.*$|#.*$|$)/, '$1'), page)
      if (id.includes('.html')) {
        if (id.includes('zlist.html')) {
          id = id.replace(/^(.*)zlist\.html/, 'https://m3ws.kugou.com/zlist/list')
          if (id.includes('pagesize')) {
            id = id.replace('pagesize=30', 'pagesize=' + this.listDetailLimit).replace('page=1', 'page=' + page)
          } else {
            id += `&pagesize=${this.listDetailLimit}&page=${page}`
          }
        } else if (!id.includes('song.html')) return this.getUserListDetail3(id.replace(/.+\/(\w+).html(?:\?.*|&.*$|#.*$|$)/, '$1'), page)
      }
      return this.getUserListDetail(id.replace(/^.*?http/, 'http'), page)
    }
    if (/^\d+$/.test(id)) return this.getUserListDetailByCode(id, page)
    if (id.startsWith('gid_')) return this.getUserListDetailByCollectionId(id.replace('gid_', ''), page)
    if (id.startsWith('id_')) return this.getUserListDetailBySpecialId(id.replace('id_', ''), page)

    return new Error('Failed.')
  },

  /**
   * 获取SpecialId歌单
   * @param {*} id
   */
  async getUserListDetailBySpecialId(id, page, tryNum = 0) {
    if (tryNum > 2) throw new Error('try max num')

    const { body } = await httpFetch(this.getSongListDetailUrl(id)).promise
    let listData = body.match(this.regExps.listData)
    let listInfo = body.match(this.regExps.listInfo)
    if (!listData) return this.getListDetailBySpecialId(id, page, ++tryNum)
    let list = await getMusicInfosByList(JSON.parse(listData[1]))
    let name
    let pic
    if (listInfo) {
      name = listInfo[1]
      pic = listInfo[2]
    }
    let desc = this.parseHtmlDesc(body)


    return {
      list,
      page: 1,
      limit: 10000,
      total: list.length,
      source: 'kg',
      info: {
        name,
        img: pic,
        desc,
        // author: body.result.info.userinfo.username,
        // play_count: formatPlayCount(body.result.listen_num),
      },
    }
  },
  parseHtmlDesc(html) {
    const prefix = '<div class="pc_specail_text pc_singer_tab_content" id="specailIntroduceWrap">'
    let index = html.indexOf(prefix)
    if (index < 0) return null
    const afterStr = html.substring(index + prefix.length)
    index = afterStr.indexOf('</div>')
    if (index < 0) return null
    return decodeName(afterStr.substring(0, index))
  },

  /**
   * 使用SpecialId获取CollectionId
   * @param {*} specialId
   */
  async getCollectionIdBySpecialId(specialId) {
    return httpFetch(`http://mobilecdnbj.kugou.com/api/v5/special/info?specialid=${specialId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; HLK-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.102 Mobile Safari/537.36 EdgA/104.0.1293.70',
      },
    }).promise.then(({ body }) => {
      // console.log('getCollectionIdBySpecialId', body)
      if (!body.data.global_specialid) return Promise.reject(new Error('Failed to get global collection id.'))
      return body.data.global_specialid
    })
  },

  /**
   * 获取歌单URL
   * @param {*} sortId
   * @param {*} tagId
   * @param {*} page
   */
  getSongListUrl(sortId, tagId, page) {
    if (tagId == null) tagId = ''
    return `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_ajax=1&cdn=cdn&t=${sortId}&c=${tagId}&p=${page}`
  },
  getInfoUrl(tagId) {
    return tagId
      ? `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&cdn=cdn&t=5&c=${tagId}`
      : 'http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&'
  },
  getSongListDetailUrl(id) {
    return `http://www2.kugou.kugou.com/yueku/v9/special/single/${id}-5-9999.html`
  },

  filterInfoHotTag(rawData) {
    const result = []
    if (rawData.status !== 1) return result
    for (const key of Object.keys(rawData.data)) {
      let tag = rawData.data[key]
      result.push({
        id: tag.special_id,
        name: tag.special_name,
        source: 'kg',
      })
    }
    return result
  },

  filterTagInfo(rawData) {
    const result = []
    for (const name of Object.keys(rawData)) {
      result.push({
        name,
        list: rawData[name].data.map(tag => ({
          parent_id: tag.parent_id,
          parent_name: tag.pname,
          id: tag.id,
          name: tag.name,
          source: 'kg',
        })),
      })
    }
    return result
  },
  filterSongList(rawData) {
    return rawData.map(item => ({
      play_count: item.total_play_count || formatPlayCount(item.play_count),
      id: 'id_' + item.specialid,
      author: item.nickname,
      name: item.specialname,
      time: dateFormat(item.publish_time || item.publishtime, 'Y-M-D'),
      img: item.img || item.imgurl,
      total: item.songcount,
      grade: item.grade,
      desc: item.intro,
      source: 'kg',
    }))
  },

  getSongList(sortId, tagId, page, tryNum = 0) {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_list = httpFetch(
      this.getSongListUrl(sortId, tagId, page),
    )
    return this._requestObj_list.promise.then(({ body }) => {
      if (!body || body.status !== 1) return this.getSongList(sortId, tagId, page, ++tryNum)
      return this.filterSongList(body.special_db)
    })
  },
  getSongListRecommend(tryNum = 0) {
    if (this._requestObj_listRecommend) this._requestObj_listRecommend.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_listRecommend = httpFetch(
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
      },
    )
    return this._requestObj_listRecommend.promise.then(({ body }) => {
      if (body.status !== 1) return this.getSongListRecommend(++tryNum)
      return this.filterSongList(body.data.special_list)
    })
  },

  /**
   * 通过CollectionId获取歌单详情
   * @param {*} id
   */
  async getUserListInfoByCollectionId(id) {
    if (!id || id.length > 1000) return Promise.reject(new Error('get list error'))
    if (this.collectionIdListInfoCache.has(id)) return this.collectionIdListInfoCache.get(id)

    const params = `appid=1058&specialid=0&global_specialid=${id}&format=jsonp&srcappid=2919&clientver=20000&clienttime=1586163242519&mid=1586163242519&uuid=1586163242519&dfid=-`
    return createHttpFetch(`https://mobiles.kugou.com/api/v5/special/info_v2?${params}&signature=${signatureParams(params, 5)}`, {
      headers: {
        mid: '1586163242519',
        Referer: 'https://m3ws.kugou.com/share/index.php',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        dfid: '-',
        clienttime: '1586163242519',
      },
    }).then(body => {
      let info = {
        type: body.type,
        userName: body.nickname,
        userAvatar: body.user_avatar,
        imageUrl: body.imgurl,
        desc: body.intro,
        name: body.specialname,
        globalSpecialid: body.global_specialid,
        total: body.songcount,
        playCount: body.playcount,
      }

      this.collectionIdListInfoCache.set(id, info)
      return info
    })
  },
  /**
   * 通过SpecialId获取歌单
   * @param {*} id
   */
  // async getUserListDetailBySpecialId(id, page = 1, limit = 300) {
  //   if (!id || id.length > 1000) return Promise.reject(new Error('get list error.'))
  //   const listInfo = await this.getListInfoBySpecialId(id)

  //   const params = `specialid=${id}&need_sort=1&module=CloudMusic&clientver=11589&pagesize=${limit}&userid=0&page=${page}&type=0&area_code=1&appid=1005`
  //   return createHttpFetch(`http://pubsongs.kugou.com/v2/get_other_list_file?${params}&signature=${signatureParams(params, 2)}`, {
  //     headers: {
  //       'User-Agent': 'Android10-AndroidPhone-11589-201-0-playlist-wifi',
  //     },
  //   }).then(body => {
  //     if (!body.info) return Promise.reject(new Error('Get list failed.'))
  //     const songList = this.filterListByCollectionId(body.info)

  //     return {
  //       list: songList || [],
  //       page,
  //       limit,
  //       total: body.count,
  //       source: 'kg',
  //       info: {
  //         name: listInfo.name,
  //         img: listInfo.image,
  //         desc: listInfo.desc,
  //         // author: listInfo.userName,
  //         // play_count: formatPlayCount(listInfo.playCount),
  //       },
  //     }
  //   })
  // },
  /**
   * 通过CollectionId获取歌单
   * @param {*} id
   */
  async getUserListDetailByCollectionId(id, page = 1, limit = 300) {
    if (!id || id.length > 1000) return Promise.reject(new Error('ID error.'))
    const listInfo = await this.getUserListInfoByCollectionId(id)

    const params = `need_sort=1&module=CloudMusic&clientver=11589&pagesize=${limit}&global_collection_id=${id}&userid=0&page=${page}&type=0&area_code=1&appid=1005`
    return createHttpFetch(`http://pubsongs.kugou.com/v2/get_other_list_file?${params}&signature=${signatureParams(params, 2)}`, {
      headers: {
        'User-Agent': 'Android10-AndroidPhone-11589-201-0-playlist-wifi',
      },
    }).then(body => {
      if (!body.info) return Promise.reject(new Error('Get list failed.'))
      const songList = this.filterListByCollectionId(body.info)

      return {
        list: songList || [],
        page,
        limit,
        total: listInfo.total,
        source: 'kg',
        info: {
          name: listInfo.name,
          img: listInfo.imageUrl && listInfo.imageUrl.replace('{size}', 240),
          desc: listInfo.desc,
          author: listInfo.userName,
          play_count: formatPlayCount(listInfo.playCount),
        },
      }
    })
  },
  /**
   * 过滤GlobalSpecialId歌单数据
   * @param {*} rawData
   */
  filterListByCollectionId(rawData) {
    let ids = new Set()
    let list = []
    rawData.forEach(item => {
      if (!item) return
      if (ids.has(item.hash)) return
      ids.add(item.hash)
      const types = []
      const _types = {}

      item.relate_goods.forEach(data => {
        let size = sizeFormate(data.size)
        switch (data.level) {
          case 2:
            types.push({ type: '128k', size, hash: data.hash })
            _types['128k'] = {
              size,
              hash: data.hash,
            }
            break
          case 4:
            types.push({ type: '320k', size, hash: data.hash })
            _types['320k'] = {
              size,
              hash: data.hash,
            }
            break
          case 5:
            types.push({ type: 'flac', size, hash: data.hash })
            _types.flac = {
              size,
              hash: data.hash,
            }
            break
          case 6:
            types.push({ type: 'flac24bit', size, hash: data.hash })
            _types.flac24bit = {
              size,
              hash: data.hash,
            }
            break
        }
      })

      list.push({
        singer: formatSingerName(item.singerinfo, 'name') || decodeName(item.name).split(' - ')[0].replace(/&/g, '、'),
        name: decodeName(item.name).split(' - ')[1],
        albumName: decodeName(item.albuminfo.name),
        albumId: item.albuminfo.id,
        songmid: item.audio_id,
        source: 'kg',
        interval: formatPlayTime(parseInt(item.timelen) / 1000),
        img: null,
        lrc: null,
        hash: item.hash,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },
  /**
   * 通过酷狗码获取歌单
   * @param {*} id
   * @param {*} page
   */
  async getUserListDetailByCode(id, page = 1) {
    // type 1单曲，2歌单，3电台，4酷狗码，5别人的播放队列
    const codeData = await createHttpFetch('http://t.kugou.com/command/', {
      method: 'POST',
      headers: {
        'KG-RC': 1,
        'KG-THash': 'network_super_call.cpp:3676261689:379',
        'User-Agent': '',
      },
      body: { appid: 1001, clientver: 9020, mid: '21511157a05844bd085308bc76ef3343', clienttime: 640612895, key: '36164c4015e704673c588ee202b9ecb8', data: id },
    })
    if (!codeData) return Promise.reject(new Error('Get list failed.'))
    const codeInfo = codeData.info

    switch (codeInfo.type) {
      case 2:
        if (!codeInfo.global_collection_id) return this.getUserListDetailBySpecialId(codeInfo.id, page)
        break
      case 3:
        return album.getAlbumDetail(codeInfo.id, page)
    }
    if (codeInfo.global_collection_id) return this.getUserListDetailByCollectionId(codeInfo.global_collection_id, page)

    if (codeInfo.userid != null) {
      const songList = await createHttpFetch('http://www2.kugou.kugou.com/apps/kucodeAndShare/app/', {
        method: 'POST',
        headers: {
          'KG-RC': 1,
          'KG-THash': 'network_super_call.cpp:3676261689:379',
          'User-Agent': '',
        },
        body: { appid: 1001, clientver: 9020, mid: '21511157a05844bd085308bc76ef3343', clienttime: 640612895, key: '36164c4015e704673c588ee202b9ecb8', data: { id: codeInfo.id, type: 3, userid: codeInfo.userid, collect_type: 0, page: 1, pagesize: codeInfo.count } },
      })
      // console.log(songList)
      let list = await getMusicInfosByList(songList || codeInfo.list)
      return {
        list,
        page: 1,
        limit: codeInfo.count,
        total: list.length,
        source: 'kg',
        info: {
          name: codeInfo.name,
          img: (codeInfo.img_size && codeInfo.img_size.replace('{size}', 240)) || codeInfo.img,
          // desc: body.result.info.list_desc,
          author: codeInfo.username,
          // play_count: formatPlayCount(info.count),
        },
      }
    }
  },

  async getUserListDetail3(chain, page) {
    const songInfo = await createHttpFetch(`http://m.kugou.com/schain/transfer?pagesize=${this.listDetailLimit}&chain=${chain}&su=1&page=${page}&n=0.7928855356604456`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
      },
    })
    if (!songInfo.list) {
      if (songInfo.global_collection_id) return this.getUserListDetailByCollectionId(songInfo.global_collection_id, page)
      else return this.getUserListDetail4(songInfo, chain, page).catch(() => this.getUserListDetail5(chain))
    }
    let list = await getMusicInfosByList(songInfo.list)
    // console.log(info, songInfo)
    return {
      list,
      page: 1,
      limit: this.listDetailLimit,
      total: list.length,
      source: 'kg',
      info: {
        name: songInfo.info.name,
        img: songInfo.info.img,
        // desc: body.result.info.list_desc,
        author: songInfo.info.username,
        // play_count: formatPlayCount(info.count),
      },
    }
  },

  async getUserListDetailByLink({ info }, link) {
    let listInfo = info['0']
    let total = listInfo.count
    let tasks = []
    let page = 0
    while (total) {
      const limit = total > 90 ? 90 : total
      total -= limit
      page += 1
      tasks.push(createHttpFetch(link.replace(/pagesize=\d+/, 'pagesize=' + limit).replace(/page=\d+/, 'page=' + page), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
          Referer: link,
        },
      }).then(data => data.list.info))
    }
    let result = await Promise.all(tasks).then(([...datas]) => datas.flat())
    result = await getMusicInfosByList(result)
    // console.log(result)
    return {
      list: result,
      page,
      limit: this.listDetailLimit,
      total: result.length,
      source: 'kg',
      info: {
        name: listInfo.name,
        img: listInfo.pic && listInfo.pic.replace('{size}', 240),
        // desc: body.result.info.list_desc,
        author: listInfo.list_create_username,
        // play_count: formatPlayCount(listInfo.count),
      },
    }
  },
  createGetListDetail2Task(id, total) {
    let tasks = []
    let page = 0
    while (total) {
      const limit = total > 300 ? 300 : total
      total -= limit
      page += 1
      const params = 'appid=1058&global_specialid=' + id + '&specialid=0&plat=0&version=8000&page=' + page + '&pagesize=' + limit + '&srcappid=2919&clientver=20000&clienttime=1586163263991&mid=1586163263991&uuid=1586163263991&dfid=-'
      tasks.push(createHttpFetch(`https://mobiles.kugou.com/api/v5/special/song_v2?${params}&signature=${signatureParams(params, 5)}`, {
        headers: {
          mid: '1586163263991',
          Referer: 'https://m3ws.kugou.com/share/index.php',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
          dfid: '-',
          clienttime: '1586163263991',
        },
      }).then(data => data.info))
    }
    return Promise.all(tasks).then(([...datas]) => datas.flat())
  },
  async getUserListDetail2(global_collection_id) {
    let id = global_collection_id
    if (id.length > 1000) throw new Error('get list error')
    const params = 'appid=1058&specialid=0&global_specialid=' + id + '&format=jsonp&srcappid=2919&clientver=20000&clienttime=1586163242519&mid=1586163242519&uuid=1586163242519&dfid=-'
    let info = await createHttpFetch(`https://mobiles.kugou.com/api/v5/special/info_v2?${params}&signature=${signatureParams(params, 5)}`, {
      headers: {
        mid: '1586163242519',
        Referer: 'https://m3ws.kugou.com/share/index.php',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        dfid: '-',
        clienttime: '1586163242519',
      },
    })
    const songInfo = await this.createGetListDetail2Task(id, info.songcount)
    let list = await getMusicInfosByList(songInfo)
    // console.log(info, songInfo, list)
    return {
      list,
      page: 1,
      limit: this.listDetailLimit,
      total: list.length,
      source: 'kg',
      info: {
        name: info.specialname,
        img: info.imgurl && info.imgurl.replace('{size}', 240),
        desc: info.intro,
        author: info.nickname,
        play_count: formatPlayCount(info.playcount),
      },
    }
  },

  async getListInfoByChain(chain) {
    if (this.cache.has(chain)) return this.cache.get(chain)
    const { body } = await httpFetch(`https://m.kugou.com/share/?chain=${chain}&id=${chain}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
      },
    }).promise
    // console.log(body)
    let result = body.match(/var\sphpParam\s=\s({.+?});/)
    if (result) result = JSON.parse(result[1])
    this.cache.set(chain, result)
    return result
  },

  async getUserListDetailByPcChain(chain) {
    let key = `${chain}_pc_list`
    if (this.cache.has(key)) return this.cache.get(key)
    const { body } = await httpFetch(`http://www.kugou.com/share/${chain}.html`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
      },
    }).promise
    let result = body.match(/var\sdataFromSmarty\s=\s(\[.+?\])/)
    if (result) result = JSON.parse(result[1])
    this.cache.set(chain, result)
    result = await getMusicInfosByList(result)
    // console.log(info, songInfo)
    return result
  },

  async getUserListDetail4(songInfo, chain, page) {
    const limit = 100
    const [listInfo, list] = await Promise.all([
      this.getListInfoByChain(chain),
      this.getUserListDetailBySpecialId(songInfo.id, page, limit),
    ])
    return {
      list: list || [],
      page,
      limit,
      total: list.length ?? 0,
      source: 'kg',
      info: {
        name: listInfo.specialname,
        img: listInfo.imgurl && listInfo.imgurl.replace('{size}', 240),
        // desc: body.result.info.list_desc,
        author: listInfo.nickname,
        // play_count: formatPlayCount(info.count),
      },
    }
  },

  async getUserListDetail5(chain) {
    const [listInfo, list] = await Promise.all([
      this.getListInfoByChain(chain),
      this.getUserListDetailByPcChain(chain),
    ])
    return {
      list: list || [],
      page: 1,
      limit: this.listDetailLimit,
      total: list.length ?? 0,
      source: 'kg',
      info: {
        name: listInfo.specialname,
        img: listInfo.imgurl && listInfo.imgurl.replace('{size}', 240),
        // desc: body.result.info.list_desc,
        author: listInfo.nickname,
        // play_count: formatPlayCount(info.count),
      },
    }
  },

  async getUserListDetail(link, page, retryNum = 0) {
    if (retryNum > 3) return Promise.reject(new Error('link try max num'))

    const requestLink = httpFetch(link, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        Referer: link,
      },
      follow_max: 2,
    })
    const { headers: { location }, statusCode, body } = await requestLink.promise
    // console.log(body, location, statusCode)
    if (statusCode > 400) return this.getUserListDetail(link, page, ++retryNum)
    if (typeof body == 'string') {
      if (body.includes('"global_collection_id":')) return this.getUserListDetailByCollectionId(body.replace(/^[\s\S]+?"global_collection_id":"(\w+)"[\s\S]+?$/, '$1'), page)
      if (body.includes('"albumid":')) return album.getAlbumDetail(body.replace(/^[\s\S]+?"albumid":(\w+)[\s\S]+?$/, '$1'), page)
      if (body.includes('"album_id":') && link.includes('album/info')) return album.getAlbumDetail(body.replace(/^[\s\S]+?"album_id":(\w+)[\s\S]+?$/, '$1'), page)
      if (body.includes('list_id = "') && link.includes('album/info')) return album.getAlbumDetail(body.replace(/^[\s\S]+?list_id = "(\w+)"[\s\S]+?$/, '$1'), page)
    }
    if (location) {
      // 概念版分享链接 https://t1.kugou.com/xxx
      if (location.includes('global_specialid')) return this.getUserListDetailByCollectionId(location.replace(/^.*?global_specialid=(\w+)(?:&.*$|#.*$|$)/, '$1'), page)
      if (location.includes('global_collection_id')) return this.getUserListDetailByCollectionId(location.replace(/^.*?global_collection_id=(\w+)(?:&.*$|#.*$|$)/, '$1'), page)
      if (location.includes('chain=')) return this.getUserListDetail3(location.replace(/^.*?chain=(\w+)(?:&.*$|#.*$|$)/, '$1'), page)
      if (location.includes('.html')) {
        if (location.includes('zlist.html')) {
          let link = location.replace(/^(.*)zlist\.html/, 'https://m3ws.kugou.com/zlist/list')
          if (link.includes('pagesize')) {
            link = link.replace('pagesize=30', 'pagesize=' + this.listDetailLimit).replace('page=1', 'page=' + page)
          } else {
            link += `&pagesize=${this.listDetailLimit}&page=${page}`
          }
          return this.getUserListDetail(link, page, ++retryNum)
        } else return this.getUserListDetail3(location.replace(/.+\/(\w+).html(?:\?.*|&.*$|#.*$|$)/, '$1'), page)
      }
      return this.getUserListDetail(location, page, ++retryNum)
    }
    if (body.errcode !== 0) return this.getUserListDetail(link, page, ++retryNum)
    return this.getUserListDetailByLink(body, link)
  },

  // 获取列表信息
  getListInfo(tagId, tryNum = 0) {
    if (this._requestObj_listInfo) this._requestObj_listInfo.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_listInfo = httpFetch(this.getInfoUrl(tagId))
    return this._requestObj_listInfo.promise.then(({ body }) => {
      if (body.status !== 1) return this.getListInfo(tagId, ++tryNum)
      return {
        limit: body.data.params.pagesize,
        page: body.data.params.p,
        total: body.data.params.total,
        source: 'kg',
      }
    })
  },

  // 获取列表数据
  getList(sortId, tagId, page) {
    let tasks = [this.getSongList(sortId, tagId, page)]
    tasks.push(
      this.currentTagInfo.id === tagId
        ? Promise.resolve(this.currentTagInfo.info)
        : this.getListInfo(tagId).then(info => {
          this.currentTagInfo.id = tagId
          this.currentTagInfo.info = Object.assign({}, info)
          return info
        }),
    )
    if (!tagId && page === 1 && sortId === this.sortList[0].id) tasks.push(this.getSongListRecommend()) // 如果是所有类别，则顺便获取推荐列表
    return Promise.all(tasks).then(([list, info, recommendList]) => {
      if (recommendList) list.unshift(...recommendList)
      return {
        list,
        ...info,
      }
    })
  },

  // 获取标签
  getTags(tryNum = 0) {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = httpFetch(this.getInfoUrl())
    return this._requestObj_tags.promise.then(({ body }) => {
      if (body.status !== 1) return this.getTags(++tryNum)
      return {
        hotTag: this.filterInfoHotTag(body.data.hotTag),
        tags: this.filterTagInfo(body.data.tagids),
        source: 'kg',
      }
    })
  },

  getDetailPageUrl(id) {
    if (typeof id == 'string') {
      if (/^https?:\/\//.test(id)) return id
      id = id.replace('id_', '')
    }
    return `https://www.kugou.com/yy/special/single/${id}.html`
  },

  search(text, page, limit = 20) {
    const params = `userid=1384394652&req_custom=1&appid=1005&req_multi=1&version=11589&page=${page}&filter=0&pagesize=${limit}&order=0&clienttime=1681779443&iscorrection=1&searchsong=0&keyword=${text}&mid=288799920684148686226285199951543865551&dfid=3eSBsO1u97EY1zeIZd40hH4p&clientver=11589&platform=AndroidFilter`
    const url = encodeURI(`http://complexsearchretry.kugou.com/v1/search/special?${params}&signature=${signatureParams(params, 1)}`)
    return createHttpFetch(url).then(body => {
      // console.log(body)
      return {
        list: body.lists.map(item => {
          return {
            play_count: formatPlayCount(item.total_play_count),
            id: item.gid ? `gid_${item.gid}` : `id_${item.specialid}`,
            author: item.nickname,
            name: item.specialname,
            time: dateFormat(item.publish_time, 'Y-M-D'),
            img: item.img,
            grade: item.grade,
            desc: item.intro,
            total: item.song_count,
            source: 'kg',
          }
        }),
        limit,
        total: body.total,
        source: 'kg',
      }
    })
    // http://msearchretry.kugou.com/api/v3/search/special?version=9209&keyword=%E5%91%A8%E6%9D%B0%E4%BC%A6&pagesize=20&filter=0&page=1&sver=2&with_res_tag=0
    // http://ioscdn.kugou.com/api/v3/search/special?keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${limit}&showtype=10&plat=2&version=7910&correct=1&sver=5
    // http://msearchretry.kugou.com/api/v3/search/special?keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${limit}&showtype=10&filter=0&version=7910&sver=2
  },
}

// getList
// getTags
// getListDetail
