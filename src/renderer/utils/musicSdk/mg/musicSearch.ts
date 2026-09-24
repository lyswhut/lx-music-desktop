import { httpFetch } from '../../request'
import { sizeFormate, formatPlayTime } from '../../index'
import { toMD5, formatSingerName } from '../utils'

export const createSignature = (time: string, str: string): { sign: string, deviceId: string } => {
  const deviceId = '963B7AA0D21511ED807EE5846EC87D20'
  const signatureMd5 = '6cdc72a439cef99a3418d2a78aa28c73'
  const sign = toMD5(
    `${str}${signatureMd5}yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${time}`,
  )
  return { sign, deviceId }
}

export default {
  limit: 20,
  total: 0,
  page: 0,
  allPage: 1,

  async musicSearch(str: string, page: number, limit: number): Promise<any> {
    const time = Date.now().toString()
    const signData = createSignature(time, str)
    const searchRequest = httpFetch(
      `https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=0&isCopyright=1&searchSwitch=%7B%22song%22%3A1%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A1%2C%22mvSong%22%3A0%2C%22bestShow%22%3A1%2C%22songlist%22%3A0%2C%22lyricSong%22%3A0%7D&pageSize=${limit}&text=${encodeURIComponent(str)}&pageNo=${page}&sort=0&sid=USS`,
      {
        headers: {
          uiVersion: 'A_music_3.6.1',
          deviceId: signData.deviceId,
          timestamp: time,
          sign: signData.sign,
          channel: '0146921',
          'User-Agent':
            'Mozilla/5.0 (Linux; U; Android 11.0.0; zh-cn; MI 11 Build/OPR1.170623.032) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
        },
      },
    )
    return searchRequest.promise.then(({ body }: any) => body)
  },
  filterData(rawData: any[][]): any[] {
    // console.log(rawData)
    const list: any[] = []
    const ids = new Set<string>()

    rawData.forEach((item: any[]) => {
      item.forEach((data: any) => {
        if (!data.songId || !data.copyrightId || ids.has(data.copyrightId)) return
        ids.add(data.copyrightId)

        const types: any[] = []
        const _types: Record<string, any> = {}
        data.audioFormats?.forEach((type: any) => {
          let size: string
          switch (type.formatType) {
            case 'PQ':
              size = sizeFormate(type.asize ?? type.isize)
              types.push({ type: '128k', size })
              _types['128k'] = {
                size,
              }
              break
            case 'HQ':
              size = sizeFormate(type.asize ?? type.isize)
              types.push({ type: '320k', size })
              _types['320k'] = {
                size,
              }
              break
            case 'SQ':
              size = sizeFormate(type.asize ?? type.isize)
              types.push({ type: 'flac', size })
              _types.flac = {
                size,
              }
              break
            case 'ZQ24':
              size = sizeFormate(type.asize ?? type.isize)
              types.push({ type: 'hires', size })
              _types.hires = {
                size,
              }
              break
          }
        })

        let img = data.img3 || data.img2 || data.img1 || null
        if (img && !/https?:/.test(data.img3)) img = 'http://d.musicapp.migu.cn' + img

        list.push({
          singer: formatSingerName(data.singerList),
          name: data.name,
          albumName: data.album,
          albumId: data.albumId,
          songmid: data.songId,
          copyrightId: data.copyrightId,
          source: 'mg',
          interval: formatPlayTime(data.duration),
          img,
          lrc: null,
          lrcUrl: data.lrcUrl,
          mrcUrl: data.mrcurl,
          trcUrl: data.trcUrl,
          types,
          _types,
          typeUrl: {},
        })
      })
    })
    return list
  },
  async search(str: string, page: number = 1, limit?: number, retryNum: number = 0): Promise<any> {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit
    // http://newlyric.kuwo.cn/newlyric.lrc?62355680
    return this.musicSearch(str, page, limit).then(async(result: any) => {
      // console.log(result)
      if (!result || result.code !== '000000') { return Promise.reject(new Error(result ? result.info : '搜索失败')) }
      const songResultData = result.songResultData || { resultList: [], totalCount: 0 }

      let list = this.filterData(songResultData.resultList)
      if (list == null) return this.search(str, page, limit, retryNum)

      this.total = parseInt(songResultData.totalCount)
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return {
        list,
        allPage: this.allPage,
        limit,
        total: this.total,
        source: 'mg',
      }
    })
  },
}
