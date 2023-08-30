import { httpFetch } from '../../request'
import { dateFormat, formatPlayCount } from '../../index'
import { filterMusicInfoList } from './musicInfo'
import { createSignature } from './musicSearch'
import { createHttpFetch } from './utils/index'

// const tagData = { code: '000000', info: 'SUCCESS', columnInfo: { columnTitle: '分类', columnId: '15244430', columnPid: '15031270', opNumItem: { playNum: 0, playNumDesc: '0', keepNum: 0, keepNumDesc: '0', commentNum: 0, commentNumDesc: '0', shareNum: 0, shareNumDesc: '0', orderNumByWeek: 0, orderNumByWeekDesc: '0', orderNumByTotal: 0, orderNumByTotalDesc: '0', thumbNum: 0, thumbNumDesc: '0', followNum: 0, followNumDesc: '0', subscribeNum: 0, subscribeNumDesc: '0', livePlayNum: 0, livePlayNumDesc: '0', popularNum: 0, popularNumDesc: '0', bookingNum: 0, bookingNumDesc: '0' }, contentsCount: 6, columnStatus: 1, columnCreateTime: '2016-11-10 10:53:05.077', columntype: 2011, contents: [{ contentId: '18464615', relationType: 2011, objectInfo: { columnTitle: '热门', columnId: '18464615', columnPid: '15244430', opNumItem: { playNum: 0, playNumDesc: '0', keepNum: 0, keepNumDesc: '0', commentNum: 0, commentNumDesc: '0', shareNum: 0, shareNumDesc: '0', orderNumByWeek: 0, orderNumByWeekDesc: '0', orderNumByTotal: 0, orderNumByTotalDesc: '0', thumbNum: 0, thumbNumDesc: '0', followNum: 0, followNumDesc: '0', subscribeNum: 0, subscribeNumDesc: '0', livePlayNum: 0, livePlayNumDesc: '0', popularNum: 0, popularNumDesc: '0', bookingNum: 0, bookingNumDesc: '0' }, contentsCount: 8, columnStatus: 1, columnCreateTime: '2017-02-20 16:09:13.400', columntype: 2011, contents: [{ contentId: '1000001672', relationType: 4034, objectInfo: { tagId: '1000001672', tagName: '流行', resourceType: '2034' }, relationSort: 9 }, { contentId: '1003449727', relationType: 4034, objectInfo: { tagId: '1003449727', tagName: '厂牌', resourceType: '2034' }, relationSort: 8 }, { contentId: '1000001795', relationType: 4034, objectInfo: { tagId: '1000001795', tagName: '伤感', resourceType: '2034' }, relationSort: 7 }, { contentId: '1001076080', relationType: 4034, objectInfo: { tagId: '1001076080', tagName: '电影', resourceType: '2034' }, relationSort: 6 }, { contentId: '1000001675', relationType: 4034, objectInfo: { tagId: '1000001675', tagName: '中国风', resourceType: '2034' }, relationSort: 5 }, { contentId: '1000001635', relationType: 4034, objectInfo: { tagId: '1000001635', tagName: '经典老歌', resourceType: '2034' }, relationSort: 4 }, { contentId: '1000001831', relationType: 4034, objectInfo: { tagId: '1000001831', tagName: '翻唱', resourceType: '2034' }, relationSort: 3 }, { contentId: '1000001762', relationType: 4034, objectInfo: { tagId: '1000001762', tagName: '国语', resourceType: '2034' }, relationSort: 1 }], dataVersion: '1620410266029', customizedPicUrls: [] }, relationSort: 6 }, { contentId: '15244503', relationType: 2011, objectInfo: { columnTitle: '主题', columnId: '15244503', columnPid: '15244430', opNumItem: { playNum: 0, playNumDesc: '0', keepNum: 0, keepNumDesc: '0', commentNum: 0, commentNumDesc: '0', shareNum: 0, shareNumDesc: '0', orderNumByWeek: 0, orderNumByWeekDesc: '0', orderNumByTotal: 0, orderNumByTotalDesc: '0', thumbNum: 0, thumbNumDesc: '0', followNum: 0, followNumDesc: '0', subscribeNum: 0, subscribeNumDesc: '0', livePlayNum: 0, livePlayNumDesc: '0', popularNum: 0, popularNumDesc: '0', bookingNum: 0, bookingNumDesc: '0' }, contentsCount: 23, columnStatus: 1, columnCreateTime: '2016-11-10 10:54:10.261', columntype: 2011, contents: [{ contentId: '1003449727', relationType: 4034, objectInfo: { tagId: '1003449727', tagName: '厂牌', resourceType: '2034' }, relationSort: 29 }, { contentId: '1001076080', relationType: 4034, objectInfo: { tagId: '1001076080', tagName: '电影', resourceType: '2034' }, relationSort: 28 }, { contentId: '1001076078', relationType: 4034, objectInfo: { tagId: '1001076078', tagName: '电视剧', resourceType: '2034' }, relationSort: 27 }, { contentId: '1001076083', relationType: 4034, objectInfo: { tagId: '1001076083', tagName: '综艺', resourceType: '2034' }, relationSort: 26 }, { contentId: '1000001827', relationType: 4034, objectInfo: { tagId: '1000001827', tagName: 'KTV', resourceType: '2034' }, relationSort: 23 }, { contentId: '1000001698', relationType: 4034, objectInfo: { tagId: '1000001698', tagName: '爱情', resourceType: '2034' }, relationSort: 22 }, { contentId: '1000001635', relationType: 4034, objectInfo: { tagId: '1000001635', tagName: '经典老歌', resourceType: '2034' }, relationSort: 21 }, { contentId: '1001076096', relationType: 4034, objectInfo: { tagId: '1001076096', tagName: '网络热歌', resourceType: '2034' }, relationSort: 20 }, { contentId: '1000001780', relationType: 4034, objectInfo: { tagId: '1000001780', tagName: '儿童歌曲', resourceType: '2034' }, relationSort: 19 }, { contentId: '1000587702', relationType: 4034, objectInfo: { tagId: '1000587702', tagName: '广场舞', resourceType: '2034' }, relationSort: 18 }, { contentId: '1000587717', relationType: 4034, objectInfo: { tagId: '1000587717', tagName: '70后', resourceType: '2034' }, relationSort: 17 }, { contentId: '1000587718', relationType: 4034, objectInfo: { tagId: '1000587718', tagName: '80后', resourceType: '2034' }, relationSort: 16 }, { contentId: '1000587726', relationType: 4034, objectInfo: { tagId: '1000587726', tagName: '90后', resourceType: '2034' }, relationSort: 15 }, { contentId: '1000001670', relationType: 4034, objectInfo: { tagId: '1000001670', tagName: '红歌', resourceType: '2034' }, relationSort: 14 }, { contentId: '1000587698', relationType: 4034, objectInfo: { tagId: '1000587698', tagName: '游戏', resourceType: '2034' }, relationSort: 13 }, { contentId: '1000587706', relationType: 4034, objectInfo: { tagId: '1000587706', tagName: '动漫', resourceType: '2034' }, relationSort: 12 }, { contentId: '1000001675', relationType: 4034, objectInfo: { tagId: '1000001675', tagName: '中国风', resourceType: '2034' }, relationSort: 11 }, { contentId: '1000587712', relationType: 4034, objectInfo: { tagId: '1000587712', tagName: '青春校园', resourceType: '2034' }, relationSort: 10 }, { contentId: '1000587673', relationType: 4034, objectInfo: { tagId: '1000587673', tagName: '小清新', resourceType: '2034' }, relationSort: 9 }, { contentId: '1000093902', relationType: 4034, objectInfo: { tagId: '1000093902', tagName: 'DJ舞曲', resourceType: '2034' }, relationSort: 7 }, { contentId: '1000093963', relationType: 4034, objectInfo: { tagId: '1000093963', tagName: '广告', resourceType: '2034' }, relationSort: 6 }, { contentId: '1000001831', relationType: 4034, objectInfo: { tagId: '1000001831', tagName: '翻唱', resourceType: '2034' }, relationSort: 2 }, { contentId: '1003449726', relationType: 4034, objectInfo: { tagId: '1003449726', tagName: '读书', resourceType: '2034' }, relationSort: 1 }], dataVersion: '1620410266055', customizedPicUrls: [] }, relationSort: 5 }, { contentId: '15244509', relationType: 2011, objectInfo: { columnTitle: '风格', columnId: '15244509', columnPid: '15244430', opNumItem: { playNum: 0, playNumDesc: '0', keepNum: 0, keepNumDesc: '0', commentNum: 0, commentNumDesc: '0', shareNum: 0, shareNumDesc: '0', orderNumByWeek: 0, orderNumByWeekDesc: '0', orderNumByTotal: 0, orderNumByTotalDesc: '0', thumbNum: 0, thumbNumDesc: '0', followNum: 0, followNumDesc: '0', subscribeNum: 0, subscribeNumDesc: '0', livePlayNum: 0, livePlayNumDesc: '0', popularNum: 0, popularNumDesc: '0', bookingNum: 0, bookingNumDesc: '0' }, contentsCount: 12, columnStatus: 1, columnCreateTime: '2016-11-10 10:54:57.257', columntype: 2011, contents: [{ contentId: '1000001672', relationType: 4034, objectInfo: { tagId: '1000001672', tagName: '流行', resourceType: '2034' }, relationSort: 14 }, { contentId: '1000001808', relationType: 4034, objectInfo: { tagId: '1000001808', tagName: 'R&B', resourceType: '2034' }, relationSort: 13 }, { contentId: '1000001809', relationType: 4034, objectInfo: { tagId: '1000001809', tagName: '嘻哈', resourceType: '2034' }, relationSort: 12 }, { contentId: '1000001674', relationType: 4034, objectInfo: { tagId: '1000001674', tagName: '摇滚', resourceType: '2034' }, relationSort: 11 }, { contentId: '1000001682', relationType: 4034, objectInfo: { tagId: '1000001682', tagName: '电子', resourceType: '2034' }, relationSort: 10 }, { contentId: '1000001852', relationType: 4034, objectInfo: { tagId: '1000001852', tagName: '电子舞曲', resourceType: '2034' }, relationSort: 9 }, { contentId: '1000001681', relationType: 4034, objectInfo: { tagId: '1000001681', tagName: '爵士', resourceType: '2034' }, relationSort: 6 }, { contentId: '1000001683', relationType: 4034, objectInfo: { tagId: '1000001683', tagName: '乡村', resourceType: '2034' }, relationSort: 5 }, { contentId: '1000001851', relationType: 4034, objectInfo: { tagId: '1000001851', tagName: '蓝调', resourceType: '2034' }, relationSort: 4 }, { contentId: '1000001775', relationType: 4034, objectInfo: { tagId: '1000001775', tagName: '民谣', resourceType: '2034' }, relationSort: 3 }, { contentId: '1000001807', relationType: 4034, objectInfo: { tagId: '1000001807', tagName: '纯音乐', resourceType: '2034' }, relationSort: 2 }, { contentId: '1000001783', relationType: 4034, objectInfo: { tagId: '1000001783', tagName: '古典', resourceType: '2034' }, relationSort: 1 }], dataVersion: '1620410266033', customizedPicUrls: [] }, relationSort: 4 }, { contentId: '18464665', relationType: 2011, objectInfo: { columnTitle: '语种', columnId: '18464665', columnPid: '15244430', opNumItem: { playNum: 0, playNumDesc: '0', keepNum: 0, keepNumDesc: '0', commentNum: 0, commentNumDesc: '0', shareNum: 0, shareNumDesc: '0', orderNumByWeek: 0, orderNumByWeekDesc: '0', orderNumByTotal: 0, orderNumByTotalDesc: '0', thumbNum: 0, thumbNumDesc: '0', followNum: 0, followNumDesc: '0', subscribeNum: 0, subscribeNumDesc: '0', livePlayNum: 0, livePlayNumDesc: '0', popularNum: 0, popularNumDesc: '0', bookingNum: 0, bookingNumDesc: '0' }, contentsCount: 6, columnStatus: 1, columnCreateTime: '2017-02-20 16:07:16.566', columntype: 2011, contents: [{ contentId: '1000001762', relationType: 4034, objectInfo: { tagId: '1000001762', tagName: '国语', resourceType: '2034' }, relationSort: 6 }, { contentId: '1000001763', relationType: 4034, objectInfo: { tagId: '1000001763', tagName: '粤语', resourceType: '2034' }, relationSort: 5 }, { contentId: '1000001766', relationType: 4034, objectInfo: { tagId: '1000001766', tagName: '英语', resourceType: '2034' }, relationSort: 4 }, { contentId: '1000001599', relationType: 4034, objectInfo: { tagId: '1000001599', tagName: '韩语', resourceType: '2034' }, relationSort: 3 }, { contentId: '1000001767', relationType: 4034, objectInfo: { tagId: '1000001767', tagName: '日语', resourceType: '2034' }, relationSort: 2 }, { contentId: '1003449724', relationType: 4034, objectInfo: { tagId: '1003449724', tagName: '小语种', resourceType: '2034' }, relationSort: 1 }], dataVersion: '1620410266036', customizedPicUrls: [] }, relationSort: 3 }, { contentId: '18464583', relationType: 2011, objectInfo: { columnTitle: '心情', columnId: '18464583', columnPid: '15244430', opNumItem: { playNum: 0, playNumDesc: '0', keepNum: 0, keepNumDesc: '0', commentNum: 0, commentNumDesc: '0', shareNum: 0, shareNumDesc: '0', orderNumByWeek: 0, orderNumByWeekDesc: '0', orderNumByTotal: 0, orderNumByTotalDesc: '0', thumbNum: 0, thumbNumDesc: '0', followNum: 0, followNumDesc: '0', subscribeNum: 0, subscribeNumDesc: '0', livePlayNum: 0, livePlayNumDesc: '0', popularNum: 0, popularNumDesc: '0', bookingNum: 0, bookingNumDesc: '0' }, contentsCount: 13, columnStatus: 1, columnCreateTime: '2017-02-20 15:59:03.412', columntype: 2011, contents: [{ contentId: '1000587677', relationType: 4034, objectInfo: { tagId: '1000587677', tagName: '幸福', resourceType: '2034' }, relationSort: 15 }, { contentId: '1000587710', relationType: 4034, objectInfo: { tagId: '1000587710', tagName: '治愈', resourceType: '2034' }, relationSort: 14 }, { contentId: '1000001703', relationType: 4034, objectInfo: { tagId: '1000001703', tagName: '思念', resourceType: '2034' }, relationSort: 13 }, { contentId: '1000587667', relationType: 4034, objectInfo: { tagId: '1000587667', tagName: '期待', resourceType: '2034' }, relationSort: 12 }, { contentId: '1000001700', relationType: 4034, objectInfo: { tagId: '1000001700', tagName: '励志', resourceType: '2034' }, relationSort: 11 }, { contentId: '1000001694', relationType: 4034, objectInfo: { tagId: '1000001694', tagName: '欢快', resourceType: '2034' }, relationSort: 10 }, { contentId: '1002600588', relationType: 4034, objectInfo: { tagId: '1002600588', tagName: '叛逆', resourceType: '2034' }, relationSort: 9 }, { contentId: '1002600585', relationType: 4034, objectInfo: { tagId: '1002600585', tagName: '宣泄', resourceType: '2034' }, relationSort: 8 }, { contentId: '1000001696', relationType: 4034, objectInfo: { tagId: '1000001696', tagName: '怀旧', resourceType: '2034' }, relationSort: 7 }, { contentId: '1000587679', relationType: 4034, objectInfo: { tagId: '1000587679', tagName: '减压', resourceType: '2034' }, relationSort: 6 }, { contentId: '1000001699', relationType: 4034, objectInfo: { tagId: '1000001699', tagName: '寂寞', resourceType: '2034' }, relationSort: 5 }, { contentId: '1002600579', relationType: 4034, objectInfo: { tagId: '1002600579', tagName: '忧郁', resourceType: '2034' }, relationSort: 4 }, { contentId: '1000001795', relationType: 4034, objectInfo: { tagId: '1000001795', tagName: '伤感', resourceType: '2034' }, relationSort: 3 }], dataVersion: '1620410266187', customizedPicUrls: [] }, relationSort: 2 }, { contentId: '18464638', relationType: 2011, objectInfo: { columnTitle: '场景', columnId: '18464638', columnPid: '15244430', opNumItem: { playNum: 0, playNumDesc: '0', keepNum: 0, keepNumDesc: '0', commentNum: 0, commentNumDesc: '0', shareNum: 0, shareNumDesc: '0', orderNumByWeek: 0, orderNumByWeekDesc: '0', orderNumByTotal: 0, orderNumByTotalDesc: '0', thumbNum: 0, thumbNumDesc: '0', followNum: 0, followNumDesc: '0', subscribeNum: 0, subscribeNumDesc: '0', livePlayNum: 0, livePlayNumDesc: '0', popularNum: 0, popularNumDesc: '0', bookingNum: 0, bookingNumDesc: '0' }, contentsCount: 13, columnStatus: 1, columnCreateTime: '2017-02-20 16:02:59.711', columntype: 2011, contents: [{ contentId: '1000587689', relationType: 4034, objectInfo: { tagId: '1000587689', tagName: '清晨', resourceType: '2034' }, relationSort: 21 }, { contentId: '1000587690', relationType: 4034, objectInfo: { tagId: '1000587690', tagName: '夜晚', resourceType: '2034' }, relationSort: 20 }, { contentId: '1000587688', relationType: 4034, objectInfo: { tagId: '1000587688', tagName: '睡前安眠', resourceType: '2034' }, relationSort: 19 }, { contentId: '1003449726', relationType: 4034, objectInfo: { tagId: '1003449726', tagName: '读书', resourceType: '2034' }, relationSort: 18 }, { contentId: '1003449723', relationType: 4034, objectInfo: { tagId: '1003449723', tagName: '下午·茶', resourceType: '2034' }, relationSort: 16 }, { contentId: '1000093923', relationType: 4034, objectInfo: { tagId: '1000093923', tagName: '驾车', resourceType: '2034' }, relationSort: 15 }, { contentId: '1003449615', relationType: 4034, objectInfo: { tagId: '1003449615', tagName: '运动', resourceType: '2034' }, relationSort: 13 }, { contentId: '1000587694', relationType: 4034, objectInfo: { tagId: '1000587694', tagName: '散步', resourceType: '2034' }, relationSort: 12 }, { contentId: '1000001749', relationType: 4034, objectInfo: { tagId: '1000001749', tagName: '旅行', resourceType: '2034' }, relationSort: 11 }, { contentId: '1000587686', relationType: 4034, objectInfo: { tagId: '1000587686', tagName: '夜店', resourceType: '2034' }, relationSort: 10 }, { contentId: '1002600606', relationType: 4034, objectInfo: { tagId: '1002600606', tagName: '派对', resourceType: '2034' }, relationSort: 9 }, { contentId: '1000001634', relationType: 4034, objectInfo: { tagId: '1000001634', tagName: '咖啡馆', resourceType: '2034' }, relationSort: 3 }, { contentId: '1000587692', relationType: 4034, objectInfo: { tagId: '1000587692', tagName: '瑜伽', resourceType: '2034' }, relationSort: 1 }], dataVersion: '1620846028994', customizedPicUrls: [] }, relationSort: 1 }], dataVersion: '1620846028941', customizedPicUrls: [] } }

