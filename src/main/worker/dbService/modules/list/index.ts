import { LIST_IDS } from '@common/constants'
import {
  deleteUserLists,
  inertUserLists,
  insertMusicInfoList,
  insertMusicInfoListAndRefreshOrder,
  moveMusicInfo,
  moveMusicInfoAndRefreshOrder,
  overwriteListData,
  overwriteMusicInfo,
  queryAllUserList,
  queryMusicInfoByListId,
  queryMusicInfoByListIdAndMusicInfoId,
  queryMusicInfoByMusicInfoId,
  removeMusicInfoByListId,
  removeMusicInfos,
  updateMusicInfoOrder,
  updateMusicInfos,
  updateUserLists as updateUserListsFromDB,
} from './dbHelper'

let userLists: LX.DBService.UserListInfo[]
let musicLists = new Map<string, LX.Music.MusicInfo[]>()

const toDBMusicInfo = (musicInfos: LX.Music.MusicInfo[], listId: string, offset: number = 0): LX.DBService.MusicInfo[] => {
  return musicInfos.map((info, index) => {
    return {
      ...info,
      listId,
      meta: JSON.stringify(info.meta),
      order: offset + index,
    }
  })
}

/**
 * 获取所有用户列表
 * @returns
 */
export const getAllUserList = (): LX.List.UserListInfo[] => {
  if (userLists == null) userLists = queryAllUserList()

  return userLists.map(list => {
    const { position, ...newList } = list
    return newList
  })
}

/**
 * 批量创建列表
 * @param position 列表位置
 * @param lists 列表信息
 */
export const createUserLists = (position: number, lists: LX.List.UserListInfo[]) => {
  if (userLists == null) userLists = queryAllUserList()
  if (position < 0 || position >= userLists.length) {
    const newLists: LX.DBService.UserListInfo[] = lists.map((list, index) => {
      return {
        ...list,
        position: position + index,
      }
    })
    inertUserLists(newLists)
    userLists = [...userLists, ...newLists]
  } else {
    const newUserLists = [...userLists]
    // @ts-expect-error
    newUserLists.splice(position, 0, ...lists)
    newUserLists.forEach((list, index) => {
      list.position = index
    })
    inertUserLists(newUserLists, true)
    userLists = newUserLists
  }
}

/**
 * 覆盖列表
 * @param lists 列表信息
 */
export const setUserLists = (lists: LX.List.UserListInfo[]) => {
  const newUserLists: LX.DBService.UserListInfo[] = lists.map((list, index) => {
    return {
      ...list,
      position: index,
    }
  })
  inertUserLists(newUserLists, true)
  userLists = newUserLists
}

/**
 * 批量删除列表
 * @param ids 列表ids
 */
export const removeUserLists = (ids: string[]) => {
  deleteUserLists(ids)
  if (userLists) userLists = queryAllUserList()
}

/**
 * 批量更新列表信息
 * @param lists 列表信息
 */
export const updateUserLists = (lists: LX.List.UserListInfo[]) => {
  const positionMap = new Map<string, number>()
  for (const list of userLists) {
    positionMap.set(list.id, list.position)
  }
  const dbList: LX.DBService.UserListInfo[] = lists.map(list => {
    const position = positionMap.get(list.id)
    if (position == null) return null
    return {
      ...list,
      position,
    }
  }).filter(Boolean) as LX.DBService.UserListInfo[]
  updateUserListsFromDB(dbList)
  if (userLists) userLists = queryAllUserList()
}

/**
 * 批量更新列表位置
 * @param position 列表位置
 * @param ids 列表ids
 */
export const updateUserListsPosition = (position: number, ids: string[]) => {
  if (userLists == null) userLists = queryAllUserList()

  const newUserLists = [...userLists]

  const updateLists: LX.DBService.UserListInfo[] = []

  for (let i = newUserLists.length - 1; i >= 0; i--) {
    if (ids.includes(newUserLists[i].id)) {
      const list = newUserLists.splice(i, 1)[0]
      list.locationUpdateTime = Date.now()
      updateLists.push(list)
    }
  }
  position = Math.min(newUserLists.length, position)

  newUserLists.splice(position, 0, ...updateLists)
  newUserLists.forEach((list, index) => {
    list.position = index
  })
  inertUserLists(newUserLists, true)
  userLists = newUserLists
}

/**
 * 根据列表ID获取列表内歌曲
 * @param listId 列表ID
 * @returns 列表内歌曲
 */
