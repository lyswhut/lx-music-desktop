// import { throttle } from '@common/utils'

import { filterFileName, sortInsert, similar, arrPushByPosition } from '@common/utils/common'
import { joinPath, saveStrToFile } from '@common/utils/nodejs'
import { createLocalMusicInfo } from '@renderer/utils/music'


/**
 * 过滤列表中已播放的歌曲
 */
export const filterMusicList = async({ playedList, listId, list, savePath, playerMusicInfo }: {
  /**
   * 已播放列表
   */
  playedList: LX.Player.PlayMusicInfo[]
  /**
   * 列表id
   */
  listId: string
  /**
   * 播放列表
   */
  list: Array<LX.Music.MusicInfo | LX.Download.ListItem>
  /**
   * 下载目录
   */
  savePath: string
  /**
   * 播放器内当前歌曲（`playInfo.playerPlayIndex`指向的歌曲）
   */
  playerMusicInfo?: LX.Music.MusicInfo | LX.Download.ListItem
}) => {
  let playerIndex = -1

  let canPlayList: Array<LX.Music.MusicInfo | LX.Download.ListItem> = []
  const filteredPlayedList = playedList.filter(pmInfo => pmInfo.listId == listId && !pmInfo.isTempPlay).map(({ musicInfo }) => musicInfo)

  const filteredList: Array<LX.Music.MusicInfo | LX.Download.ListItem> = list.filter(s => {
    // if (!assertApiSupport(s.source)) return false
    if ('progress' in s && !s.isComplate) return false

    canPlayList.push(s)

    let index = filteredPlayedList.findIndex(m => m.id == s.id)
    if (index > -1) {
      filteredPlayedList.splice(index, 1)
      return false
    }
    return true
  })
  if (playerMusicInfo) {
    playerIndex = (filteredList.length ? filteredList : canPlayList).findIndex(m => m.id == playerMusicInfo.id)
  }
  return {
    filteredList,
    canPlayList,
    playerIndex,
  }
}

const getIntv = (musicInfo: LX.Music.MusicInfo) => {
  if (!musicInfo.interval) return 0
  // if (musicInfo._interval) return musicInfo._interval
  let intvArr = musicInfo.interval.split(':')
  let intv = 0
  let unit = 1
  while (intvArr.length) {
    intv += parseInt(intvArr.pop() as string) * unit
    unit *= 60
  }
  return intv
}

/**
 * 排序歌曲
 * @param list 歌曲列表
 * @param sortType 排序类型
 * @param fieldName 排序字段
 * @param localeId 排序语言
 * @returns
 */
export const sortListMusicInfo = async(list: LX.Music.MusicInfo[], sortType: 'up' | 'down', fieldName: 'name' | 'singer' | 'albumName' | 'interval' | 'source', localeId: string) => {
  // console.log(sortType, fieldName, localeId)
  // const locale = new Intl.Locale(localeId)
  if (sortType == 'up') {
    if (fieldName == 'interval') {
      list.sort((a, b) => {
        if (a.interval == null) {
          return b.interval == null ? 0 : -1
        } else return b.interval == null ? 1 : getIntv(a) - getIntv(b)
      })
    } else {
      switch (fieldName) {
        case 'name':
        case 'singer':
        case 'source':
          list.sort((a, b) => {
            if (a[fieldName] == null) {
              return b[fieldName] == null ? 0 : -1
            } else return b[fieldName] == null ? 1 : a[fieldName].localeCompare(b[fieldName], localeId)
          })
          break
        case 'albumName':
          list.sort((a, b) => {
            if (a.meta.albumName == null) {
              return b.meta.albumName == null ? 0 : -1
            } else return b.meta.albumName == null ? 1 : a.meta.albumName.localeCompare(b.meta.albumName, localeId)
          })
          break
      }
    }
  } else {
    if (fieldName == 'interval') {
      list.sort((a, b) => {
        if (a.interval == null) {
          return b.interval == null ? 0 : 1
        } else return b.interval == null ? -1 : getIntv(b) - getIntv(a)
      })
    } else {
      switch (fieldName) {
        case 'name':
        case 'singer':
        case 'source':
          list.sort((a, b) => {
            if (a[fieldName] == null) {
              return b[fieldName] == null ? 0 : 1
            } else return b[fieldName] == null ? -1 : b[fieldName].localeCompare(a[fieldName], localeId)
          })
          break
        case 'albumName':
          list.sort((a, b) => {
            if (a.meta.albumName == null) {
              return b.meta.albumName == null ? 0 : 1
            } else return b.meta.albumName == null ? -1 : b.meta.albumName.localeCompare(a.meta.albumName, localeId)
          })
          break
      }
    }
  }
  return list
}

