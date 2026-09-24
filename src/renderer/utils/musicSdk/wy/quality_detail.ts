import { httpFetch } from '../../request'
import { dnsLookup } from '../utils'
import { headers, timeout } from '../options'
import { sizeFormate } from '../../index'

interface QualityType {
  type: string
  size: string
}

type QualityTypes = Record<string, { size: string }>

export const getMusicQualityInfo = (id: string | number): { requestObj: any, types: QualityType[], _types: QualityTypes } => {
  const requestObj: any = httpFetch(`https://music.163.com/api/song/music/detail/get?songId=${id}`, {
    method: 'get',
    timeout,
    headers,
    lookup: dnsLookup,
    family: 4,
  })

  const types: QualityType[] = []
  const _types: QualityTypes = {}

  requestObj.promise = requestObj.promise.then(async({ statusCode, body }: { statusCode: number, body: any }) => {
    if (statusCode != 200 && body.code != 200) return Promise.reject(new Error('获取音质信息失败'))

    const data = body.data

    types.length = 0
    Object.keys(_types).forEach((key) => Reflect.deleteProperty(_types, key))

    if (data.l?.size != null) {
      let size = sizeFormate(data.l.size)
      types.push({ type: '128k', size })
      _types['128k'] = { size }
    } else if (data.m?.size != null) {
      let size = sizeFormate(data.m.size)
      types.push({ type: '128k', size })
      _types['128k'] = { size }
    }

    if (data.h?.size != null) {
      let size = sizeFormate(data.h.size)
      types.push({ type: '320k', size })
      _types['320k'] = { size }
    }

    if (data.sq?.size != null) {
      let size = sizeFormate(data.sq.size)
      types.push({ type: 'flac', size })
      _types.flac = { size }
    }

    if (data.hr?.size != null) {
      let size = sizeFormate(data.hr.size)
      types.push({ type: 'hires', size })
      _types.hires = { size }
    }

    if (data.jm?.size != null) {
      let size = sizeFormate(data.jm.size)
      types.push({ type: 'master', size })
      _types.master = { size }
    }

    if (data.je?.size != null) {
      let size = sizeFormate(data.je.size)
      types.push({ type: 'atmos', size })
      _types.atmos = { size }
    }

    return { types: [...types], _types: { ..._types } }
  })

  return { requestObj, types, _types }
}

export const getBatchMusicQualityInfo = async(idList: Array<string | number>): Promise<Record<string, { types: QualityType[], _types: QualityTypes }>> => {
  const ids = idList.filter((id) => id)

  const qualityPromises = ids.map((id) => {
    const result = getMusicQualityInfo(id)
    return result.requestObj.promise.catch((err: any) => {
      console.error(`获取歌曲 ${id} 音质信息失败:`, err)
      return { types: [], _types: {} }
    })
  })

  const qualityResults = await Promise.all(qualityPromises)

  const qualityInfoMap: Record<string, { types: QualityType[], _types: QualityTypes }> = {}
  ids.forEach((id, index) => {
    qualityInfoMap[id as string] = qualityResults[index] || { types: [], _types: {} }
  })

  return qualityInfoMap
}