export default {
  _requestObj_tags: null,
  _requestObj_list: null,
  limit_list: 10,
  limit_song: 50,
  successCode: '000000',
  cachedDetailInfo: {},
  cachedUrl: {},
  sortList: [
    {
      name: '推荐',
      id: '15127315',
      // id: '1',
    },
    {
      name: '最新',
      id: '15127272',
      // id: '2',
    },
  ],
  regExps: {
    list: /<li><div class="thumb">.+?<\/li>/g,
    listInfo: /.+data-original="(.+?)".*data-id="(\d+)".*<div class="song-list-name"><a\s.*?>(.+?)<\/a>.+<i class="iconfont cf-bofangliang"><\/i>(.+?)<\/div>/,

    // https://music.migu.cn/v3/music/playlist/161044573?page=1
    listDetailLink: /^.+\/playlist\/(\d+)(?:\?.*|&.*$|#.*$|$)/,
  },
  tagsUrl: 'https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/musiclistplaza-taglist/release',
  // tagsUrl: 'https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/indexTagPage.do?needAll=0',
  getSongListUrl(sortId, tagId, page) {
    // if (tagId == null) {
    //   return sortId == 'recommend'
    //     ? `https://music.migu.cn/v3/music/playlist?page=${page}&from=migu`
    //     : `https://music.migu.cn/v3/music/playlist?sort=${sortId}&page=${page}&from=migu`
    // }
    // return `https://music.migu.cn/v3/music/playlist?tagId=${tagId}&page=${page}&from=migu`
    if (tagId == null) {
      // return `https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/getMusicData.do?count=${this.limit_list}&start=${page}&templateVersion=5&type=1`
      // return `https://c.musicapp.migu.cn/MIGUM2.0/v2.0/content/getMusicData.do?count=${this.limit_list}&start=${page}&templateVersion=5&type=${sortId}`
      // https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/getMusicData.do?count=50&start=2&templateVersion=5&type=1
      return `https://m.music.migu.cn/migu/remoting/playlist_bycolumnid_tag?playListType=2&type=1&columnId=${sortId}&startIndex=${(page - 1) * 10}`
    }
    // return `https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/getMusicData.do?area=2&count=${this.limit_list}&start=${page}&tags=${tagId}&templateVersion=5&type=3`
    return `https://m.music.migu.cn/migu/remoting/playlist_bycolumnid_tag?playListType=2&type=1&tagId=${tagId}&startIndex=${(page - 1) * 10}`
  },
  getSongListDetailUrl(id, page) {
    return `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/user/queryMusicListSongs.do?musicListId=${id}&pageNo=${page}&pageSize=${this.limit_song}`
  },
  defaultHeaders: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    Referer: 'https://m.music.migu.cn/',
    // language: 'Chinese',
    // ua: 'Android_migu',
    // mode: 'android',
    // version: '6.8.5',
  },

  getListDetailList(id, page, tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    // https://h5.nf.migu.cn/app/v4/p/share/playlist/index.html?id=184187437&channel=0146921

    if (/playlist\/index\.html\?/.test(id)) {
      id = id.replace(/.*(?:\?|&)id=(\d+)(?:&.*|$)/, '$1')
    } else if ((/[?&:/]/.test(id))) id = id.replace(this.regExps.listDetailLink, '$1')

    const requestObj_listDetail = httpFetch(this.getSongListDetailUrl(id, page), { headers: this.defaultHeaders })
    return requestObj_listDetail.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getListDetail(id, page, ++tryNum)
      // console.log(JSON.stringify(body))
      // console.log(body)
      return {
        list: filterMusicInfoList(body.list),
        page,
        limit: this.limit_song,
        total: body.totalCount,
        source: 'mg',
      }
    })
  },

  getListDetailInfo(id, tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))

    if (this.cachedDetailInfo[id]) return Promise.resolve(this.cachedDetailInfo[id])
    const requestObj_listDetailInfo = httpFetch(`https://c.musicapp.migu.cn/MIGUM3.0/resource/playlist/v2.0?playlistId=${id}`, {
      headers: this.defaultHeaders,
    })
    return requestObj_listDetailInfo.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getListDetail(id, ++tryNum)
      // console.log(JSON.stringify(body))
      // console.log(body)
      const cachedDetailInfo = this.cachedDetailInfo[id] = {
        name: body.data.title,
        img: body.data.imgItem.img,
        desc: body.data.summary,
        author: body.data.ownerName,
        play_count: formatPlayCount(body.data.opNumItem.playNum),
      }
      return cachedDetailInfo
    })
  },

  async getDetailUrl(link, page, retryNum = 0) {
    if (retryNum > 3) return Promise.reject(new Error('link try max num'))

    const requestObj_listDetailLink = httpFetch(link, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        Referer: link,
      },
    })
    const { headers: { location }, statusCode } = await requestObj_listDetailLink.promise
    // console.log(body, location)
    if (statusCode > 400) return this.getDetailUrl(link, page, ++retryNum)
    if (location) {
      this.cachedUrl[link] = location
      return this.getListDetail(location, page)
    }
    return Promise.reject(new Error('link get failed'))
  },

  getListDetail(id, page, retryNum = 0) { // 获取歌曲列表内的音乐
    // https://h5.nf.migu.cn/app/v4/p/share/playlist/index.html?id=184187437&channel=0146921
    // http://c.migu.cn/00bTY6?ifrom=babddaadfde4ebeda289d671ab62f236
    if (/playlist\/index\.html\?/.test(id)) {
      id = id.replace(/.*(?:\?|&)id=(\d+)(?:&.*|$)/, '$1')
    } else if (this.regExps.listDetailLink.test(id)) {
      id = id.replace(this.regExps.listDetailLink, '$1')
    } else if ((/[?&:/]/.test(id))) {
      const url = this.cachedUrl[id]
      return url ? this.getListDetail(url, page) : this.getDetailUrl(id, page)
    }

    return Promise.all([
      this.getListDetailList(id, page, retryNum),
      this.getListDetailInfo(id, retryNum),
    ]).then(([listData, info]) => {
      listData.info = info
      return listData
    })
  },

  // 获取列表数据
  getList(sortId, tagId, page, tryNum = 0) {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_list = httpFetch(this.getSongListUrl(sortId, tagId, page), {
      headers: this.defaultHeaders,
      // headers: {
      //   sign: 'c3b7ae985e2206e97f1b2de8f88691e2',
      //   timestamp: 1578225871982,
      //   appId: 'yyapp2',
      //   mode: 'android',
      //   ua: 'Android_migu',
      //   version: '6.9.4',
      //   osVersion: 'android 7.0',
      //   'User-Agent': 'okhttp/3.9.1',
      // },
    })
    // return this._requestObj_list.promise.then(({ statusCode, body }) => {
    //   if (statusCode !== 200) return this.getList(sortId, tagId, page)
    //   let list = body.replace(/[\r\n]/g, '').match(this.regExps.list)
    //   if (!list) return Promise.reject(new Error('获取列表失败'))
    //   return list.map(item => {
    //     let info = item.match(this.regExps.listInfo)
    //     return {
    //       play_count: info[4],
    //       id: info[2],
    //       author: '',
    //       name: info[3],
    //       time: '',
    //       img: info[1],
    //       grade: 0,
    //       desc: '',
    //       source: 'mg',
    //     }
    //   })
    // })
    return this._requestObj_list.promise.then(({ body }) => {
      // console.log(body)
      if (body.retCode !== '100000' || body.retMsg.code !== this.successCode) return this.getList(sortId, tagId, page, ++tryNum)
      return {
        list: this.filterList(body.retMsg.playlist),
        total: parseInt(body.retMsg.countSize),
        page,
        limit: this.limit_list,
        source: 'mg',
      }
    })
    // return this._requestObj_list.promise.then(({ body }) => {
    //   if (body.retCode !== '100000') return this.getList(sortId, tagId, page, ++tryNum)
    //   // if (body.code !== '000000') return this.getList(sortId, tagId, page, ++tryNum)
    //   console.log(body)
    //   // return {
    //   //   list: this.filterList(body.data.contentItemList[0].itemList),
    //   //   total: parseInt(body.retMsg.countSize),
    //   //   page,
    //   //   limit: this.limit_list,
    //   //   source: 'mg',
    //   // }
    // })
  },
  filterList(rawData) {
    // console.log(rawData)
    return rawData.map(item => ({
      play_count: formatPlayCount(item.playCount),
      id: String(item.playListId),
      author: item.createName,
      name: item.playListName,
      time: dateFormat(item.createTime, 'Y-M-D'),
      img: item.image,
      grade: item.grade,
      total: item.contentCount,
      desc: item.summary,
      source: 'mg',
    }))
  },

  // 获取标签
  getTag(tryNum = 0) {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = httpFetch(this.tagsUrl, { headers: this.defaultHeaders })
    return this._requestObj_tags.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getTag(++tryNum)
      // console.log(body)
      return this.filterTagInfo(body.data)
    })
    // return Promise.resolve(this.filterTagInfo(tagData.columnInfo.contents))
  },
  filterTagInfo(rawList) {
    return {
      hotTag: rawList[0].content.map(({ texts: [name, id] }) => ({
        id,
        name,
        source: 'mg',
      })),
      tags: rawList.slice(1).map(({ header, content }) => ({
        name: header.title,
        list: content.map(({ texts: [name, id] }) => ({
          // parent_id: objectInfo.columnId,
          // parent_name: objectInfo.columnTitle,
          id,
          name,
          source: 'mg',
        })),
      })),
      source: 'mg',
    }
    // return {
    //   hotTag: rawList[0].objectInfo.contents.map(item => ({
    //     id: item.objectInfo.tagId,
    //     name: item.objectInfo.tagName,
    //     source: 'mg',
    //   })),
    //   tags: rawList.slice(1).map(({ objectInfo }) => ({
    //     name: objectInfo.columnTitle,
    //     list: objectInfo.contents.map(item => ({
    //       parent_id: objectInfo.columnId,
    //       parent_name: objectInfo.columnTitle,
    //       id: item.objectInfo.tagId,
    //       name: item.objectInfo.tagName,
    //       source: 'mg',
    //     })),
    //   })),
    //   source: 'mg',
    // }
  },
  getTags() {
    return this.getTag()
  },

  getDetailPageUrl(id) {
    if (/playlist\/index\.html\?/.test(id)) {
      id = id.replace(/.*(?:\?|&)id=(\d+)(?:&.*|$)/, '$1')
    } else if (this.regExps.listDetailLink.test(id)) {
      id = id.replace(this.regExps.listDetailLink, '$1')
    }
    return `https://music.migu.cn/v3/music/playlist/${id}`
  },

  filterSongListResult(raw) {
    const list = []
    raw.forEach(item => {
      if (!item.id) return

      const playCount = parseInt(item.playNum)
      list.push({
        play_count: isNaN(playCount) ? 0 : formatPlayCount(playCount),
        id: item.id,
        author: item.userName,
        name: item.name,
        img: item.musicListPicUrl,
        total: item.musicNum,
        source: 'mg',
      })
    })
    return list
  },
  search(text, page, limit = 20) {
    const timeStr = Date.now().toString()
    const signResult = createSignature(timeStr, text)
    return createHttpFetch(`https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=1&isCopyright=1&searchSwitch=%7B%22song%22%3A0%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A0%2C%22mvSong%22%3A0%2C%22bestShow%22%3A0%2C%22songlist%22%3A1%2C%22lyricSong%22%3A0%7D&pageSize=${limit}&text=${encodeURIComponent(text)}&pageNo=${page}&sort=0`, {
      headers: {
        uiVersion: 'A_music_3.6.1',
        deviceId: signResult.deviceId,
        timestamp: timeStr,
        sign: signResult.sign,
        channel: '0146921',
        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 11.0.0; zh-cn; MI 11 Build/OPR1.170623.032) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
      },
    }).then(body => {
      if (!body.songListResultData) throw new Error('get song list faild.')

      const list = this.filterSongListResult(body.songListResultData.result)
      return {
        list,
        limit,
        total: parseInt(body.songListResultData.totalCount),
        source: 'mg',
      }
    })
  },
}

// getList
// getTags
// getListDetail
