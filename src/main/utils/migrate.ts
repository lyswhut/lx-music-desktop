import fs from 'node:fs'
import { checkPath, joinPath } from '@common/utils/nodejs'
import { log } from '@common/utils'
import { filterMusicList, toNewMusicInfo } from '@common/utils/tools'
import { APP_EVENT_NAMES, STORE_NAMES } from '@common/constants'

/**
 * 读取配置文件
 * @returns
 */
export const parseDataFile = async<T>(name: string): Promise<T | null> => {
  const path = joinPath(global.lxOldDataPath, name)
  if (await checkPath(path)) {
    try {
      return JSON.parse((await fs.promises.readFile(path)).toString())
    } catch (err) {
      log.error(err)
    }
  }
  return null
}

interface OldUserListInfo {
  name: string
  id: string
  source?: LX.OnlineSource
  sourceListId?: string
  locationUpdateTime?: number
  list: any[]
}

/**
 * 迁移 v2.0.0 之前的 list data
 * @returns
 */
export const migrateDBData = async() => {
  let playList = await parseDataFile<{ defaultList?: { list: any[] }, loveList?: { list: any[] }, tempList?: { list: any[] }, userList?: OldUserListInfo[] }>('playList.json')
  let listDataAll: LX.List.ListDataFull = {
    defaultList: [],
    loveList: [],
    userList: [],
    tempList: [],
  }
  let isRequiredSave = false
  if (playList) {
    if (playList.defaultList) listDataAll.defaultList = filterMusicList(playList.defaultList.list.map(m => toNewMusicInfo(m)))
    if (playList.loveList) listDataAll.loveList = filterMusicList(playList.loveList.list.map(m => toNewMusicInfo(m)))
    if (playList.tempList) listDataAll.tempList = filterMusicList(playList.tempList.list.map(m => toNewMusicInfo(m)))
    if (playList.userList) {
      listDataAll.userList = playList.userList.map(l => {
        return {
          ...l,
          locationUpdateTime: l.locationUpdateTime ?? null,
          list: filterMusicList(l.list.map(m => toNewMusicInfo(m))),
        }
      })
    }
    isRequiredSave = true
  } else {
    const config = await parseDataFile<{ list?: { defaultList?: any[], loveList?: any[] } }>('config.json')
    if (config?.list) {
      const list = config.list
      if (list.defaultList) listDataAll.defaultList = filterMusicList(list.defaultList.map(m => toNewMusicInfo(m)))
      if (list.loveList) listDataAll.loveList = filterMusicList(list.loveList.map(m => toNewMusicInfo(m)))
      isRequiredSave = true
    }
  }
  if (isRequiredSave) await global.lx.worker.dbService.listDataOverwrite(listDataAll)

  const lyricData = await parseDataFile<Record<string, LX.Music.LyricInfo>>('lyrics_edited.json')
  if (lyricData) {
    for await (const [id, info] of Object.entries(lyricData)) {
      await global.lx.worker.dbService.editedLyricAdd(id, info)
    }
  }
}

// 迁移文件
const migrateFile = async(name: string, targetName: string) => {
  let path = joinPath(global.lxDataPath, targetName)
  let oldPath = joinPath(global.lxOldDataPath, name)
  if (!await checkPath(path) && await checkPath(oldPath)) {
    await fs.promises.copyFile(oldPath, path).catch(err => {
      log.error(err)
    }).catch(err => {
      log.error(err)
    })
  }
}

/**
 * 迁移 v2.0.0 之前的 data.json
 * @returns
 */
export const migrateDataJson = async() => {
  const path = joinPath(global.lxDataPath, 'data.json')
  if (await checkPath(path)) return
  const oldDataFile = await parseDataFile<{
    searchHistoryList?: string[]
    playInfo?: any
    listPrevSelectId?: any
    listPosition?: any
    listUpdateInfo?: any
  }>('data.json')
  if (!oldDataFile) return
  const newData: any = {}
  if (oldDataFile.searchHistoryList) newData.searchHistoryList = oldDataFile.searchHistoryList
  if (oldDataFile.playInfo) newData.playInfo = oldDataFile.playInfo
  if (oldDataFile.listPrevSelectId) newData.listPrevSelectId = oldDataFile.listPrevSelectId
  if (oldDataFile.listPosition) newData.listScrollPosition = oldDataFile.listPosition
  if (oldDataFile.listUpdateInfo) newData.listUpdateInfo = oldDataFile.listUpdateInfo

  await fs.promises.writeFile(path, JSON.stringify(newData)).catch(err => {
    log.error(err)
  })
}


const hotKeyNameMap = {
  mainWindow: APP_EVENT_NAMES.winMainName,
  winLyric: APP_EVENT_NAMES.winLyricName,
} as const
const updateHotKeyTypeName = (config: LX.HotKeyConfig) => {
  for (const keyConfig of Object.values(config.keys)) {
    if (hotKeyNameMap[keyConfig.type as keyof typeof hotKeyNameMap]) keyConfig.type = hotKeyNameMap[keyConfig.type as keyof typeof hotKeyNameMap]
  }
}
/**
 * 迁移 v2.0.0 之前的 hotkey
 * @returns
 */
export const migrateHotKey = async() => {
  const oldConfig = await parseDataFile<LX.HotKeyConfigAll>('hotKey.json')
  if (oldConfig) {
    let localConfig: LX.HotKeyConfig
    let globalConfig: LX.HotKeyConfig
    updateHotKeyTypeName(oldConfig.local)
    updateHotKeyTypeName(oldConfig.global)

    localConfig = oldConfig.local
    globalConfig = oldConfig.global

    // 移除v1.0.1及之前设置的全局声音媒体快捷键接管
    if (globalConfig.keys.VolumeUp) {
      delete globalConfig.keys.VolumeUp
      delete globalConfig.keys.VolumeDown
      delete globalConfig.keys.VolumeMute
    }
    return {
      local: localConfig,
      global: globalConfig,
    }
  }
  return null
}

/**
 * 迁移 v2.0.0 之前的user api
 * @returns
 */
export const migrateUserApi = async() => migrateFile('userApi.json', STORE_NAMES.USER_API + '.json')