export const getListMusics = (listId: string): LX.Music.MusicInfo[] => {
  let targetList: LX.Music.MusicInfo[] | undefined = musicLists.get(listId)
  if (targetList == null) {
    targetList = queryMusicInfoByListId(listId).map(info => {
      return {
        id: info.id,
        name: info.name,
        singer: info.singer,
        source: info.source,
        interval: info.interval,
        meta: JSON.parse(info.meta),
      }
    })
    musicLists.set(listId, targetList)
  }

  return targetList
}

/**
 * 覆盖列表内的歌曲
 * @param listId 列表id
 * @param musicInfos 歌曲列表
 */
export const musicOverwrite = (listId: string, musicInfos: LX.Music.MusicInfo[]) => {
  let targetList = getListMusics(listId)
  overwriteMusicInfo(listId, toDBMusicInfo(musicInfos, listId))
  if (targetList) targetList.splice(0, targetList.length, ...musicInfos)
}

/**
 * 批量添加歌曲
 * @param listId 列表id
 * @param musicInfos 添加的歌曲信息
 * @param addMusicLocationType 添加在到列表的位置
 */
export const musicsAdd = (listId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType) => {
  let targetList = getListMusics(listId)

  const set = new Set<string>()
  for (const item of targetList) set.add(item.id)
  musicInfos = musicInfos.filter(item => {
    if (set.has(item.id)) return false
    set.add(item.id)
    return true
  })

  switch (addMusicLocationType) {
    case 'top':
      insertMusicInfoListAndRefreshOrder(toDBMusicInfo(musicInfos, listId), listId, toDBMusicInfo(targetList, listId, musicInfos.length))
      targetList.unshift(...musicInfos)
      break
    case 'bottom':
    default:
      insertMusicInfoList(toDBMusicInfo(musicInfos, listId, targetList.length))
      targetList.push(...musicInfos)
      break
  }
}

/**
 * 批量删除歌曲
 * @param listId 列表Id
 * @param ids 要删除歌曲的id
 */
export const musicsRemove = (listId: string, ids: string[]) => {
  let targetList = getListMusics(listId)
  if (!targetList.length) return
  ids = [...ids]
  removeMusicInfos(listId, ids)
  for (let i = targetList.length - 1; i > -1; i--) {
    const item = targetList[i]
    const index = ids.indexOf(item.id)
    if (index < 0) continue
    ids.splice(index, 1)
    targetList.splice(i, 1)
  }
}

/**
 * 批量移动歌曲
 * @param fromId 源列表id
 * @param toId 目标列表id
 * @param musicInfos 添加的歌曲信息
 * @param addMusicLocationType 添加在到列表的位置
 */
export const musicsMove = (fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType) => {
  const ids = musicInfos.map(musicInfo => musicInfo.id)
  let toList = getListMusics(toId)
  switch (addMusicLocationType) {
    case 'top':
      moveMusicInfoAndRefreshOrder(fromId, ids, toId, toDBMusicInfo(musicInfos, toId), toDBMusicInfo(toList, toId, musicInfos.length))
      break
    case 'bottom':
    default:
      moveMusicInfo(fromId, ids, toDBMusicInfo(musicInfos, toId, toList.length))
      break
  }
  musicsRemove(fromId, ids)
  musicsAdd(toId, musicInfos, addMusicLocationType)
  // let fromList = getListMusics(fromId)
  // let toList = getListMusics(toId)

  // const ids = musicInfos.map(musicInfo => musicInfo.id)

  // const map = new Map<string, LX.Music.MusicInfo>()
  // for (const item of toList) map.set(item.id, item)
  // musicInfos = musicInfos.filter(item => {
  //   if (map.has(item.id)) return false
  //   map.set(item.id, item)
  //   return true
  // })

  // switch (addMusicLocationType) {
  //   case 'top':
  //     moveMusicInfoAndRefreshOrder(fromId, ids, toId, toDBMusicInfo(musicInfos, toId), toDBMusicInfo(toList, toId, musicInfos.length))
  //     toList.unshift(...musicInfos)
  //     break
  //   case 'bottom':
  //   default:
  //     moveMusicInfo(fromId, ids, toDBMusicInfo(musicInfos, toId, toList.length))
  //     toList.push(...musicInfos)
  //     break
  // }
  // for (let i = fromList.length - 1; i > -1; i--) {
  //   const item = fromList[i]
  //   const index = ids.indexOf(item.id)
  //   if (index < 0) continue
  //   ids.splice(index, 1)
  //   fromList.splice(i, 1)
  // }
}

