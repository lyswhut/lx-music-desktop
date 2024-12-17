import { arrPush, arrUnshift } from '@common/utils/common'
import {
  queryDownloadList,
  insertDownloadList,
  updateDownloadList,
  deleteDownloadList,
  clearDownloadList,
} from './dbHelper'

let list: LX.Download.ListItem[]

const toDBDownloadInfo = (musicInfos: LX.Download.ListItem[], offset: number = 0): LX.DBService.DownloadMusicInfo[] => {
  return musicInfos.map((info, index) => {
    return {
      id: info.id,
      isComplate: info.isComplate ? 1 : 0,
      status: info.status,
      statusText: info.statusText,
      progress_downloaded: info.downloaded,
      progress_total: info.total,
      url: info.metadata.url,
      quality: info.metadata.quality,
      ext: info.metadata.ext,
      fileName: info.metadata.fileName,
      filePath: info.metadata.filePath,
      musicInfo: JSON.stringify(info.metadata.musicInfo),
      position: offset + index,
    }
  })
}

const initDownloadList = () => {
  list = queryDownloadList().map(item => {
    const musicInfo = JSON.parse(item.musicInfo) as LX.Music.MusicInfoOnline
    return {
      id: item.id,
      isComplate: item.isComplate == 1,
      status: item.status,
      statusText: item.statusText,
      downloaded: item.progress_downloaded,
      total: item.progress_total,
      progress: item.progress_total ? parseInt((item.progress_downloaded / item.progress_total).toFixed(2)) * 100 : 0,
      speed: '',
      writeQueue: 0,
      metadata: {
        musicInfo,
        url: item.url,
        quality: item.quality,
        ext: item.ext,
        fileName: item.fileName,
        filePath: item.filePath,
      },
    }
  })
}

/**
 * 获取下载列表
 * @returns 下载列表
 */
export const getDownloadList = (): LX.Download.ListItem[] => {
  if (!list) initDownloadList()
  return list
}

/**
 * 添加下载歌曲信息
 * @param downloadInfos url信息
 */
export const downloadInfoSave = (downloadInfos: LX.Download.ListItem[], addMusicLocationType: LX.AddMusicLocationType) => {
  if (!list) initDownloadList()
  if (addMusicLocationType == 'top') {
    let newList = [...list]
    arrUnshift(newList, downloadInfos)
    insertDownloadList(toDBDownloadInfo(downloadInfos), newList.slice(downloadInfos.length - 1).map((info, index) => {
      return { id: info.id, position: index }
    }))
    list = newList
  } else {
    insertDownloadList(toDBDownloadInfo(downloadInfos, list.length), [])
    arrPush(list, downloadInfos)
  }
}

/**
 * 批量更新列表信息
 * @param lists 列表信息
 */
export const downloadInfoUpdate = (lists: LX.Download.ListItem[]) => {
  updateDownloadList(toDBDownloadInfo(lists))
  if (list) {
    for (const item of lists) {
      const index = list.findIndex(info => info.id === item.id)
      if (index < 0) continue
      list.splice(index, 1, item)
    }
  }
}


/**
 * 删除下载列表
 * @param ids 歌曲id
 */
export const downloadInfoRemove = (ids: string[]) => {
  deleteDownloadList(ids)
  if (list) {
    const idSet = new Set<string>(ids)
    list = list.filter(task => !idSet.has(task.id))
  }
}

/**
 * 清空下载列表
 */
export const downloadInfoClear = () => {
  clearDownloadList()
}

