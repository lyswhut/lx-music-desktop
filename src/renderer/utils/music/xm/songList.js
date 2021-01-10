import { xmRequest } from './util'
import { sizeFormate, formatPlayTime } from '../../index'

export default {
  _requestObj_tags: null,
  _requestObj_list: null,
  _requestObj_listDetail: null,
  limit_list: 36,
  limit_song: 100000,
  successCode: 'SUCCESS',
  sortList: [
    {
      name: '推荐',
      id: 'system',
    },
    {
      name: '精选',
      id: 'recommend',
    },
    {
      name: '最热',
      id: 'hot',
    },
    {
      name: '最新',
      id: 'new',
    },
  ],
  regExps: {
    // https://www.xiami.com/collect/1138092824?action=play
    listDetailLink: /^.+\/collect\/(\d+)(?:\s\(.*|\?.*|&.*$|#.*$|$)/,
  },
  tagsUrl: '/api/collect/getRecommendTags',
  songListUrl: '/api/list/collect',
  songListDetailUrl: '/api/collect/initialize',
  getSongListData(sortId, tagId, page) {
    if (tagId == null) {
      return { pagingVO: { page, pageSize: this.limit_list }, dataType: sortId }
    }
    switch (sortId) {
      case 'system':
      case 'recommend':
        sortId = 'hot'
    }
    return { pagingVO: { page, pageSize: this.limit_list }, dataType: sortId, key: tagId }
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
  getSinger(singers) {
    let arr = []
    singers.forEach(singer => {
      arr.push(singer.artistName)
    })
    return arr.join('、')
  },

  getListDetail(id, page, tryNum = 0) { // 获取歌曲列表内的音乐
    if (this._requestObj_listDetail) this._requestObj_listDetail.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))

    if ((/[?&:/]/.test(id))) id = id.replace(this.regExps.listDetailLink, '$1')

    this._requestObj_listDetail = xmRequest('/api/collect/getCollectStaticUrl', { listId: id })
    return this._requestObj_listDetail.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getListDetail(id, page, ++tryNum)
      this._requestObj_listDetail = xmRequest(body.result.data.data.data.url)
      return this._requestObj_listDetail.promise.then(({ body }) => {
        if (!body.status) return this.getListDetail(id, page, ++tryNum)
        // console.log(JSON.stringify(body))
        return {
          list: this.filterListDetail(body.resultObj.songs),
          page,
          limit: this.limit_song,
          total: body.resultObj.songCount,
          source: 'xm',
          info: {
            name: body.resultObj.collectName,
            img: body.resultObj.collectLogo,
            desc: body.resultObj.description,
            author: body.resultObj.userName,
            play_count: this.formatPlayCount(body.resultObj.playCount),
          },
        }
      })
    })
  },
  filterListDetail(rawList) {
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
        songStringId: songData.songStringId,
        img: songData.albumLogo || songData.albumLogoS,
        lrc: null,
        lrcUrl: songData.lyricInfo && songData.lyricInfo.lyricFile,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    })
    return list
  },

  // 获取列表数据
  getList(sortId, tagId, page, tryNum = 0) {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_list = xmRequest(this.songListUrl, this.getSongListData(sortId, tagId, page))
    return this._requestObj_list.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getList(sortId, tagId, page, ++tryNum)
      return {
        list: this.filterList(body.result.data.collects),
        total: body.result.data.pagingVO.count,
        page,
        limit: body.result.data.pagingVO.pageSize,
        source: 'xm',
      }
    })
  },
  filterList(rawData) {
    return rawData.map(item => ({
      play_count: this.formatPlayCount(item.playCount),
      id: item.listId,
      author: item.userName,
      name: item.collectName,
      time: null,
      img: item.collectLogo,
      grade: null,
      desc: null,
      source: 'xm',
    }))
  },

  // 获取标签
  getTag(tryNum = 0) {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = xmRequest(this.tagsUrl, { recommend: 1 })
    return this._requestObj_tags.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getTag(++tryNum)
      return this.filterTagInfo(body.result.data.recommendTags)
    })
  },
  filterTagInfo(rawList) {
    return {
      hotTag: rawList[0].items.map(item => ({
        id: item.name,
        name: item.name,
        source: 'xm',
      })),
      tags: rawList.slice(1).map(item => ({
        name: item.title,
        list: item.items.map(tag => ({
          parent_id: item.title,
          parent_name: item.title,
          id: tag.name,
          name: tag.name,
          source: 'xm',
        })),
      })),
      source: 'xm',
    }
  },
  getTags() {
    return this.getTag()
  },
}

// getList
// getTags
// getListDetail
