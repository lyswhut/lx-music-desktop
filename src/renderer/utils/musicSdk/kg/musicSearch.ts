import { httpFetch } from '../../request'
import { decodeName, formatPlayTime } from '../../index'
import { formatSingerName } from '../utils'
import { getBatchMusicQualityInfo } from './quality_detail'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,
  async musicSearch(str: string, page: number, limit: number): Promise<any> {
    // 上游 #2849：搜索接口 platform 从 WebFilter 切换到 AndroidFilter
    const searchRequest = httpFetch(
      `http://songsearch.kugou.com/song_search_v2?platform=AndroidFilter&iscorrection=1&keyword=${encodeURIComponent(
        str,
      )}&hifiquality=0&pagesize=${limit}&PrivilegeFilter=0&page=${page}`,
    )
    return searchRequest.promise.then(({ body }: any) => body)
  },
  async handleResult(rawData: any[]): Promise<any[]> {
    let ids = new Set<string>()
    const items: any[] = []

    rawData.forEach((item: any) => {
      const key = item.Audioid + item.FileHash
      if (!ids.has(key)) {
        ids.add(key)
        items.push(item)
      }

      for (const childItem of item.Grp || []) {
        const childKey = childItem.Audioid + childItem.FileHash
        if (!ids.has(childKey)) {
          ids.add(childKey)
          items.push(childItem)
        }
      }
    })

    const hashList = items.map((item: any) => item.FileHash)

    let qualityInfoMap: any = {}
    try {
      const qualityInfoRequest = getBatchMusicQualityInfo(hashList)
      qualityInfoMap = await qualityInfoRequest.promise
    } catch (error) {
      console.error('Failed to fetch quality info:', error)
    }

    return items.map((item: any) => {
      const { types = [], _types = {} } = qualityInfoMap[item.FileHash] || {}

      return {
        singer: decodeName(formatSingerName(item.Singers, 'name')),
        // 上游 #2782：修复搜索结果显示问题，使用_ori 歌名 + 音质后缀
        name: decodeName(`${item.OriSongName ?? item.SongName}${item.Suffix ? ` ${item.Suffix}` : ''}`),
        albumName: decodeName(item.AlbumName),
        albumId: item.AlbumID,
        songmid: item.Audioid,
        // 上游 #2849：AndroidFilter 接口返回 MixSongID（即 album_audio_id），用于后续歌词精确搜索
        albumAudioId: item.MixSongID,
        source: 'kg',
        interval: formatPlayTime(item.Duration),
        _interval: item.Duration,
        img: null,
        lrc: null,
        otherSource: null,
        hash: item.FileHash,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  async search(str: string, page: number = 1, limit?: number | null, retryNum: number = 0): Promise<any> {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    return this.musicSearch(str, page, limit).then(async(result: any) => {
      if (!result || result.error_code !== 0) return this.search(str, page, limit, retryNum)

      let list = await this.handleResult(result.data.lists)

      if (list == null) return this.search(str, page, limit, retryNum)

      this.total = result.data.total
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return Promise.resolve({
        list,
        allPage: this.allPage,
        limit,
        total: this.total,
        source: 'kg',
      })
    })
  },
}
