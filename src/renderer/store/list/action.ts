// import {  } from '@renderer/utils/ipc'

import { appSetting } from '@renderer/store/setting'
import { fetchingListStatus, listUpdateTimes, allMusicList, userLists, tempListMeta } from './state'
import {
  registerListAction,
  createUserList as createUserListAction,
  addListMusics as addListMusicsAction,
  moveListMusics as moveListMusicsAction,
  overwriteListMusics,
} from '@renderer/store/list/listManage'
import { toRaw } from '@common/utils/vueTools'
import { LIST_IDS } from '@common/constants'

export const registerAction = (onListChanged: (listIds: string[]) => void) => {
  return registerListAction(appSetting, onListChanged)
}

/**
 * 从缓存获取列表内歌曲，前提是知道列表之前已被获取过，否则返回空数组
 * @param listId 列表ID
 * @returns
 */
export const getListMusicsFromCache = (listId: string | null): LX.Music.MusicInfo[] => {
  if (!listId) return []
  if (allMusicList.has(listId)) return allMusicList.get(listId) as LX.Music.MusicInfo[]
  return []
}

export const setFetchingListStatus = (id: string, status: boolean) => {
  fetchingListStatus[id] = status
}

export const setUpdateTime = (id: string, time: string) => {
  listUpdateTimes[id] = time
}

export const addListMusics = async(id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType?: LX.AddMusicLocationType) => {
  return addListMusicsAction({
    id,
    musicInfos: toRaw(musicInfos),
    addMusicLocationType: addMusicLocationType ?? appSetting['list.addMusicLocationType'],
  })
}

export const moveListMusics = async(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType?: LX.AddMusicLocationType) => {
  return moveListMusicsAction({
    fromId,
    toId,
    musicInfos: toRaw(musicInfos),
    addMusicLocationType: addMusicLocationType ?? appSetting['list.addMusicLocationType'],
  })
}

export const createUserList = async({ name, id = `userlist_${Date.now()}`, list = [], source, sourceListId, position = -1 }: {
  name?: string
  id?: string
  list?: LX.Music.MusicInfo[]
  source?: LX.OnlineSource
  sourceListId?: string
  position?: number
}) => {
  await createUserListAction({
    position: position < 0 ? userLists.length : position,
    listInfos: [
      {
        id,
        name: name ?? 'list',
        source,
        sourceListId,
        locationUpdateTime: position < 0 ? null : Date.now(),
      },
    ],
  })
  if (list) await addListMusics(id, list)
}


export const setTempList = async(id: string, list: LX.Music.MusicInfoOnline[]) => {
  tempListMeta.id = id
  await overwriteListMusics({
    listId: LIST_IDS.TEMP,
    musicInfos: list,
  })
}

export {
  addListMusicsAction,
  moveListMusicsAction,
}

export {
  getUserLists,
  removeUserList,
  updateUserList,
  updateUserListPosition,
  getListMusics,
  removeListMusics,
  updateListMusics,
  updateListMusicsPosition,
  overwriteListMusics,
  clearListMusics,
  overwriteListFull,
  checkListExistMusic,
  getMusicExistListIds,
} from '@renderer/store/list/listManage'
