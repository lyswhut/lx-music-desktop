/* eslint-disable @typescript-eslint/no-dynamic-delete */
import {
  saveListPositionInfo as saveListPositionInfoFromData,
  getListPositionInfo as getListPositionInfoFromData,
  saveListPrevSelectId as saveListPrevSelectIdFromData,
  getListPrevSelectId as getListPrevSelectIdFromData,
  saveListUpdateInfo as saveListUpdateInfoFromData,
  getListUpdateInfo as getListUpdateInfoFromData,
  saveSearchSetting as saveSearchSettingFromData,
  getSearchSetting as getSearchSettingFromData,
  saveSongListSetting as saveSongListSettingFromData,
  getSongListSetting as getSongListSettingFromData,
  saveLeaderboardSetting as saveLeaderboardSettingFromData,
  getLeaderboardSetting as getLeaderboardSettingFromData,
  saveViewPrevState as saveViewPrevStateFromData,
} from '@renderer/utils/ipc'
import { throttle } from '@common/utils'
import { DEFAULT_SETTING, LIST_IDS } from '@common/constants'
import { dateFormat } from './index'
import { setUpdateTime } from '@renderer/store/list/action'

let listPosition: LX.List.ListPositionInfo
let listPrevSelectId: string
let listUpdateInfo: LX.List.ListUpdateInfo

let searchSetting: typeof DEFAULT_SETTING['search']
let songListSetting: typeof DEFAULT_SETTING['songList']
let leaderboardSetting: typeof DEFAULT_SETTING['leaderboard']

const saveListPositionThrottle = throttle(() => {
  saveListPositionInfoFromData(listPosition)
}, 1000)
const saveSearchSettingThrottle = throttle(() => {
  saveSearchSettingFromData(searchSetting)
}, 1000)
const saveSongListSettingThrottle = throttle(() => {
  saveSongListSettingFromData(songListSetting)
}, 1000)
const saveLeaderboardSettingThrottle = throttle(() => {
  saveLeaderboardSettingFromData(leaderboardSetting)
}, 1000)
const saveViewPrevStateThrottle = throttle((state) => {
  saveViewPrevStateFromData(state)
}, 1000)


export const getListPosition = async(id: string): Promise<number> => {
  if (listPosition == null) listPosition = await getListPositionInfoFromData() ?? {}
  return listPosition[id] ?? 0
}
export const setListPosition = async(id: string, position?: number) => {
  if (listPosition == null) await getListPosition(id)
  listPosition[id] = position ?? 0
  saveListPositionThrottle()
}
export const removeListPosition = (id: string) => {
  delete listPosition[id]
  saveListPositionThrottle()
}
export const overwriteListPosition = (ids: string[]) => {
  const removedIds = []
  for (const id of Object.keys(listPosition)) {
    if (ids.includes(id)) continue
    removedIds.push(id)
  }
  for (const id of removedIds) delete listPosition[id]
  saveListPositionThrottle()
}

const saveListPrevSelectIdThrottle = throttle(() => {
  saveListPrevSelectIdFromData(listPrevSelectId)
}, 200)
export const getListPrevSelectId = async() => {
  if (listPrevSelectId == null) listPrevSelectId = await getListPrevSelectIdFromData() ?? LIST_IDS.DEFAULT
  return listPrevSelectId ?? LIST_IDS.DEFAULT
}
export const saveListPrevSelectId = (id: string) => {
  listPrevSelectId = id
  saveListPrevSelectIdThrottle()
}

const saveListUpdateInfo = throttle(() => {
  saveListUpdateInfoFromData(listUpdateInfo)
}, 1000)

export const getListUpdateInfo = async() => {
  if (listUpdateInfo == null) {
    listUpdateInfo = await getListUpdateInfoFromData() ?? {}
    for (const [id, info] of Object.entries(listUpdateInfo)) {
      setUpdateTime(id, info.updateTime ? dateFormat(info.updateTime) : '')
    }
  }
  return listUpdateInfo
}
export const setListUpdateInfo = async(info: LX.List.ListUpdateInfo) => {
  if (listUpdateInfo == null) await getListUpdateInfo()
  listUpdateInfo = info
  saveListUpdateInfo()
}
export const setListAutoUpdate = async(id: string, enable: boolean) => {
  if (listUpdateInfo == null) await getListUpdateInfo()
  const targetInfo = listUpdateInfo[id] ?? { updateTime: 0, isAutoUpdate: false }
  targetInfo.isAutoUpdate = enable
  listUpdateInfo[id] = targetInfo
  saveListUpdateInfo()
}
export const setListUpdateTime = async(id: string, time: number) => {
  if (listUpdateInfo == null) await getListUpdateInfo()
  const targetInfo = listUpdateInfo[id] ?? { updateTime: 0, isAutoUpdate: false }
  targetInfo.updateTime = time
  listUpdateInfo[id] = targetInfo
  saveListUpdateInfo()
}
// export const setListUpdateInfo = (id, { updateTime, isAutoUpdate }) => {
//   listUpdateInfo[id] = { updateTime, isAutoUpdate }
//   saveListUpdateInfo()
// }
export const removeListUpdateInfo = (id: string) => {
  delete listUpdateInfo[id]
  saveListUpdateInfo()
}
export const overwriteListUpdateInfo = (ids: string[]) => {
  const removedIds = []
  for (const id of Object.keys(listPosition)) {
    if (ids.includes(id)) continue
    removedIds.push(id)
  }
  for (const id of removedIds) delete listUpdateInfo[id]
  saveListUpdateInfo()
}


export const getSearchSetting = async() => {
  if (!searchSetting) searchSetting = await getSearchSettingFromData()
  return { ...searchSetting }
}
export const setSearchSetting = async(setting: Partial<typeof DEFAULT_SETTING['search']>) => {
  if (!searchSetting) await getSearchSetting()
  let requiredSave = false
  if (setting.source && searchSetting.source != setting.source) requiredSave = true
  if (setting.type && searchSetting.type != setting.type) requiredSave = true
  if (setting.temp_source && searchSetting.temp_source != setting.temp_source) requiredSave = true

  if (!requiredSave) return
  searchSetting = Object.assign(searchSetting, setting)
  saveSearchSettingThrottle()
}

export const getSongListSetting = async() => {
  if (!songListSetting) songListSetting = await getSongListSettingFromData()
  return { ...songListSetting }
}
export const setSongListSetting = async(setting: Partial<typeof DEFAULT_SETTING['songList']>) => {
  if (!songListSetting) await getSongListSetting()
  songListSetting = Object.assign(songListSetting, setting)
  saveSongListSettingThrottle()
}

export const getLeaderboardSetting = async() => {
  if (!leaderboardSetting) leaderboardSetting = await getLeaderboardSettingFromData()
  return { ...leaderboardSetting }
}
export const setLeaderboardSetting = async(setting: Partial<typeof DEFAULT_SETTING['leaderboard']>) => {
  if (!leaderboardSetting) await getLeaderboardSetting()
  leaderboardSetting = Object.assign(leaderboardSetting, setting)
  saveLeaderboardSettingThrottle()
}

export const saveViewPrevState = (state: typeof DEFAULT_SETTING['viewPrevState']) => {
  saveViewPrevStateThrottle(state)
}
