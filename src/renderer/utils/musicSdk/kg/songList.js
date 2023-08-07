import { httpFetch } from '../../request'
import { decodeName, formatPlayTime, sizeFormate, dateFormat, formatPlayCount } from '../../index'
import infSign from '@renderer/utils/musicSdk/kg/vendors/infSign.min'
import { signatureParams } from './util'

const handleSignature = (id, page, limit) => new Promise((resolve, reject) => {
  infSign({ appid: 1058, type: 0, module: 'playlist', page, pagesize: limit, specialid: id }, null, {
    useH5: !0,
    isCDN: !0,
    callback(i) {
      resolve(i.signature)
    },
  })
})

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
  regExps: {
    listData: /global\.data = (\[.+\]);/,
    listInfo: /global = {[\s\S]+?name: "(.+)"[\s\S]+?pic: "(.+)"[\s\S]+?};/,
    // https://www.kugou.com/yy/special/single/1067062.html
    listDetailLink: /^.+\/(\d+)\.html(?:\?.*|&.*$|#.*$|$)/,
  },
  // async getGlobalSpecialId(specialId) {
  //   return httpFetch(`http://mobilecdnbj.kugou.com/api/v5/special/info?specialid=${specialId}`, {
  //     headers: {
  //       'User-Agent': 'Mozilla/5.0 (Linux; Android 10; HLK-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.102 Mobile Safari/537.36 EdgA/104.0.1293.70',
  //     },
  //   }).promise.then(({ body }) => {
  //     // console.log(body)
  //     if (!body.data.global_specialid) Promise.reject(new Error('Failed to get global collection id.'))
  //     return body.data.global_specialid
  //   })
  // },
  // async getListInfoBySpecialId(special_id, retry = 0) {
  //   if (++retry > 2) throw new Error('failed')
  //   return httpFetch(`https://m.kugou.com/plist/list/${special_id}/?json=true`, {
  //     headers: {
  //       'User-Agent': 'Mozilla/5.0 (Linux; Android 10; HLK-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.102 Mobile Safari/537.36 EdgA/104.0.1293.70',
  //     },
  //     follow_max: 2,
  //   }).promise.then(({ body }) => {
  //     // console.log(body)
  //     if (!body.info.list) return this.getListInfoBySpecialId(special_id, retry)
  //     let listinfo = body.info.list
  //     return {
  //       listInfo: {
  //         name: listinfo.specialname,
  //         image: listinfo.imgurl.replace('{size}', '150'),
  //         intro: listinfo.intro,
  //         author: listinfo.nickname,
  //         playcount: listinfo.playcount,
  //         total: listinfo.songcount,
  //       },
  //       globalSpecialId: listinfo.global_specialid,
  //     }
  //   })
  // },
  // async getSongListDetailByGlobalSpecialId(id, page, limit = 100, retry = 0) {
  //   if (++retry > 2) throw new Error('failed')
  //   console.log(id)
  //   const params = `specialid=0&need_sort=1&module=CloudMusic&clientver=11409&pagesize=${limit}&global_collection_id=${id}&userid=0&page=${page}&type=1&area_code=1&appid=1005`
  //   return httpFetch(`http://pubsongscdn.tx.kugou.com/v2/get_other_list_file?${params}&signature=${signatureParams(params)}`).promise.then(({ body }) => {
  //     // console.log(body)
  //     if (body.data?.info == null) return this.getSongListDetailByGlobalSpecialId(id, page, limit, retry)
  //     return body.data.info
  //   })
  // },
  parseHtmlDesc(html) {
    const prefix = '<div class="pc_specail_text pc_singer_tab_content" id="specailIntroduceWrap">'
    let index = html.indexOf(prefix)
    if (index < 0) return null
    const afterStr = html.substring(index + prefix.length)
    index = afterStr.indexOf('</div>')
    if (index < 0) return null
    return decodeName(afterStr.substring(0, index))
  },
  async getListDetailBySpecialId(id, page, tryNum = 0) {
    if (tryNum > 2) throw new Error('try max num')

    const { body } = await httpFetch(this.getSongListDetailUrl(id)).promise
    let listData = body.match(this.regExps.listData)
    let listInfo = body.match(this.regExps.listInfo)
    if (!listData) return this.getListDetailBySpecialId(id, page, ++tryNum)
    let list = await this.getMusicInfos(JSON.parse(listData[1]))
    // listData = this.filterData(JSON.parse(listData[1]))
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

    // const globalSpecialId = await this.getGlobalSpecialId(id)
    // const limit = 100
    // const listData = await this.getSongListDetailByGlobalSpecialId(globalSpecialId, page, limit)
    // if (!Array.isArray(listData))
    // return this.getUserListDetail2(globalSpecialId)
    // return {
    //   list: this.filterDatav9(listData),
    //   page,
    //   limit,
    //   total: listInfo.total,
    //   source: 'kg',
    //   info: {
    //     name: listInfo.name,
    //     img: listInfo.image,
    //     desc: listInfo.intro,
    //     author: listInfo.author,
    //     play_count: formatPlayCount(listInfo.playcount),
    //   },
    // }
  },
  getInfoUrl(tagId) {
    return tagId
      ? `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&cdn=cdn&t=5&c=${tagId}`
      : 'http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&'
  },
  getSongListUrl(sortId, tagId, page) {
    if (tagId == null) tagId = ''
    return `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_ajax=1&cdn=cdn&t=${sortId}&c=${tagId}&p=${page}`
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

  getSongList(sortId, tagId, page, tryNum = 0) {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_list = httpFetch(
      this.getSongListUrl(sortId, tagId, page),
    )
    return this._requestObj_list.promise.then(({ body }) => {
      if (!body || body.status !== 1) return this.getSongList(sortId, tagId, page, ++tryNum)
      return this.filterList(body.special_db)
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
      return this.filterList(body.data.special_list)
    })
  },
  filterList(rawData) {
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

  async createHttp(url, options, retryNum = 0) {
    if (retryNum > 2) throw new Error('try max num')
    let result
    try {
      result = await httpFetch(url, options).promise
    } catch (err) {
      console.log(err)
      return this.createHttp(url, options, ++retryNum)
    }
    // console.log(result.statusCode, result.body)
    if (result.statusCode !== 200 ||
      (
        (result.body.error_code !== undefined
          ? result.body.error_code
          : result.body.errcode !== undefined
            ? result.body.errcode
            : result.body.err_code
        ) !== 0)
    ) return this.createHttp(url, options, ++retryNum)
    if (result.body.data) return result.body.data
    if (Array.isArray(result.body.info)) return result.body
    return result.body.info
  },

  createTask(hashs) {
    let data = {
      area_code: '1',
      show_privilege: 1,
      show_album_info: '1',
      is_publish: '',
      appid: 1005,
      clientver: 11451,
      mid: '1',
      dfid: '-',
      clienttime: Date.now(),
      key: 'OIlwieks28dk2k092lksi2UIkp',
      fields: 'album_info,author_name,audio_info,ori_audio_name,base,songname',
    }
    let list = hashs
    let tasks = []
    while (list.length) {
      tasks.push(Object.assign({ data: list.slice(0, 100) }, data))
      if (list.length < 100) break
      list = list.slice(100)
    }
    let url = 'http://gateway.kugou.com/v2/album_audio/audio'
    return tasks.map(task => this.createHttp(url, {
      method: 'POST',
      body: task,
      headers: {
        'KG-THash': '13a3164',
        'KG-RC': '1',
        'KG-Fake': '0',
        'KG-RF': '00869891',
        'User-Agent': 'Android712-AndroidPhone-11451-376-0-FeeCacheUpdate-wifi',
        'x-router': 'kmr.service.kugou.com',
      },
    }).then(data => data.map(s => s[0])))
  },
  async getMusicInfos(list) {
    return this.filterData2(
      await Promise.all(
        this.createTask(
          this.deDuplication(list)
            .map(item => ({ hash: item.hash })),
        ))
        .then(([...datas]) => datas.flat()))
  },

  async getUserListDetailByCode(id) {
    const songInfo = await this.createHttp('http://t.kugou.com/command/', {
      method: 'POST',
      headers: {
        'KG-RC': 1,
        'KG-THash': 'network_super_call.cpp:3676261689:379',
        'User-Agent': '',
      },
      body: { appid: 1001, clientver: 9020, mid: '21511157a05844bd085308bc76ef3343', clienttime: 640612895, key: '36164c4015e704673c588ee202b9ecb8', data: id },
    })
    // console.log(songInfo)
    // type 1单曲，2歌单，3电台，4酷狗码，5别人的播放队列
    let songList
    let info = songInfo.info
    switch (info.type) {
      case 2:
        if (!info.global_collection_id) return this.getListDetailBySpecialId(info.id)
        break

      default:
        break
    }
    if (info.global_collection_id) return this.getUserListDetail2(info.global_collection_id)
    if (info.userid != null) {
      songList = await this.createHttp('http://www2.kugou.kugou.com/apps/kucodeAndShare/app/', {
        method: 'POST',
        headers: {
          'KG-RC': 1,
          'KG-THash': 'network_super_call.cpp:3676261689:379',
          'User-Agent': '',
        },
        body: { appid: 1001, clientver: 9020, mid: '21511157a05844bd085308bc76ef3343', clienttime: 640612895, key: '36164c4015e704673c588ee202b9ecb8', data: { id: info.id, type: 3, userid: info.userid, collect_type: 0, page: 1, pagesize: info.count } },
      })
      // console.log(songList)
    }
    let list = await this.getMusicInfos(songList || songInfo.list)
    return {
      list,
      page: 1,
      limit: info.count,
      total: list.length,
      source: 'kg',
      info: {
        name: info.name,
        img: (info.img_size && info.img_size.replace('{size}', 240)) || info.img,
        // desc: body.result.info.list_desc,
        author: info.username,
        // play_count: formatPlayCount(info.count),
      },
    }
  },

  async getUserListDetail3(chain, page) {
    const songInfo = await this.createHttp(`http://m.kugou.com/schain/transfer?pagesize=${this.listDetailLimit}&chain=${chain}&su=1&page=${page}&n=0.7928855356604456`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
      },
    })
    if (!songInfo.list) {
      if (songInfo.global_collection_id) return this.getUserListDetail2(songInfo.global_collection_id)
      else return this.getUserListDetail4(songInfo, chain, page).catch(() => this.getUserListDetail5(chain))
    }
    let list = await this.getMusicInfos(songInfo.list)
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

  deDuplication(datas) {
    let ids = new Set()
    return datas.filter(({ hash }) => {
      if (ids.has(hash)) return false
      ids.add(hash)
      return true
    })
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
      tasks.push(this.createHttp(link.replace(/pagesize=\d+/, 'pagesize=' + limit).replace(/page=\d+/, 'page=' + page), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
          Referer: link,
        },
      }).then(data => data.list.info))
    }
    let result = await Promise.all(tasks).then(([...datas]) => datas.flat())
    result = await this.getMusicInfos(result)
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
      tasks.push(this.createHttp(`https://mobiles.kugou.com/api/v5/special/song_v2?${params}&signature=${signatureParams(params, 5)}`, {
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
    let info = await this.createHttp(`https://mobiles.kugou.com/api/v5/special/info_v2?${params}&signature=${signatureParams(params, 5)}`, {
      headers: {
        mid: '1586163242519',
        Referer: 'https://m3ws.kugou.com/share/index.php',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        dfid: '-',
        clienttime: '1586163242519',
      },
    })
    const songInfo = await this.createGetListDetail2Task(id, info.songcount)
    let list = await this.getMusicInfos(songInfo)
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
    result = await this.getMusicInfos(result)
    // console.log(info, songInfo)
    return result
  },

  async getUserListDetail4(songInfo, chain, page) {
    const limit = 100
    const [listInfo, list] = await Promise.all([
      this.getListInfoByChain(chain),
      this.getUserListDetailById(songInfo.id, page, limit),
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

  async getUserListDetailById(id, page, limit) {
    const signature = await handleSignature(id, page, limit)
    let info = await this.createHttp(`https://pubsongscdn.kugou.com/v2/get_other_list_file?srcappid=2919&clientver=20000&appid=1058&type=0&module=playlist&page=${page}&pagesize=${limit}&specialid=${id}&signature=${signature}`, {
      headers: {
        Referer: 'https://m3ws.kugou.com/share/index.php',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        dfid: '-',
      },
    })

    // console.log(info)
    let result = await this.getMusicInfos(info.info)
    // console.log(info, songInfo)
    return result
  },

  async getUserListDetail(link, page, retryNum = 0) {
    if (retryNum > 3) return Promise.reject(new Error('link try max num'))
    if (link.includes('#')) link = link.replace(/#.*$/, '')
    if (link.includes('global_collection_id')) return this.getUserListDetail2(link.replace(/^.*?global_collection_id=(\w+)(?:&.*$|#.*$|$)/, '$1'))
    if (link.includes('chain=')) return this.getUserListDetail3(link.replace(/^.*?chain=(\w+)(?:&.*$|#.*$|$)/, '$1'), page)
    if (link.includes('.html')) {
      if (link.includes('zlist.html')) {
        link = link.replace(/^(.*)zlist\.html/, 'https://m3ws.kugou.com/zlist/list')
        if (link.includes('pagesize')) {
          link = link.replace('pagesize=30', 'pagesize=' + this.listDetailLimit).replace('page=1', 'page=' + page)
        } else {
          link += `&pagesize=${this.listDetailLimit}&page=${page}`
        }
      } else if (!link.includes('song.html')) return this.getUserListDetail3(link.replace(/.+\/(\w+).html(?:\?.*|&.*$|#.*$|$)/, '$1'), page)
    }

    const requestObj_listDetailLink = httpFetch(link, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        Referer: link,
      },
    })
    const { headers: { location }, statusCode, body } = await requestObj_listDetailLink.promise
    // console.log(body, location)
    if (statusCode > 400) return this.getUserListDetail(link, page, ++retryNum)
    if (location) {
      // console.log(location)
      if (location.includes('global_collection_id')) return this.getUserListDetail2(location.replace(/^.*?global_collection_id=(\w+)(?:&.*$|#.*$|$)/, '$1'))
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
      // console.log('location', location)
      return this.getUserListDetail(location, page, ++retryNum)
    }
    if (typeof body == 'string') return this.getUserListDetail2(body.replace(/^[\s\S]+?"global_collection_id":"(\w+)"[\s\S]+?$/, '$1'))
    if (body.errcode !== 0) return this.getUserListDetail(link, page, ++retryNum)
    return this.getUserListDetailByLink(body, link)
  },

  async getListDetail(id, page) { // 获取歌曲列表内的音乐
    id = id.toString()
    if (id.includes('special/single/')) {
      id = id.replace(this.regExps.listDetailLink, '$1')
    } else if (/https?:/.test(id)) {
      // fix https://www.kugou.com/songlist/xxx/?uid=xxx&chl=qq_client&cover=http%3A%2F%2Fimge.kugou.com%xxx.jpg&iszlist=1
      return this.getUserListDetail(id.replace(/^.*?http/, 'http'), page)
    } else if (/^\d+$/.test(id)) {
      return this.getUserListDetailByCode(id)
    } else if (id.startsWith('id_')) {
      id = id.replace('id_', '')
    }
    // if ((/[?&:/]/.test(id))) id = id.replace(this.regExps.listDetailLink, '$1')

    return this.getListDetailBySpecialId(id, page)
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
        singer: decodeName(item.singername),
        name: decodeName(item.songname),
        albumName: decodeName(item.album_name),
        albumId: item.album_id,
        songmid: item.audio_id,
        source: 'kg',
        interval: formatPlayTime(item.duration / 1000),
        img: null,
        lrc: null,
        hash: item.hash,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  // getSinger(singers) {
  //   let arr = []
  //   singers?.forEach(singer => {
  //     arr.push(singer.name)
  //   })
  //   return arr.join('、')
  // },
  // v9 API
  // filterDatav9(rawList) {
  //   console.log(rawList)
  //   return rawList.map(item => {
  //     const types = []
  //     const _types = {}
  //     item.relate_goods.forEach(qualityObj => {
  //       if (qualityObj.level === 2) {
  //         let size = sizeFormate(qualityObj.size)
  //         types.push({ type: '128k', size, hash: qualityObj.hash })
  //         _types['128k'] = {
  //           size,
  //           hash: qualityObj.hash,
  //         }
  //       } else if (qualityObj.level === 4) {
  //         let size = sizeFormate(qualityObj.size)
  //         types.push({ type: '320k', size, hash: qualityObj.hash })
  //         _types['320k'] = {
  //           size,
  //           hash: qualityObj.hash,
  //         }
  //       } else if (qualityObj.level === 5) {
  //         let size = sizeFormate(qualityObj.size)
  //         types.push({ type: 'flac', size, hash: qualityObj.hash })
  //         _types.flac = {
  //           size,
  //           hash: qualityObj.hash,
  //         }
  //       } else if (qualityObj.level === 6) {
  //         let size = sizeFormate(qualityObj.size)
  //         types.push({ type: 'flac24bit', size, hash: qualityObj.hash })
  //         _types.flac24bit = {
  //           size,
  //           hash: qualityObj.hash,
  //         }
  //       }
  //     })
  //     const nameInfo = item.name.split(' - ')
  //     return {
  //       singer: this.getSinger(item.singerinfo),
  //       name: decodeName((nameInfo[1] ?? nameInfo[0]).trim()),
  //       albumName: decodeName(item.albuminfo.name),
  //       albumId: item.albuminfo.id,
  //       songmid: item.audio_id,
  //       source: 'kg',
  //       interval: formatPlayTime(item.timelen / 1000),
  //       img: null,
  //       lrc: null,
  //       hash: item.hash,
  //       types,
  //       _types,
  //       typeUrl: {},
  //     }
  //   })
  // },

  // hash list filter
  filterData2(rawList) {
    // console.log(rawList)
    let ids = new Set()
    let list = []
    rawList.forEach(item => {
      if (!item) return
      if (ids.has(item.audio_info.audio_id)) return
      ids.add(item.audio_info.audio_id)
      const types = []
      const _types = {}
      if (item.audio_info.filesize !== '0') {
        let size = sizeFormate(parseInt(item.audio_info.filesize))
        types.push({ type: '128k', size, hash: item.audio_info.hash })
        _types['128k'] = {
          size,
          hash: item.audio_info.hash,
        }
      }
      if (item.audio_info.filesize_320 !== '0') {
        let size = sizeFormate(parseInt(item.audio_info.filesize_320))
        types.push({ type: '320k', size, hash: item.audio_info.hash_320 })
        _types['320k'] = {
          size,
          hash: item.audio_info.hash_320,
        }
      }
      if (item.audio_info.filesize_flac !== '0') {
        let size = sizeFormate(parseInt(item.audio_info.filesize_flac))
        types.push({ type: 'flac', size, hash: item.audio_info.hash_flac })
        _types.flac = {
          size,
          hash: item.audio_info.hash_flac,
        }
      }
      if (item.audio_info.filesize_high !== '0') {
        let size = sizeFormate(parseInt(item.audio_info.filesize_high))
        types.push({ type: 'flac24bit', size, hash: item.audio_info.hash_high })
        _types.flac24bit = {
          size,
          hash: item.audio_info.hash_high,
        }
      }
      list.push({
        singer: decodeName(item.author_name),
        name: decodeName(item.songname),
        albumName: decodeName(item.album_info.album_name),
        albumId: item.album_info.album_id,
        songmid: item.audio_info.audio_id,
        source: 'kg',
        interval: formatPlayTime(parseInt(item.audio_info.timelength) / 1000),
        img: null,
        lrc: null,
        hash: item.audio_info.hash,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
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
    // http://msearchretry.kugou.com/api/v3/search/special?version=9209&keyword=%E5%91%A8%E6%9D%B0%E4%BC%A6&pagesize=20&filter=0&page=1&sver=2&with_res_tag=0
    // return httpFetch(`http://ioscdn.kugou.com/api/v3/search/special?keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${limit}&showtype=10&plat=2&version=7910&correct=1&sver=5`)
    return httpFetch(`http://msearchretry.kugou.com/api/v3/search/special?keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${limit}&showtype=10&filter=0&version=7910&sver=2`)
      .promise.then(({ body }) => {
        if (body.errcode != 0) throw new Error('filed')
        // console.log(body.data.info)
        return {
          list: body.data.info.map(item => {
            return {
              play_count: formatPlayCount(item.playcount),
              id: 'id_' + item.specialid,
              author: item.nickname,
              name: item.specialname,
              time: dateFormat(item.publishtime, 'Y-M-D'),
              img: item.imgurl,
              grade: item.grade,
              desc: item.intro,
              total: item.songcount,
              source: 'kg',
            }
          }),
          limit,
          total: body.data.total,
          source: 'kg',
        }
      })
  },
}

// getList
// getTags
// getListDetail