/**
 * 批量更新歌曲信息
 * @param musicInfos 歌曲&列表信息
 */
export const musicsUpdate = (musicInfos: LX.List.ListActionMusicUpdate) => {
  updateMusicInfos(musicInfos.map(({ id, musicInfo }) => {
    return {
      ...musicInfo,
      listId: id,
      meta: JSON.stringify(musicInfo.meta),
      order: 0,
    }
  }))
  for (const { id, musicInfo } of musicInfos) {
    const targetList = musicLists.get(id)
    if (targetList == null) continue
    const targetMusic = targetList.find(item => item.id == musicInfo.id)
    if (!targetMusic) continue
    targetMusic.name = musicInfo.name
    targetMusic.singer = musicInfo.singer
    targetMusic.source = musicInfo.source
    targetMusic.interval = musicInfo.interval
    targetMusic.meta = musicInfo.meta
  }
}

/**
 * 清空列表内的歌曲
 * @param listId 列表Id
 */
export const musicsClear = (listId: string) => {
  removeMusicInfoByListId(listId)
  const targetList = getListMusics(listId)
  if (targetList == null) return
  targetList.slice(0, targetList.length)
}

/**
 * 批量更新歌曲位置
 * @param listId 列表id
 * @param position 新位置
 * @param ids 要更新位置的歌曲id
 */
export const musicsPositionUpdate = (listId: string, position: number, ids: string[]) => {
  let targetList = getListMusics(listId)
  if (!targetList.length) return

  const newTargetList = [...targetList]
  const infos = Array(ids.length)
  for (let i = newTargetList.length; i--;) {
    const item = newTargetList[i]
    const index = ids.indexOf(item.id)
    if (index < 0) continue
    infos.splice(index, 1, newTargetList.splice(i, 1)[0])
  }
  newTargetList.splice(Math.min(position, newTargetList.length), 0, ...infos)

  updateMusicInfoOrder(listId, newTargetList.map((info, index) => {
    return {
      listId,
      musicInfoId: info.id,
      order: index,
    }
  }))
  musicLists.set(listId, newTargetList)
}

/**
 * 覆盖所有列表数据
 * @param myListData 完整列表数据
 */
export const listDataOverwrite = (myListData: MakeOptional<LX.List.ListDataFull, 'tempList'>) => {
  const dbLists: LX.DBService.UserListInfo[] = []
  const listData: LX.List.ListDataFull = {
    ...myListData,
    tempList: myListData.tempList ?? getListMusics(LIST_IDS.TEMP),
  }

  const dbMusicInfos: LX.DBService.MusicInfo[] = [
    ...toDBMusicInfo(listData.defaultList, LIST_IDS.DEFAULT),
    ...toDBMusicInfo(listData.loveList, LIST_IDS.LOVE),
    ...toDBMusicInfo(listData.tempList, LIST_IDS.TEMP),
  ]
  listData.userList.forEach(({ list, ...listInfo }, index) => {
    dbLists.push({ ...listInfo, position: index })
    dbMusicInfos.push(...toDBMusicInfo(list, listInfo.id))
  })
  overwriteListData(dbLists, dbMusicInfos)

  if (userLists) userLists.splice(0, userLists.length, ...dbLists)
  else userLists = dbLists

  musicLists.clear()
  musicLists.set(LIST_IDS.DEFAULT, listData.defaultList)
  musicLists.set(LIST_IDS.LOVE, listData.loveList)
  musicLists.set(LIST_IDS.TEMP, listData.tempList)
  for (const list of listData.userList) musicLists.set(list.id, list.list)
}

/**
 * 检查音乐是否存在列表中
 * @param listId 列表id
 * @param musicInfoId 音乐id
 * @returns
 */
export const checkListExistMusic = (listId: string, musicInfoId: string): boolean => {
  const musicInfo = queryMusicInfoByListIdAndMusicInfoId(listId, musicInfoId)
  return musicInfo != null
}

/**
 * 获取所有存在该音乐的列表id
 * @param musicInfoId 音乐id
 * @returns
 */
export const getMusicExistListIds = (musicInfoId: string): string[] => {
  const musicInfos = queryMusicInfoByMusicInfoId(musicInfoId)
  return musicInfos.map(m => m.listId)
}
