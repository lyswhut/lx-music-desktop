import { eapiRequest } from './utils/index'
import { dateFormat } from '../../index'
import { formatSingerName } from '../utils'

export default {
  successCode: 200,
  filterList(rawData) {
    return rawData.map(item => ({
      play_count: '',
      id: `album__${item.id}`,
      author: formatSingerName(item.artists),
      name: item.name,
      time: item.publishTime ? dateFormat(item.publishTime, 'Y-M-D') : '',
      img: item.picUrl,
      total: item.size,
      desc: null,
      source: 'wy',
    }))
  },
  search(text, page, limit = 20) {
    return eapiRequest('/api/cloudsearch/pc', {
      s: text,
      type: 10, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
      limit,
      total: page == 1,
      offset: limit * (page - 1),
    })
      .promise.then(({ body }) => {
        if (body.code != this.successCode) throw new Error('filed')
        const result = body.result ?? {}
        return {
          list: this.filterList(result.albums ?? []),
          limit,
          total: result.albumCount ?? 0,
          source: 'wy',
        }
      })
  },
}
