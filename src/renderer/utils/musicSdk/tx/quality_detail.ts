import { httpFetch } from '../../request'
import { sizeFormate } from '../../index'

export const getBatchMusicQualityInfo = (songList: any[]) => {
  const songIds = songList.map((item: any) => item.id)

  const requestObj = httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
    method: 'post',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
    },
    body: {
      comm: {
        ct: '19',
        cv: '1859',
        uin: '0',
      },
      req: {
        module: 'music.trackInfo.UniformRuleCtrl',
        method: 'CgiGetTrackInfo',
        param: {
          types: Array(songIds.length).fill(1),
          ids: songIds,
          ctx: 0,
        },
      },
    },
  })

  const qualityInfoMap: Record<string, { types: Array<{ type: string, size: string }>, _types: Record<string, { size: string }> }> = {}

  requestObj.promise = requestObj.promise.then(async({ statusCode, body }: any) => {
    if (statusCode != 200 || body.code != 0) return Promise.reject(new Error('获取音质信息失败'))

    // Process each track from the response
    body.req.data.tracks.forEach((track: any) => {
      const file: any = track.file
      const songId: string = track.id

      const types: Array<{ type: string, size: string }> = []
      const _types: Record<string, { size: string }> = {}

      if (file.size_128mp3 != 0) {
        let size = sizeFormate(file.size_128mp3)
        types.push({ type: '128k', size })
        _types['128k'] = { size }
      }
      if (file.size_320mp3 !== 0) {
        let size = sizeFormate(file.size_320mp3)
        types.push({ type: '320k', size })
        _types['320k'] = { size }
      }
      if (file.size_flac !== 0) {
        let size = sizeFormate(file.size_flac)
        types.push({ type: 'flac', size })
        _types.flac = { size }
      }
      if (file.size_hires !== 0) {
        let size = sizeFormate(file.size_hires)
        types.push({ type: 'hires', size })
        _types.hires = { size }
      }
      if (file.size_new[1] !== 0) {
        let size = sizeFormate(file.size_new[1])
        types.push({ type: 'atmos', size })
        _types.atmos = { size }
      }
      if (file.size_new[2] !== 0) {
        let size = sizeFormate(file.size_new[2])
        types.push({ type: 'atmos_plus', size })
        _types.atmos_plus = { size }
      }
      if (file.size_new[0] !== 0) {
        let size = sizeFormate(file.size_new[0])
        types.push({ type: 'master', size })
        _types.master = { size }
      }

      qualityInfoMap[songId] = { types, _types }
    })

    return qualityInfoMap
  })

  return requestObj
}
