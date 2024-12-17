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
import { type DEFAULT_SETTING, LIST_IDS } from '@common/constants'
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

const initPosition = async() => {
  // eslint-disable-next-line require-atomic-updates
  listPosition ??= await getListPositionInfoFromData() ?? {}
}
export const getListPosition = async(id: string): Promise<number> => {
  await initPosition()
  return listPosition[id] ?? 0
}
export const setListPosition = async(id: string, position?: number) => {
  await initPosition()
  listPosition[id] = position ?? 0
  saveListPositionThrottle()
}
export const removeListPosition = async(id: string) => {
  await initPosition()
  if (listPosition[id] == null) return
  delete listPosition[id]
  saveListPositionThrottle()
}
export const overwriteListPosition = async(ids: string[]) => {
  await initPosition()
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
  // eslint-disable-next-line require-atomic-updates
  listPrevSelectId ??= await getListPrevSelectIdFromData() ?? LIST_IDS.DEFAULT
  return listPrevSelectId ?? LIST_IDS.DEFAULT
}
export const saveListPrevSelectId = (id: string) => {
  listPrevSelectId = id
  saveListPrevSelectIdThrottle()
}

const saveListUpdateInfo = throttle(() => {
  saveListUpdateInfoFromData(listUpdateInfo)
}, 1000)

const initListUpdateInfo = async() => {
  if (listUpdateInfo == null) {
    // eslint-disable-next-line require-atomic-updates
    listUpdateInfo = await getListUpdateInfoFromData() ?? {}
    for (const [id, info] of Object.entries(listUpdateInfo)) {
      setUpdateTime(id, info.updateTime ? dateFormat(info.updateTime) : '')
    }
  }
}
export const getListUpdateInfo = async() => {
  await initListUpdateInfo()
  return listUpdateInfo
}
export const setListUpdateInfo = async(info: LX.List.ListUpdateInfo) => {
  await initListUpdateInfo()
  listUpdateInfo = info
  saveListUpdateInfo()
}
export const setListAutoUpdate = async(id: string, enable: boolean) => {
  await initListUpdateInfo()
  const targetInfo = listUpdateInfo[id] ?? { updateTime: 0, isAutoUpdate: false }
  targetInfo.isAutoUpdate = enable
  listUpdateInfo[id] = targetInfo
  saveListUpdateInfo()
}
export const setListUpdateTime = async(id: string, time: number) => {
  await initListUpdateInfo()
  const targetInfo = listUpdateInfo[id] ?? { updateTime: 0, isAutoUpdate: false }
  targetInfo.updateTime = time
  listUpdateInfo[id] = targetInfo
  saveListUpdateInfo()
}
// export const setListUpdateInfo = (id, { updateTime, isAutoUpdate }) => {
//   listUpdateInfo[id] = { updateTime, isAutoUpdate }
//   saveListUpdateInfo()
// }
export const removeListUpdateInfo = async(id: string) => {
  await initListUpdateInfo()
  if (listUpdateInfo[id] == null) return
  delete listUpdateInfo[id]
  saveListUpdateInfo()
}
export const overwriteListUpdateInfo = async(ids: string[]) => {
  await initListUpdateInfo()
  const removedIds = []
  for (const id of Object.keys(listUpdateInfo)) {
    if (ids.includes(id)) continue
    removedIds.push(id)
  }
  for (const id of removedIds) delete listUpdateInfo[id]
  saveListUpdateInfo()
}


export const getSearchSetting = async() => {
  // eslint-disable-next-line require-atomic-updates
  searchSetting ??= await getSearchSettingFromData()
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
  // eslint-disable-next-line require-atomic-updates
  songListSetting ??= await getSongListSettingFromData()
  return { ...songListSetting }
}
export const setSongListSetting = async(setting: Partial<typeof DEFAULT_SETTING['songList']>) => {
  if (!songListSetting) await getSongListSetting()
  songListSetting = Object.assign(songListSetting, setting)
  saveSongListSettingThrottle()
}

export const getLeaderboardSetting = async() => {
  // eslint-disable-next-line require-atomic-updates
  leaderboardSetting ??= await getLeaderboardSettingFromData()
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
