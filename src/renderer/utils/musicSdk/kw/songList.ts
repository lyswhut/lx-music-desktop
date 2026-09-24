import { httpFetch } from '../../request'
import { decodeName, formatPlayTime } from '../../index'
import { formatSinger, objStr2JSON } from './util'
import album from './album'

export default {
  _requestObj_tags: null as any,
  _requestObj_hotTags: null as any,
  _requestObj_list: null as any,
  limit_list: 36,
  limit_song: 1000,
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
    mInfo: /level:(\w+),bitrate:(\d+),format:(\w+),size:([\w.]+)/,
    // http://www.kuwo.cn/playlist_detail/2886046289
    // https://m.kuwo.cn/h5app/playlist/2736267853?t=qqfriend
    listDetailLink: /^.+\/playlist(?:_detail)?\/(\d+)(?:\?.*|&.*$|#.*$|$)/,
  },
  tagsUrl:
    'http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576',
  hotTagUrl:
    'http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmTagList?loginUid=0&loginSid=0&appUid=76039576',
  getListUrl({ sortId, id, type, page }: { sortId: string, id: string | null, type?: string, page: number }): string | undefined {
    if (!id) { return `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&&pn=${page}&rn=${this.limit_list}&order=${sortId}` }
    switch (type) {
      case '10000':
        return `http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page}&id=${id}&rn=${this.limit_list}`
      case '43':
        return `http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=${id}&prod=pc`
    }
    // http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&id=173&pn=1&rn=100
  },
  getListDetailUrl(id: string, page: number): string {
    // http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=2858093057&pn=0&rn=100&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1
    return `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${id}&pn=${page - 1}&rn=${
      this.limit_song
    }&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1`
    // http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=140&prod=pc
  },

  // http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=2849349915&pn=0&rn=100&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1
  // 获取标签
  async getTag(tryNum: number = 0): Promise<any> {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = httpFetch(this.tagsUrl)
    return this._requestObj_tags.promise.then(async({ body }: { body: any }) => {
      if (body.code !== this.successCode) return this.getTag(++tryNum)
      return this.filterTagInfo(body.data)
    })
  },
  // 获取标签
  async getHotTag(tryNum: number = 0): Promise<any> {
    if (this._requestObj_hotTags) this._requestObj_hotTags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_hotTags = httpFetch(this.hotTagUrl)
    return this._requestObj_hotTags.promise.then(async({ body }: { body: any }) => {
      if (body.code !== this.successCode) return this.getHotTag(++tryNum)
      return this.filterInfoHotTag(body.data[0].data)
    })
  },
  filterInfoHotTag(rawList: any[]): any[] {
    return rawList.map((item: any) => ({
      id: `${item.id}-${item.digest}`,
      name: item.name,
      source: 'kw',
    }))
  },
  filterTagInfo(rawList: any[]): any[] {
    return rawList.map((type: any) => ({
      name: type.name,
      list: type.data.map((item: any) => ({
        parent_id: type.id,
        parent_name: type.name,
        id: `${item.id}-${item.digest}`,
        name: item.name,
        source: 'kw',
      })),
    }))
  },

  // 获取列表数据
  async getList(sortId: string, tagId: string, page: number, tryNum: number = 0): Promise<any> {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    let id: string | null
    let type: string | undefined
    if (tagId) {
      let arr = tagId.split('-')
      id = arr[0]
      type = arr[1]
    } else {
      id = null
    }
    this._requestObj_list = httpFetch(this.getListUrl({ sortId, id, type, page })!)
    return this._requestObj_list.promise.then(async({ body }: { body: any }) => {
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
        return this.getList(sortId, tagId, page, ++tryNum)
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
  formatPlayCount(num: number): string | number {
    if (num > 100000000) return parseInt(String(num / 10000000)) / 10 + '亿'
    if (num > 10000) return parseInt(String(num / 1000)) / 10 + '万'
    return num
  },
  filterList(rawData: any[]): any[] {
    return rawData.map((item: any) => ({
      play_count: this.formatPlayCount(item.listencnt),
      id: `digest-${item.digest}__${item.id}`,
      author: item.uname,
      name: item.name,
      // time: item.publish_time,
      total: item.total,
      img: item.img,
      grade: item.favorcnt / 10,
      desc: item.desc,
      source: 'kw',
    }))
  },
  filterList2(rawData: any[]): any[] {
    const list: any[] = []
    const allowedTypes = ['songlist', 'list', 'album']
    // digest: 5 = list, 8 = songlist, 13 = album, 4 = artist
    rawData.forEach((item: any) => {
      item.list.forEach((item: any) => {
        if (!allowedTypes.includes(item.type)) return
        list.push({
          play_count: item.play_count && this.formatPlayCount(item.listencnt),
          id: `digest-${item.digest}__${item.id}`,
          author: item.uname,
          name: item.name,
          total: item.total,
          // time: item.publish_time,
          img: item.img,
          grade: item.favorcnt && item.favorcnt / 10,
          desc: item.desc,
          source: 'kw',
        })
      })
    })
    return list
  },

  async getListDetailDigest8(id: string, page: number, tryNum: number = 0): Promise<any> {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))

    const requestObj = httpFetch(this.getListDetailUrl(id, page))
    return requestObj.promise.then(async({ body }: { body: any }) => {
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
  async getListDetailDigest5Info(id: string, tryNum: number = 0): Promise<any> {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    const requestObj = httpFetch(
      `http://qukudata.kuwo.cn/q.k?op=query&cont=ninfo&node=${id}&pn=0&rn=1&fmt=json&src=mbox&level=2`,
    )
    return requestObj.promise.then(({ statusCode, body }: { statusCode: number, body: any }) => {
      if (statusCode != 200 || !body.child) return this.getListDetail(id, ++tryNum)
      // console.log(body)
      return body.child.length ? body.child[0].sourceid : null
    })
  },
  async getListDetailDigest5Music(id: string, page: number, tryNum: number = 0): Promise<any> {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    const requestObj = httpFetch(
      `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${id}&pn=${page - 1}}&rn=${
        this.limit_song
      }&encode=utf-8&keyset=pl2012&identity=kuwo&pcmp4=1`,
    )
    return requestObj.promise.then(async({ body }: { body: any }) => {
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
  async getListDetailDigest5(id: string, page: number, retryNum: number): Promise<any> {
    const detailId = await this.getListDetailDigest5Info(id, retryNum)
    return this.getListDetailDigest5Music(detailId, page, retryNum)
  },

  filterBDListDetail(rawList: any[]): any[] {
    return rawList.map((item: any) => {
      let types: any[] = []
      let _types: Record<string, any> = {}
      for (let info of item.audios) {
        info.size = info.size?.toLocaleUpperCase()
        switch (info.bitrate) {
          case '2090':
            types.push({ type: 'flac24bit', size: info.size })
          case '4000':
            types.push({ type: 'hires', size: info.size })
            _types.hires = {
              size: info.size,
            }
            break
          case '2000':
            types.push({ type: 'flac', size: info.size })
            _types.flac = {
              size: info.size,
            }
            break
          case '320':
            types.push({ type: '320k', size: info.size })
            _types['320k'] = {
              size: info.size,
            }
            break
          case '128':
            types.push({ type: '128k', size: info.size })
            _types['128k'] = {
              size: info.size,
            }
            break
        }
      }
      types.reverse()

      return {
        singer: item.artists.map((s: any) => s.name).join('、'),
        name: item.name,
        albumName: item.album,
        albumId: item.albumId,
        songmid: item.id,
        source: 'kw',
        interval: formatPlayTime(item.duration),
        img: item.albumPic,
        releaseDate: item.releaseDate,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  getReqId(): string {
    function t(): string {
      return ((65536 * (1 + Math.random())) | 0).toString(16).substring(1)
    }

    return t() + t() + t() + t() + t() + t() + t() + t()
  },
  async getListDetailMusicListByBDListInfo(id: string, source: string): Promise<any> {
    const { body: infoData } = await httpFetch(
      `https://bd-api.kuwo.cn/api/service/playlist/info/${id}?reqId=${this.getReqId()}&source=${source}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
          plat: 'h5',
        },
      },
    ).promise.catch(() => ({ code: 0 }))

    if (infoData.code != 200) return null

    return {
      name: infoData.data.name,
      img: infoData.data.pic,
      desc: infoData.data.description,
      author: infoData.data.creatorName,
      play_count: infoData.data.playNum,
    }
  },
  async getListDetailMusicListByBDUserPub(id: string): Promise<any> {
    const { body: infoData } = await httpFetch(
      `https://bd-api.kuwo.cn/api/ucenter/users/pub/${id}?reqId=${this.getReqId()}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
          plat: 'h5',
        },
      },
    ).promise.catch(() => ({ code: 0 }))

    if (infoData.code != 200) return null

    // console.log(infoData)
    return {
      name: infoData.data.userInfo.nickname + '喜欢的音乐',
      img: infoData.data.userInfo.headImg,
      desc: '',
      author: infoData.data.userInfo.nickname,
      play_count: '',
    }
  },
  async getListDetailMusicListByBDList(id: string, source: string, page: number, tryNum: number = 0): Promise<any> {
    const { body: listData } = await httpFetch(
      `https://bd-api.kuwo.cn/api/service/playlist/${id}/musicList?reqId=${this.getReqId()}&source=${source}&pn=${page}&rn=${
        this.limit_song
      }`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
          plat: 'h5',
        },
      },
    ).promise.catch(async() => {
      if (tryNum > 2) return Promise.reject(new Error('try max num'))
      return this.getListDetailMusicListByBDList(id, source, page, ++tryNum)
    })

    if (listData.code !== 200) return Promise.reject(new Error('failed'))

    return {
      list: this.filterBDListDetail(listData.data.list),
      page,
      limit: listData.data.pageSize,
      total: listData.data.total,
      source: 'kw',
    }
  },
  async getListDetailMusicListByBD(id: string, page: number): Promise<any> {
    const uid = /uid=(\d+)/.exec(id)?.[1]
    const listId = /playlistId=(\d+)/.exec(id)?.[1]
    const source = /source=(\d+)/.exec(id)?.[1]
    if (!listId) return Promise.reject(new Error('failed'))

    const task = [this.getListDetailMusicListByBDList(listId, source!, page)]
    switch (source) {
      case '4':
        task.push(this.getListDetailMusicListByBDListInfo(listId, source))
        break
      case '5':
        task.push(this.getListDetailMusicListByBDUserPub(uid ?? listId))
        break
    }
    const [listData, info] = await Promise.all(task)
    listData.info = info ?? {
      name: '',
      img: '',
      desc: '',
      author: '',
      play_count: '',
    }
    // console.log(listData)
    return listData
  },

  // 获取歌曲列表内的音乐
  async getListDetail(id: string, page: number, retryNum: number = 0): Promise<any> {
    // console.log(id)
    // https://h5app.kuwo.cn/m/bodian/collection.html?uid=000&playlistId=000&source=5&ownerId=000
    // https://h5app.kuwo.cn/m/bodian/collection.html?uid=000&playlistId=000&source=4&ownerId=
    if (id.includes('/bodian/')) return this.getListDetailMusicListByBD(id, page)
    if (/[?&:/]/.test(id)) id = id.replace(this.regExps.listDetailLink, '$1')
    else if (/^digest-/.test(id)) {
      let [digest, _id] = id.split('__')
      digest = digest.replace('digest-', '')
      id = _id
      switch (digest) {
        case '8':
          break
        case '13':
          return album.getAlbumListDetail(id, page, retryNum)
        case '5':
        default:
          return this.getListDetailDigest5(id, page, retryNum)
      }
    }
    return this.getListDetailDigest8(id, page, retryNum)
  },
  filterListDetail(rawData: any[]): any[] {
    // console.log(rawData)
    return rawData.map((item: any) => {
      let infoArr = item.N_MINFO.split(';')
      let types: any[] = []
      let _types: Record<string, any> = {}
      for (let info of infoArr) {
        info = info.match(this.regExps.mInfo)
        if (info) {
          switch (info[2]) {
            case '20900':
              types.push({ type: 'master', size: info[4] })
              _types.master = {
                size: info[4].toLocaleUpperCase(),
              }
              break
            case '20501':
              types.push({ type: 'atmos_plus', size: info[4] })
              _types.atmos_plus = {
                size: info[4].toLocaleUpperCase(),
              }
              break
            case '20201':
              types.push({ type: 'atmos', size: info[4] })
              _types.atmos = {
                size: info[4].toLocaleUpperCase(),
              }
              break
            case '2090':
              types.push({ type: 'flac24bit', size: info[4] })
            case '4000':
              types.push({ type: 'hires', size: info[4] })
              _types.hires = {
                size: info[4].toLocaleUpperCase(),
              }
              break
            case '2000':
              types.push({ type: 'flac', size: info[4] })
              _types.flac = {
                size: info[4].toLocaleUpperCase(),
              }
              break
            case '320':
              types.push({ type: '320k', size: info[4] })
              _types['320k'] = {
                size: info[4].toLocaleUpperCase(),
              }
              break
            case '128':
              types.push({ type: '128k', size: info[4] })
              _types['128k'] = {
                size: info[4].toLocaleUpperCase(),
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
  async getTags(): Promise<any> {
    return Promise.all([this.getTag(), this.getHotTag()]).then(([tags, hotTag]) => ({
      tags,
      hotTag,
      source: 'kw',
    }))
  },
  getDetailPageUrl(id: string): string {
    if (/[?&:/]/.test(id)) id = id.replace(this.regExps.listDetailLink, '$1')
    else if (/^digest-/.test(id)) {
      let result = id.split('__')
      id = result[1]
    }
    return `http://www.kuwo.cn/playlist_detail/${id}`
  },

  async search(text: string, page: number, limit: number = 20): Promise<any> {
    return httpFetch(
      `http://search.kuwo.cn/r.s?all=${encodeURIComponent(text)}&pn=${
        page - 1
      }&rn=${limit}&rformat=json&encoding=utf8&ver=mbox&vipver=MUSIC_8.7.7.0_BCS37&plat=pc&devid=28156413&ft=playlist&pay=0&needliveshow=0`,
    ).promise.then(({ body }: { body: any }) => {
      body = objStr2JSON(body)
      // console.log(body)
      return {
        list: body.abslist.map((item: any) => {
          return {
            play_count: this.formatPlayCount(item.playcnt),
            id: String(item.playlistid),
            author: decodeName(item.nickname),
            name: decodeName(item.name),
            total: item.songnum,
            // time: item.publish_time,
            img: item.pic,
            desc: decodeName(item.intro),
            source: 'kw',
          }
        }),
        limit,
        total: parseInt(body.TOTAL),
        source: 'kw',
      }
    })
  },
}

// getList
// getTags
// getListDetail
