import { createHttpFetch } from './util'
import { filterData } from './quality_detail'

const createGetMusicInfosTask = (hashs: any[]): Array<Promise<any>> => {
  let data = {
    area_code: '1',
    show_privilege: 1,
    show_album_info: '1',
    is_publish: '',
    appid: 1005,
    clientver: 11451,
    mid: '1',
    dfid: '-',
    clienttime: Date.now(),
    key: 'OIlwieks28dk2k092lksi2UIkp',
    fields: 'album_info,author_name,audio_info,ori_audio_name,base,songname,classification',
  }
  let list = hashs
  let tasks: any[] = []
  while (list.length) {
    tasks.push(Object.assign({ data: list.slice(0, 100) }, data))
    if (list.length < 100) break
    list = list.slice(100)
  }
  let url = 'http://gateway.kugou.com/v3/album_audio/audio'
  return tasks.map(async(task: any) =>
    createHttpFetch(url, {
      method: 'POST',
      body: task,
      headers: {
        'KG-THash': '13a3164',
        'KG-RC': '1',
        'KG-Fake': '0',
        'KG-RF': '00869891',
        'User-Agent': 'Android712-AndroidPhone-11451-376-0-FeeCacheUpdate-wifi',
        'x-router': 'kmr.service.kugou.com',
      },
    }).then((data: any[]) => data.map((s: any[]) => s[0])),
  )
}

export const filterMusicInfoList = async(rawList: any[]): Promise<any[]> => {
  return await filterData(rawList, { removeDuplicates: true })
}

export const getMusicInfos = async(hashs: any[]): Promise<any[]> => {
  return await filterMusicInfoList(
    await Promise.all(createGetMusicInfosTask(hashs)).then((data: any[][]) => data.flat()),
  )
}

export const getMusicInfoRaw = async(hash: string): Promise<any> => {
  return Promise.all(createGetMusicInfosTask([{ hash }])).then((data: any[][]) => data.flat()[0])
}

export const getMusicInfo = async(hash: string): Promise<any> => {
  return getMusicInfos([{ hash }]).then((data: any[]) => data[0])
}

export const getMusicInfosByList = async(list: any[]): Promise<any[]> => {
  return getMusicInfos(list.map((item: any) => ({ hash: item.hash })))
}
