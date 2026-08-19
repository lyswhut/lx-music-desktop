import { signRequest } from './utils'

export default {
  search(text, page, limit = 20) {
    const searchRequest = signRequest({
      comm: {
        ct: '11',
        cv: '14090508',
        v: '14090508',
        tmeAppID: 'qqmusic',
        phonetype: 'EBG-AN10',
        deviceScore: '553.47',
        devicelevel: '50',
        newdevicelevel: '20',
        rom: 'HuaWei/EMOTION/EmotionUI_14.2.0',
        os_ver: '12',
        OpenUDID: '0',
        OpenUDID2: '0',
        QIMEI36: '0',
        udid: '0',
        chid: '0',
        aid: '0',
        oaid: '0',
        taid: '0',
        tid: '0',
        wid: '0',
        uid: '0',
        sid: '0',
        modeSwitch: '6',
        teenMode: '0',
        ui_mode: '2',
        nettype: '1020',
        v4ip: '',
      },
      req: {
        module: 'music.search.SearchCgiService',
        method: 'DoSearchForQQMusicMobile',
        param: {
          search_type: 2, // 0 单曲, 1 歌手, 2 专辑, 3 歌单
          searchid: Math.random().toString().slice(2),
          query: text,
          page_num: page,
          num_per_page: limit,
          highlight: 0,
          nqc_flag: 0,
          multi_zhida: 0,
          cat: 2,
          grp: 1,
          sin: 0,
          sem: 0,
        },
      },
    })
    return searchRequest.then(({ body }) => {
      if (!body || !body.req || body.code != 0 || body.req.code != 0) throw new Error('搜索失败')
      const reqData = body.req.data ?? {}
      const albumList = reqData.body?.item_album ?? []
      return {
        list: albumList.map(item => ({
          play_count: '',
          id: `album__${item.albummid}`,
          author: item.singer,
          name: item.name,
          time: item.publish_date || item.description || '',
          img: item.pic || `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.albummid}.jpg`,
          total: item.song_num,
          desc: null,
          source: 'tx',
        })),
        limit,
        total: reqData.meta?.estimate_sum ?? 0,
        source: 'tx',
      }
    })
  },
}
