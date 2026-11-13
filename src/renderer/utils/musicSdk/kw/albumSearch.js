import { httpFetch } from '../../request'
import { decodeName } from '../../index'
import { objStr2JSON } from './util'

export default {
  search(text, page, limit = 20) {
    return httpFetch(`http://search.kuwo.cn/r.s?all=${encodeURIComponent(text)}&pn=${page - 1}&rn=${limit}&rformat=json&encoding=utf8&ver=mbox&vipver=MUSIC_8.7.7.0_BCS37&plat=pc&devid=28156413&ft=album&pay=0&needliveshow=0`)
      .promise.then(({ body }) => {
        body = objStr2JSON(body)
        return {
          list: (body.albumlist ?? []).map(item => ({
            play_count: '',
            id: `album__${item.albumid}`,
            author: decodeName(item.artist),
            name: decodeName(item.name),
            time: item.pub || '',
            img: item.hts_img || item.img || `http://img3.sycdn.kuwo.cn/star/albumcover/${item.pic}`,
            total: item.musiccnt,
            desc: item.info ? decodeName(item.info) : null,
            source: 'kw',
          })),
          limit,
          total: parseInt(body.total ?? body.SHOW ?? 0),
          source: 'kw',
        }
      })
  },
}