const variantRxp = /(\(|（).+(\)|）)/g
const variantRxp2 = /\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[/g
/**
 * 过滤列表内重复的歌曲
 * @param list 歌曲列表
 * @param isFilterVariant 是否过滤 Live Explicit 等歌曲名
 * @returns
 */
export const filterDuplicateMusic = async(list: LX.Music.MusicInfo[], isFilterVariant: boolean = true) => {
  type ListMapValue = Array<{ id: string, index: number, musicInfo: LX.Music.MusicInfo }>
  const listMap = new Map<string, ListMapValue>()
  const duplicateList = new Set<string>()
  const handleFilter = (name: string, index: number, musicInfo: LX.Music.MusicInfo) => {
    if (listMap.has(name)) {
      const targetMusicInfo = listMap.get(name)
      targetMusicInfo!.push({
        id: musicInfo.id,
        index,
        musicInfo,
      })
      duplicateList.add(name)
    } else {
      listMap.set(name, [{
        id: musicInfo.id,
        index,
        musicInfo,
      }])
    }
  }
  if (isFilterVariant) {
    list.forEach((musicInfo, index) => {
      let musicInfoName = musicInfo.name.toLowerCase().replace(variantRxp, '').replace(variantRxp2, '')
      musicInfoName ||= musicInfo.name.toLowerCase().replace(/\s+/g, '')
      handleFilter(musicInfoName, index, musicInfo)
    })
  } else {
    list.forEach((musicInfo, index) => {
      const musicInfoName = musicInfo.name.toLowerCase().trim()
      handleFilter(musicInfoName, index, musicInfo)
    })
  }
  // console.log(duplicateList)
  const duplicateNames = Array.from(duplicateList)
  duplicateNames.sort((a, b) => a.localeCompare(b))
  return duplicateNames.map(name => listMap.get(name) as ListMapValue).flat()
}

export const searchListMusic = (list: LX.Music.MusicInfo[], text: string) => {
  let result: LX.Music.MusicInfo[] = []
  let rxp = new RegExp(text.split('').map(s => s.replace(/[.*+?^${}()|[\]\\]/, '\\$&')).join('.*') + '.*', 'i')
  for (const mInfo of list) {
    const str = `${mInfo.name}${mInfo.singer}${mInfo.meta.albumName ? mInfo.meta.albumName : ''}`
    if (rxp.test(str)) result.push(mInfo)
  }

  const sortedList: Array<{ num: number, data: LX.Music.MusicInfo }> = []

  for (const mInfo of result) {
    sortInsert(sortedList, {
      num: similar(text, `${mInfo.name}${mInfo.singer}${mInfo.meta.albumName ? mInfo.meta.albumName : ''}`),
      data: mInfo,
    })
  }
  return sortedList.map(item => item.data).reverse()
}

/**
 * 创建排序后的列表
 * @param list 原始列表
 * @param position 新位置
 * @param ids 要调整顺序的歌曲id
 * @returns
 */
export const createSortedList = (list: LX.Music.MusicInfo[], position: number, ids: string[]) => {
  const infos: LX.Music.MusicInfo[] = []
  const map = new Map<string, LX.Music.MusicInfo>()
  for (const item of list) map.set(item.id, item)
  for (const id of ids) {
    infos.push(map.get(id) as LX.Music.MusicInfo)
    map.delete(id)
  }
  list = list.filter(mInfo => map.has(mInfo.id))
  arrPushByPosition(list, infos, Math.min(position, list.length))
  return list
}


/**
 * 创建本地列表音乐信息
 * @param filePaths 文件路径
 */
export const createLocalMusicInfos = async(filePaths: string[]): Promise<LX.Music.MusicInfoLocal[]> => {
  const list: LX.Music.MusicInfoLocal[] = []
  for await (const path of filePaths) {
    const musicInfo = await createLocalMusicInfo(path)
    if (!musicInfo) continue
    list.push(musicInfo)
  }

  return list
}

/**
 * 导出列表到txt文件
 * @param savePath 保存路径
 * @param lists 列表数据
 * @param isMerge 是否合并
 */
export const exportPlayListToText = async(savePath: string, lists: Array<LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull | LX.List.UserListInfoFull>, isMerge: boolean) => {
  const iconv = await import('iconv-lite')

  if (isMerge) {
    await saveStrToFile(savePath,
      iconv.encode(lists.map(l => l.list.map(m => `${m.name}  ${m.singer}  ${m.meta.albumName ?? ''}`).join('\n')).join('\n\n'), 'utf8', { addBOM: true }))
  } else {
    for await (const list of lists) {
      await saveStrToFile(joinPath(savePath, `lx_list_${filterFileName(list.name)}.txt`),
        iconv.encode(list.list.map(m => `${m.name}  ${m.singer}  ${m.meta.albumName ?? ''}`).join('\n'), 'utf8', { addBOM: true }))
    }
  }
}

/**
 * 导出列表到csv文件
 * @param savePath 保存路径
 * @param lists 列表数据
 * @param isMerge 是否合并
 * @param header 表头名称
 */
export const exportPlayListToCSV = async(savePath: string,
  lists: Array<LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull | LX.List.UserListInfoFull>,
  isMerge: boolean,
  header: string) => {
  const iconv = await import('iconv-lite')

  const filterStr = (str: string) => {
    if (!str) return ''
    str = str.replace(/"/g, '""')
    if (str.includes(',')) str = `"${str}"`
    return str
  }

  if (isMerge) {
    await saveStrToFile(savePath, iconv.encode(header + lists.map(l => l.list.map(m => `${filterStr(m.name)},${filterStr(m.singer)},${filterStr(m.meta.albumName ?? '')}`).join('\n')).join('\n'), 'utf8', { addBOM: true }))
  } else {
    for await (const list of lists) {
      await saveStrToFile(joinPath(savePath, `lx_list_${filterFileName(list.name)}.csv`), iconv.encode(header + list.list.map(m => `${filterStr(m.name)},${filterStr(m.singer)},${filterStr(m.meta.albumName ?? '')}`).join('\n'), 'utf8', { addBOM: true }))
    }
  }
}
