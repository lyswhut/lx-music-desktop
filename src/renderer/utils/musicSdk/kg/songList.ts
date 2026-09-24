import { httpFetch } from '../../request'
import { decodeName, dateFormat, formatPlayCount } from '../../index'
import infSign from '@renderer/utils/musicSdk/kg/vendors/infSign.min'
import { signatureParams } from './util'
import { filterData } from './quality_detail'

const handleSignature = async(id: any, page: number, limit: number): Promise<string> =>
  new Promise((resolve, reject) => {
    infSign(
      { appid: 1058, type: 0, module: 'playlist', page, pagesize: limit, specialid: id },
      null,
      {
        useH5: !0,
        isCDN: !0,
        callback(i: any) {
          resolve(i.signature)
        },
      },
    )
  })

export default {
  _requestObj_tags: null as any,
  _requestObj_listInfo: null as any,
  _requestObj_list: null as any,
  _requestObj_listRecommend: null as any,
  listDetailLimit: 10000,
  currentTagInfo: {
    id: undefined as any,
    info: undefined as any,
  },
  sortList: [
    { name: '推荐', id: '5' },
    { name: '最热', id: '6' },
    { name: '最新', id: '7' },
    { name: '热藏', id: '3' },
    { name: '飙升', id: '8' },
  ],
  cache: new Map<string, any>(),
  regExps: {
    listData: /global\.data = (\[.+\]);/,
    listInfo: /global = {[\s\S]+?name: "(.+)"[\s\S]+?pic: "(.+)"[\s\S]+?};/,
    // https://www.kugou.com/yy/special/single/1067062.html
    listDetailLink: /^.+\/(\d+)\.html(?:\?.*|&.*$|#.*$|$)/,
  },
  parseHtmlDesc(html: string): string | null {
    const prefix = '<div class="pc_specail_text pc_singer_tab_content" id="specailIntroduceWrap">'
    let index = html.indexOf(prefix)
    if (index < 0) return null
    const afterStr = html.substring(index + prefix.length)
    index = afterStr.indexOf('</div>')
    if (index < 0) return null
    return decodeName(afterStr.substring(0, index))
  },
  async getListDetailBySpecialId(id: any, page: number, tryNum: number = 0): Promise<any> {
    if (tryNum > 2) throw new Error('try max num')

    const { body } = await httpFetch(this.getSongListDetailUrl(id)).promise
    let listData = body.match(this.regExps.listData)
    let listInfo = body.match(this.regExps.listInfo)
    if (!listData) return this.getListDetailBySpecialId(id, page, ++tryNum)
    let list = await this.getMusicInfos(JSON.parse(listData[1]))
    let name: string | undefined
    let pic: string | undefined
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
      },
    }
  },
  getInfoUrl(tagId?: any): string {
    return tagId
      ? `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&cdn=cdn&t=5&c=${tagId}`
      : 'http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&'
  },
  getSongListUrl(sortId: any, tagId: any, page: number): string {
    if (tagId == null) tagId = ''
    return `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_ajax=1&cdn=cdn&t=${sortId}&c=${tagId}&p=${page}`
  },
  getSongListDetailUrl(id: any): string {
    return `http://www2.kugou.kugou.com/yueku/v9/special/single/${id}-5-9999.html`
  },

  filterInfoHotTag(rawData: any): any[] {
    const result: any[] = []
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
  filterTagInfo(rawData: any): any[] {
    const result: any[] = []
    for (const name of Object.keys(rawData)) {
      result.push({
        name,
        list: rawData[name].data.map((tag: any) => ({
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

  async getSongList(sortId: any, tagId: any, page: number, tryNum: number = 0): Promise<any> {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_list = httpFetch(this.getSongListUrl(sortId, tagId, page))
    return this._requestObj_list.promise.then(async({ body }: any) => {
      if (!body || body.status !== 1) return this.getSongList(sortId, tagId, page, ++tryNum)
      return this.filterList(body.special_db)
    })
  },
  async getSongListRecommend(tryNum: number = 0): Promise<any> {
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
    return this._requestObj_listRecommend.promise.then(async({ body }: any) => {
      if (body.status !== 1) return this.getSongListRecommend(++tryNum)
      return this.filterList(body.data.special_list)
    })
  },
  filterList(rawData: any[]): any[] {
    return rawData.map((item: any) => ({
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

  async createHttp(url: string, options?: any, retryNum: number = 0): Promise<any> {
    if (retryNum > 2) throw new Error('try max num')
    let result: any
    try {
      result = await httpFetch(url, options).promise
    } catch (err: any) {
      console.log(err)
      return this.createHttp(url, options, ++retryNum)
    }
    if (
      result.statusCode !== 200 ||
      (result.body.error_code !== undefined
        ? result.body.error_code
        : result.body.errcode !== undefined
          ? result.body.errcode
          : result.body.err_code) !== 0
    ) { return this.createHttp(url, options, ++retryNum) }
    if (result.body.data) return result.body.data
    if (Array.isArray(result.body.info)) return result.body
    return result.body.info
  },

  createTask(hashs: any[]): Array<Promise<any>> {
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
    let tasks: any[] = []
    while (list.length) {
      tasks.push(Object.assign({ data: list.slice(0, 100) }, data))
      if (list.length < 100) break
      list = list.slice(100)
    }
    let url = 'http://gateway.kugou.com/v2/album_audio/audio'
    return tasks.map(async(task: any) =>
      this.createHttp(url, {
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
      }).then((data: any) => data.map((s: any) => s[0])),
    )
  },
  async getMusicInfos(list: any[]): Promise<any[]> {
    return await this.filterData(
      await Promise.all(
        this.createTask(this.deDuplication(list).map((item: any) => ({ hash: item.hash }))),
      ).then(([...datas]: any[]) => datas.flat()),
    )
  },

  async getUserListDetailByCode(id: any): Promise<any> {
    const songInfo = await this.createHttp('http://t.kugou.com/command/', {
      method: 'POST',
      headers: {
        'KG-RC': 1,
        'KG-THash': 'network_super_call.cpp:3676261689:379',
        'User-Agent': '',
      },
      body: {
        appid: 1001,
        clientver: 9020,
        mid: '21511157a05844bd085308bc76ef3343',
        clienttime: 640612895,
        key: '36164c4015e704673c588ee202b9ecb8',
        data: id,
      },
    })
    let songList: any
    let info = songInfo.info
    switch (info.type) {
      case 2:
        if (!info.global_collection_id) return this.getListDetailBySpecialId(info.id, 1)
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
        body: {
          appid: 1001,
          clientver: 9020,
          mid: '21511157a05844bd085308bc76ef3343',
          clienttime: 640612895,
          key: '36164c4015e704673c588ee202b9ecb8',
          data: {
            id: info.id,
            type: 3,
            userid: info.userid,
            collect_type: 0,
            page: 1,
            pagesize: info.count,
          },
        },
      })
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
        img: (info.img_size?.replace('{size}', 240)) || info.img,
        author: info.username,
      },
    }
  },

  async getUserListDetail3(chain: string, page: number): Promise<any> {
    const songInfo = await this.createHttp(
      `http://m.kugou.com/schain/transfer?pagesize=${this.listDetailLimit}&chain=${chain}&su=1&page=${page}&n=0.7928855356604456`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        },
      },
    )
    if (!songInfo.list) {
      if (songInfo.global_collection_id) {
        return this.getListDetailByGcidChain(songInfo.global_collection_id, chain).catch(async() =>
          this.getUserListDetail2(songInfo.global_collection_id),
        )
      } else {
        return this.getUserListDetail4(songInfo, chain, page).catch(async() =>
          this.getUserListDetail5(chain),
        )
      }
    }
    let list = await this.getMusicInfos(songInfo.list)
    return {
      list,
      page: 1,
      limit: this.listDetailLimit,
      total: list.length,
      source: 'kg',
      info: {
        name: songInfo.info.name,
        img: songInfo.info.img,
        author: songInfo.info.username,
      },
    }
  },

  deDuplication(datas: any[]): any[] {
    let ids = new Set<string>()
    return datas.filter(({ hash }: any) => {
      if (ids.has(hash)) return false
      ids.add(hash)
      return true
    })
  },

  async decodeGcid(gcid: string): Promise<string> {
    const params = 'dfid=-&appid=1005&mid=0&clientver=20109&clienttime=640612895&uuid=-'
    const body = {
      ret_info: 1,
      data: [{ id: gcid, id_type: 2 }],
    }
    const result = await this.createHttp(
      `https://t.kugou.com/v1/songlist/batch_decode?${params}&signature=${signatureParams(params, 'android', JSON.stringify(body))}`,
      {
        method: 'POST',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; HUAWEI HMA-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36',
          Referer: 'https://m.kugou.com/',
        },
        body,
      },
    )
    return result.list[0].global_collection_id
  },

  async getUserListDetailByLink({ info }: any, link: string): Promise<any> {
    let listInfo = info['0']
    let total = listInfo.count
    let tasks: Array<Promise<any>> = []
    let page = 0
    while (total) {
      const limit = total > 90 ? 90 : total
      total -= limit
      page += 1
      tasks.push(
        this.createHttp(
          link.replace(/pagesize=\d+/, 'pagesize=' + limit).replace(/page=\d+/, 'page=' + page),
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
              Referer: link,
            },
          },
        ).then((data: any) => data.list.info),
      )
    }
    let result = await Promise.all(tasks).then(([...datas]: any[]) => datas.flat())
    result = await this.getMusicInfos(result)
    return {
      list: result,
      page,
      limit: this.listDetailLimit,
      total: result.length,
      source: 'kg',
      info: {
        name: listInfo.name,
        img: listInfo.pic?.replace('{size}', 240),
        author: listInfo.list_create_username,
      },
    }
  },
  async createGetListDetail2Task(id: string, total: number): Promise<any[]> {
    let tasks: Array<Promise<any>> = []
    let page = 0
    while (total) {
      const limit = total > 300 ? 300 : total
      total -= limit
      page += 1
      const params =
        'appid=1058&global_specialid=' +
        id +
        '&specialid=0&plat=0&version=8000&page=' +
        page +
        '&pagesize=' +
        limit +
        '&srcappid=2919&clientver=20000&clienttime=1586163263991&mid=1586163263991&uuid=1586163263991&dfid=-'
      tasks.push(
        this.createHttp(
          `https://mobiles.kugou.com/api/v5/special/song_v2?${params}&signature=${signatureParams(
            params,
            'web',
          )}`,
          {
            headers: {
              mid: '1586163263991',
              Referer: 'https://m3ws.kugou.com/share/index.php',
              'User-Agent':
                'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
              dfid: '-',
              clienttime: '1586163263991',
            },
          },
        ).then((data: any) => data.info),
      )
    }
    return Promise.all(tasks).then(([...datas]: any[]) => datas.flat())
  },
  async getListDetailByGcidChain(id: string, chain: string): Promise<any> {
    const params =
      'srcappid=2919&clientver=20000&clienttime=1789566751657&mid=1789566751657&uuid=1789566751657&dfid=-&listid=15&type=0&pagesize=50&global_collection_id=' +
      id +
      '&page=1&share_type=collect&appid=1058&chain=' +
      chain
    const data = await this.createHttp(
      `https://m3ws.kugou.com/v2/zlist/list?${params}&signature=${signatureParams(params, 'web')}`,
      {
        headers: {
          mid: '1586163263991',
          Referer: 'https://m3ws.kugou.com/share/index.php',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
          dfid: '-',
          clienttime: '1586163263991',
        },
      },
    )
    const info = data.info[0]
    if (!info) throw new Error('get list error')
    let tasks = [Promise.resolve(data.list.info)]
    let page = 1
    const totalPage = Math.ceil(info.count / 50)
    while (page < totalPage) {
      const limit = 50
      page += 1
      const params =
        'srcappid=2919&clientver=20000&clienttime=1789566751657&mid=1789566751657&uuid=1789566751657&dfid=-&listid=15&type=0&pagesize=' +
        limit +
        '&global_collection_id=' +
        id +
        '&page=' +
        page +
        '&share_type=collect&appid=1058&chain=' +
        chain
      tasks.push(
        this.createHttp(
          `https://m3ws.kugou.com/v2/zlist/list?${params}&signature=${signatureParams(
            params,
            'web',
          )}`,
          {
            headers: {
              mid: '1586163263991',
              Referer: 'https://m3ws.kugou.com/share/index.php',
              'User-Agent':
                'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
              dfid: '-',
              clienttime: '1586163263991',
            },
          },
        ).then((data: any) => data.list.info),
      )
    }
    const hashs = await Promise.all(tasks).then(([...datas]: any[]) => datas.flat())
    let list = await this.getMusicInfos(hashs)
    return {
      list,
      page: 1,
      limit: this.listDetailLimit,
      total: info.count,
      source: 'kg',
      info: {
        name: info.name,
        img: info.pic?.replace('{size}', 240),
        desc: info.intro,
        author: info.list_create_username,
        // play_count: formatPlayCount(info.playcount),
      },
    }
  },
  async getUserListDetail2(global_collection_id: string): Promise<any> {
    let id = global_collection_id
    if (id.length > 1000) throw new Error('get list error')
    const params =
      'appid=1058&specialid=0&global_specialid=' +
      id +
      '&format=jsonp&srcappid=2919&clientver=20000&clienttime=1586163242519&mid=1586163242519&uuid=1586163242519&dfid=-'
    let info = await this.createHttp(
      `https://mobiles.kugou.com/api/v5/special/info_v2?${params}&signature=${signatureParams(
        params,
        'web',
      )}`,
      {
        headers: {
          mid: '1586163242519',
          Referer: 'https://m3ws.kugou.com/share/index.php',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
          dfid: '-',
          clienttime: '1586163242519',
        },
      },
    )
    const songInfo = await this.createGetListDetail2Task(id, info.songcount)
    let list = await this.getMusicInfos(songInfo)
    return {
      list,
      page: 1,
      limit: this.listDetailLimit,
      total: list.length,
      source: 'kg',
      info: {
        name: info.specialname,
        img: info.imgurl?.replace('{size}', 240),
        desc: info.intro,
        author: info.nickname,
        play_count: formatPlayCount(info.playcount),
      },
    }
  },

  async getListInfoByChain(chain: string): Promise<any> {
    if (this.cache.has(chain)) return this.cache.get(chain)
    const { body } = await httpFetch(`https://m.kugou.com/share/?chain=${chain}&id=${chain}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
      },
    }).promise
    let result: any = body.match(/var\sphpParam\s=\s({.+?});/)
    if (result) result = JSON.parse(result[1])
    this.cache.set(chain, result)
    return result
  },

  async getUserListDetailByPcChain(chain: string): Promise<any> {
    let key = `${chain}_pc_list`
    if (this.cache.has(key)) return this.cache.get(key)
    const { body } = await httpFetch(`http://www.kugou.com/share/${chain}.html`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
      },
    }).promise
    let result: any = body.match(/var\sdataFromSmarty\s=\s(\[.+?\])/)
    if (result) result = JSON.parse(result[1])
    this.cache.set(chain, result)
    result = await this.getMusicInfos(result)
    return result
  },

  async getUserListDetail4(songInfo: any, chain: string, page: number): Promise<any> {
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
        img: listInfo.imgurl?.replace('{size}', 240),
        author: listInfo.nickname,
      },
    }
  },

  async getUserListDetail5(chain: string): Promise<any> {
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
        img: listInfo.imgurl?.replace('{size}', 240),
        author: listInfo.nickname,
      },
    }
  },

  async getUserListDetailById(id: any, page: number, limit: number): Promise<any> {
    const signature = await handleSignature(id, page, limit)
    let info = await this.createHttp(
      `https://pubsongscdn.kugou.com/v2/get_other_list_file?srcappid=2919&clientver=20000&appid=1058&type=0&module=playlist&page=${page}&pagesize=${limit}&specialid=${id}&signature=${signature}`,
      {
        headers: {
          Referer: 'https://m3ws.kugou.com/share/index.php',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
          dfid: '-',
        },
      },
    )

    let result = await this.getMusicInfos(info.info)
    return result
  },

  async getUserListDetail(link: string, page: number, retryNum: number = 0): Promise<any> {
    if (retryNum > 3) return Promise.reject(new Error('link try max num'))
    if (link.includes('#')) link = link.replace(/#.*$/, '')
    if (link.includes('global_collection_id') && link.includes('chain')) {
      return this.getListDetailByGcidChain(
        link.replace(/^.*?global_collection_id=(\w+)(?:&.*$|#.*$|$)/, '$1'),
        link.replace(/^.*?chain=(\w+)(?:&.*$|#.*$|$)/, '$1'),
      )
    }
    if (link.includes('chain=')) {
      return this.getUserListDetail3(link.replace(/^.*?chain=(\w+)(?:&.*$|#.*$|$)/, '$1'), page)
    }
    if (link.includes('gcid_')) {
      let gcid = link.match(/gcid_\w+/)?.[0]
      if (gcid) {
        const global_collection_id = await this.decodeGcid(gcid)
        if (global_collection_id) return this.getUserListDetail2(global_collection_id)
      }
    }
    if (link.includes('.html')) {
      if (link.includes('zlist.html')) {
        link = link.replace(/^(.*)zlist\.html/, 'https://m3ws.kugou.com/zlist/list')
        if (link.includes('pagesize')) {
          link = link
            .replace('pagesize=30', 'pagesize=' + this.listDetailLimit)
            .replace('page=1', 'page=' + page)
        } else {
          link += `&pagesize=${this.listDetailLimit}&page=${page}`
        }
      } else if (!link.includes('song.html')) {
        return this.getUserListDetail3(
          link.replace(/.+\/(\w+).html(?:\?.*|&.*$|#.*$|$)/, '$1'),
          page,
        )
      }
    }
    if (link.includes('global_collection_id')) {
      return this.getUserListDetail2(
        link.replace(/^.*?global_collection_id=(\w+)(?:&.*$|#.*$|$)/, '$1'),
      )
    }

    const requestObj_listDetailLink = httpFetch(link, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        Referer: link,
      },
    })
    const {
      headers: { location },
      statusCode,
      body,
    }: any = await requestObj_listDetailLink.promise
    if (statusCode > 400) return this.getUserListDetail(link, page, ++retryNum)
    if (location) {
      if (location.includes('global_collection_id') && location.includes('chain')) {
        return this.getListDetailByGcidChain(
          location.replace(/^.*?global_collection_id=(\w+)(?:&.*$|#.*$|$)/, '$1'),
          location.replace(/^.*?chain=(\w+)(?:&.*$|#.*$|$)/, '$1'),
        )
      }
      if (location.includes('chain=')) {
        return this.getUserListDetail3(
          location.replace(/^.*?chain=(\w+)(?:&.*$|#.*$|$)/, '$1'),
          page,
        )
      }
      if (location.includes('gcid_')) {
        let gcid = location.match(/gcid_\w+/)?.[0]
        if (gcid) {
          const global_collection_id = await this.decodeGcid(gcid)
          if (global_collection_id) return this.getUserListDetail2(global_collection_id)
        }
      }
      if (location.includes('.html')) {
        if (location.includes('zlist.html')) {
          let link = location.replace(/^(.*)zlist\.html/, 'https://m3ws.kugou.com/zlist/list')
          if (link.includes('pagesize')) {
            link = link
              .replace('pagesize=30', 'pagesize=' + this.listDetailLimit)
              .replace('page=1', 'page=' + page)
          } else {
            link += `&pagesize=${this.listDetailLimit}&page=${page}`
          }
          return this.getUserListDetail(link, page, ++retryNum)
        } else {
          return this.getUserListDetail3(
            location.replace(/.+\/(\w+).html(?:\?.*|&.*$|#.*$|$)/, '$1'),
            page,
          )
        }
      }
      if (location.includes('global_collection_id')) {
        return this.getUserListDetail2(
          location.replace(/^.*?global_collection_id=(\w+)(?:&.*$|#.*$|$)/, '$1'),
        )
      }
      return this.getUserListDetail(location, page, ++retryNum)
    }
    if (typeof body == 'string') {
      let global_collection_id = body.match(/"global_collection_id":"(\w+)"/)?.[1]
      if (!global_collection_id) {
        let gcid = body.match(/"encode_gic":"(\w+)"/)?.[1]
        if (!gcid) gcid = body.match(/"encode_src_gid":"(\w+)"/)?.[1]
        if (gcid) global_collection_id = await this.decodeGcid(gcid)
      }
      if (!global_collection_id) throw new Error('get list error')
      return this.getUserListDetail2(global_collection_id)
    }
    if (body.errcode !== 0) return this.getUserListDetail(link, page, ++retryNum)
    return this.getUserListDetailByLink(body, link)
  },

  async getListDetail(id: any, page: number): Promise<any> {
    id = id.toString()
    if (id.includes('special/single/')) {
      id = id.replace(this.regExps.listDetailLink, '$1')
    } else if (/https?:/.test(id)) {
      return this.getUserListDetail(id.replace(/^.*?http/, 'http'), page)
    } else if (/^\d+$/.test(id)) {
      return this.getUserListDetailByCode(id)
    } else if (id.startsWith('id_')) {
      id = id.replace('id_', '')
    }

    return this.getListDetailBySpecialId(id, page)
  },
  // hash list filter
  async filterData(rawList: any[]): Promise<any[]> {
    return await filterData(rawList, { removeDuplicates: true, fix: true })
  },

  // 获取列表信息
  async getListInfo(tagId: any, tryNum: number = 0): Promise<any> {
    if (this._requestObj_listInfo) this._requestObj_listInfo.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_listInfo = httpFetch(this.getInfoUrl(tagId))
    return this._requestObj_listInfo.promise.then(async({ body }: any) => {
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
  async getList(sortId: any, tagId: any, page: number): Promise<any> {
    let tasks: Array<Promise<any>> = [this.getSongList(sortId, tagId, page)]
    tasks.push(
      this.currentTagInfo.id === tagId
        ? Promise.resolve(this.currentTagInfo.info)
        : this.getListInfo(tagId).then((info: any) => {
          this.currentTagInfo.id = tagId
          this.currentTagInfo.info = Object.assign({}, info)
          return info
        }),
    )
    if (!tagId && page === 1 && sortId === this.sortList[0].id) { tasks.push(this.getSongListRecommend()) }
    return Promise.all(tasks).then(([list, info, recommendList]: any[]) => {
      if (recommendList) list.unshift(...recommendList)
      return {
        list,
        ...info,
      }
    })
  },

  // 获取标签
  async getTags(tryNum: number = 0): Promise<any> {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = httpFetch(this.getInfoUrl())
    return this._requestObj_tags.promise.then(async({ body }: any) => {
      if (body.status !== 1) return this.getTags(++tryNum)
      return {
        hotTag: this.filterInfoHotTag(body.data.hotTag),
        tags: this.filterTagInfo(body.data.tagids),
        source: 'kg',
      }
    })
  },

  getDetailPageUrl(id: any): string {
    if (typeof id == 'string') {
      if (/^https?:\/\//.test(id)) return id
      id = id.replace('id_', '')
    }
    return `https://www.kugou.com/yy/special/single/${id}.html`
  },

  async search(text: string, page: number, limit: number = 20): Promise<any> {
    return httpFetch(
      `http://msearchretry.kugou.com/api/v3/search/special?keyword=${encodeURIComponent(
        text,
      )}&page=${page}&pagesize=${limit}&showtype=10&filter=0&version=7910&sver=2`,
    ).promise.then(({ body }: any) => {
      if (body.errcode != 0) throw new Error('filed')
      return {
        list: body.data.info.map((item: any) => {
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
