import { httpFetch } from '../../request'
import { decodeName, dateFormat } from '../../index'

export default {
  search(text, page, limit = 20) {
    // http://msearchretry.kugou.com/api/v3/search/album?keyword=xxx&page=1&pagesize=20&showtype=10&filter=0&version=7910&sver=2
    return httpFetch(`http://msearchretry.kugou.com/api/v3/search/album?keyword=${encodeURIComponent(text)}&page=${page}&pagesize=${limit}&showtype=10&filter=0&version=7910&sver=2`)
      .promise.then(({ body }) => {
        if (body.errcode != 0) throw new Error('filed')
        return {
          list: (body.data?.info ?? []).map(item => ({
            play_count: '',
            id: `album__${item.albumid}`,
            author: decodeName(item.singername),
            name: decodeName(item.albumname),
            time: item.publishtime ? dateFormat(item.publishtime, 'Y-M-D') : '',
            img: item.imgurl && item.imgurl.replace('{size}', 240),
            total: item.songcount,
            desc: null,
            source: 'kg',
          })),
          limit,
          total: body.data?.total ?? 0,
          source: 'kg',
        }
      })
  },
}
