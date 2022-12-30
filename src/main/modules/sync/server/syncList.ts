import { promises as fsPromises } from 'fs'
import { encryptMsg, decryptMsg, getSnapshotFilePath } from './utils'
import { throttle } from '@common/utils'
import { Server } from 'socket.io'
import { sendCloseSelectMode, sendSelectMode } from '@main/modules/winMain'
import { LIST_IDS } from '@common/constants'

// type ListInfoType = LX.List.UserListInfoFull | LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull

let io: Server | null
let syncingId: string | null = null
const wait = async(time = 1000) => await new Promise((resolve, reject) => setTimeout(resolve, time))

const patchListData = (listData: Partial<LX.Sync.ListData>): LX.Sync.ListData => {
  return Object.assign({
    defaultList: [],
    loveList: [],
    userList: [],
  }, listData)
}

const getRemoteListData = async(socket: LX.Sync.Socket): Promise<LX.Sync.ListData> => await new Promise((resolve, reject) => {
  console.log('getRemoteListData')
  const handleError = (reason: string) => {
    socket.removeListener('list:sync', handleSuccess)
    socket.removeListener('disconnect', handleError)
    reject(new Error(reason))
  }
  const handleSuccess = (enData: string) => {
    socket.removeListener('disconnect', handleError)
    socket.removeListener('list:sync', handleSuccess)
    console.log('getRemoteListData', 'handleSuccess')
    const data: LX.Sync.Data | null = JSON.parse(decryptMsg(socket.data.keyInfo, enData))
    if (!data) return reject(new Error('Get remote list data failed'))
    if (data.action != 'getData') return
    resolve(patchListData(data.data))
  }

  socket.on('disconnect', handleError)
  socket.on('list:sync', handleSuccess)
  socket.emit('list:sync', encryptMsg(socket.data.keyInfo, JSON.stringify({ action: 'getData', data: 'all' })))
})

// const getAllLists = async() => {
//   const lists = []
//   lists.push(await getListMusics(defaultList.id).then(musics => ({ ...defaultList, list: toRaw(musics).map(m => toOldMusicInfo(m)) })))
//   lists.push(await getListMusics(loveList.id).then(musics => ({ ...loveList, list: toRaw(musics).map(m => toOldMusicInfo(m)) })))

//   for await (const list of userLists) {
//     lists.push(await getListMusics(list.id).then(musics => ({ ...toRaw(list), list: toRaw(musics).map(m => toOldMusicInfo(m)) })))
//   }

//   return lists
// }

const getLocalListData = async(): Promise<LX.Sync.ListData> => {
  const lists: LX.Sync.ListData = {
    defaultList: await global.lx.worker.dbService.getListMusics(LIST_IDS.DEFAULT),
    loveList: await global.lx.worker.dbService.getListMusics(LIST_IDS.LOVE),
    userList: [],
  }

  const userListInfos = await global.lx.worker.dbService.getAllUserList()
  for await (const list of userListInfos) {
    lists.userList.push(await global.lx.worker.dbService.getListMusics(list.id)
      .then(musics => ({ ...list, list: musics })))
  }

  return lists
}
const getSyncMode = async(keyInfo: LX.Sync.KeyInfo): Promise<LX.Sync.Mode> => await new Promise((resolve, reject) => {
  let removeListener = sendSelectMode(keyInfo, (mode) => {
    removeListener()
    resolve(mode)
  })
})

const finishedSync = (socket: LX.Sync.Socket) => {
  return socket.emit('list:sync', encryptMsg(socket.data.keyInfo, JSON.stringify({
    action: 'finished',
  })))
}


const setLocalList = (listData: LX.Sync.ListData) => {
  void global.lx.event_list.list_data_overwrite(listData, true)
}
const setRemotelList = async(socket: LX.Sync.Socket, listData: LX.Sync.ListData) => {
  if (!io) return

  const sockets: LX.Sync.RemoteSocket[] = await io.fetchSockets()
  for (const socket of sockets) {
    // if (excludeIds.includes(socket.data.keyInfo.clientId)) continue
    socket.emit('list:sync', encryptMsg(socket.data.keyInfo, JSON.stringify({ action: 'setData', data: listData })))
  }
}

const writeFilePromises: Map<string, Promise<void>> = new Map()
const updateSnapshot = async(path: string, data: string) => {
  console.log('updateSnapshot', path)
  let writeFilePromise = writeFilePromises.get(path) ?? Promise.resolve()
  writeFilePromise = writeFilePromise.then(async() => {
    if (writeFilePromise !== writeFilePromises.get(path)) return
    return await fsPromises.writeFile(path, data)
  })
  writeFilePromises.set(path, writeFilePromise)
  return await writeFilePromise.finally(() => {
    if (writeFilePromise !== writeFilePromises.get(path)) return
    writeFilePromises.delete(path)
  })
}

type UserDataObj = Record<string, LX.List.UserListInfoFull>

const createUserListDataObj = (listData: LX.Sync.ListData): UserDataObj => {
  const userListDataObj: UserDataObj = {}
  for (const list of listData.userList) userListDataObj[list.id] = list
  return userListDataObj
}

const handleMergeList = (
  sourceList: LX.Music.MusicInfo[],
  targetList: LX.Music.MusicInfo[],
  addMusicLocationType: LX.AddMusicLocationType,
): LX.Music.MusicInfo[] => {
  let newList
  switch (addMusicLocationType) {
    case 'top':
      newList = [...targetList, ...sourceList]
      break
    case 'bottom':
    default:
      newList = [...sourceList, ...targetList]
      break
  }
  const map: Map<string | number, LX.Music.MusicInfo> = new Map()
  const ids: Array<string | number> = []
  switch (addMusicLocationType) {
    case 'top':
      newList = [...targetList, ...sourceList]
      for (let i = newList.length - 1; i > -1; i--) {
        const item = newList[i]
        if (map.has(item.id)) continue
        ids.unshift(item.id)
        map.set(item.id, item)
      }
      break
    case 'bottom':
    default:
      newList = [...sourceList, ...targetList]
      for (const item of newList) {
        if (map.has(item.id)) continue
        ids.push(item.id)
        map.set(item.id, item)
      }
      break
  }
  return ids.map(id => map.get(id)) as LX.Music.MusicInfo[]
}
const mergeList = (sourceListData: LX.Sync.ListData, targetListData: LX.Sync.ListData): LX.Sync.ListData => {
  const addMusicLocationType = global.lx.appSetting['list.addMusicLocationType']
  const newListData: LX.Sync.ListData = {
    defaultList: [],
    loveList: [],
    userList: [],
  }
  newListData.defaultList = handleMergeList(sourceListData.defaultList, targetListData.defaultList, addMusicLocationType)
  newListData.loveList = handleMergeList(sourceListData.loveList, targetListData.loveList, addMusicLocationType)

  const userListDataObj = createUserListDataObj(sourceListData)
  newListData.userList = [...sourceListData.userList]

  targetListData.userList.forEach((list, index) => {
    const targetUpdateTime = list?.locationUpdateTime ?? 0
    const sourceList = userListDataObj[list.id]
    if (sourceList) {
      sourceList.list = handleMergeList(sourceList.list, list.list, addMusicLocationType)

      const sourceUpdateTime = sourceList?.locationUpdateTime ?? 0
      if (targetUpdateTime >= sourceUpdateTime) return
      // 调整位置
      const [newList] = newListData.userList.splice(newListData.userList.findIndex(l => l.id == list.id), 1)
      newList.locationUpdateTime = targetUpdateTime
      newListData.userList.splice(index, 0, newList)
    } else {
      if (targetUpdateTime) {
        newListData.userList.splice(index, 0, list)
      } else {
        newListData.userList.push(list)
      }
    }
  })

  return newListData
}
const overwriteList = (sourceListData: LX.Sync.ListData, targetListData: LX.Sync.ListData): LX.Sync.ListData => {
  const newListData: LX.Sync.ListData = {
    defaultList: [],
    loveList: [],
    userList: [],
  }
  newListData.defaultList = sourceListData.defaultList
  newListData.loveList = sourceListData.loveList

  const userListDataObj = createUserListDataObj(sourceListData)
  newListData.userList = [...sourceListData.userList]

  targetListData.userList.forEach((list, index) => {
    if (userListDataObj[list.id]) return
    if (list?.locationUpdateTime) {
      newListData.userList.splice(index, 0, list)
    } else {
      newListData.userList.push(list)
    }
  })

  return newListData
}

const handleMergeListData = async(socket: LX.Sync.Socket): Promise<LX.Sync.ListData | null> => {
  let isSelectingMode = false
  const handleDisconnect = () => {
    if (!isSelectingMode) return
    sendCloseSelectMode()
  }
  socket.on('disconnect', handleDisconnect)
  isSelectingMode = true
  const mode: LX.Sync.Mode = await getSyncMode(socket.data.keyInfo)
  isSelectingMode = false
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalListData()])
  console.log('handleMergeListData', 'remoteListData, localListData')
  let listData: LX.Sync.ListData
  switch (mode) {
    case 'merge_local_remote':
      listData = mergeList(localListData, remoteListData)
      break
    case 'merge_remote_local':
      listData = mergeList(remoteListData, localListData)
      break
    case 'overwrite_local_remote':
      listData = overwriteList(localListData, remoteListData)
      break
    case 'overwrite_remote_local':
      listData = overwriteList(remoteListData, localListData)
      break
    case 'overwrite_local_remote_full':
      listData = localListData
      break
    case 'overwrite_remote_local_full':
      listData = remoteListData
      break
    case 'none': return null
    case 'cancel':
      socket.disconnect(true)
      throw new Error('cancel')
  }
  return listData
}

const handleSyncList = async(socket: LX.Sync.Socket): Promise<LX.Sync.ListData | null> => {
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalListData()])
  console.log('handleSyncList', 'remoteListData, localListData')
  const listData: LX.Sync.ListData = {
    defaultList: [],
    loveList: [],
    userList: [],
  }
  if (localListData.defaultList.length || localListData.loveList.length || localListData.userList.length) {
    if (remoteListData.defaultList.length || remoteListData.loveList.length || remoteListData.userList.length) {
      const mergedList = await handleMergeListData(socket)
      console.log('handleMergeListData', 'mergedList')
      // console.log(mergedList)
      if (!mergedList) return null
      listData.defaultList = mergedList.defaultList
      listData.loveList = mergedList.loveList
      listData.userList = mergedList.userList
      setLocalList(mergedList)
      void setRemotelList(socket, mergedList)
    } else {
      void setRemotelList(socket, localListData)
      listData.defaultList = localListData.defaultList
      listData.loveList = localListData.loveList
      listData.userList = localListData.userList
    }
  } else {
    if (remoteListData.defaultList.length || remoteListData.loveList.length || remoteListData.userList.length) {
      setLocalList(remoteListData)
      listData.defaultList = remoteListData.defaultList
      listData.loveList = remoteListData.loveList
      listData.userList = remoteListData.userList
    } else {
      listData.defaultList = localListData.defaultList
      listData.loveList = localListData.loveList
      listData.userList = localListData.userList
    }
  }
  return await updateSnapshot(socket.data.snapshotFilePath, JSON.stringify({
    defaultList: listData.defaultList,
    loveList: listData.loveList,
    userList: listData.userList,
  })).then(() => {
    socket.data.isCreatedSnapshot = true
    return listData
  })
}

const mergeListDataFromSnapshot = (
  sourceList: LX.Music.MusicInfo[],
  targetList: LX.Music.MusicInfo[],
  snapshotList: LX.Music.MusicInfo[],
  addMusicLocationType: LX.AddMusicLocationType,
): LX.Music.MusicInfo[] => {
  const removedListIds: Set<string | number> = new Set()
  const sourceListItemIds: Set<string | number> = new Set()
  const targetListItemIds: Set<string | number> = new Set()
  for (const m of sourceList) sourceListItemIds.add(m.id)
  for (const m of targetList) targetListItemIds.add(m.id)
  if (snapshotList) {
    for (const m of snapshotList) {
      if (!sourceListItemIds.has(m.id) || !targetListItemIds.has(m.id)) removedListIds.add(m.id)
    }
  }

  let newList
  const map: Map<string | number, LX.Music.MusicInfo> = new Map()
  const ids = []
  switch (addMusicLocationType) {
    case 'top':
      newList = [...targetList, ...sourceList]
      for (let i = newList.length - 1; i > -1; i--) {
        const item = newList[i]
        if (map.has(item.id) || removedListIds.has(item.id)) continue
        ids.unshift(item.id)
        map.set(item.id, item)
      }
      break
    case 'bottom':
    default:
      newList = [...sourceList, ...targetList]
      for (const item of newList) {
        if (map.has(item.id) || removedListIds.has(item.id)) continue
        ids.push(item.id)
        map.set(item.id, item)
      }
      break
  }
  return ids.map(id => map.get(id)) as LX.Music.MusicInfo[]
}
const handleMergeListDataFromSnapshot = async(socket: LX.Sync.Socket, snapshot: LX.Sync.ListData): Promise<LX.Sync.ListData> => {
  const addMusicLocationType = global.lx.appSetting['list.addMusicLocationType']
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalListData()])
  const newListData: LX.Sync.ListData = {
    defaultList: [],
    loveList: [],
    userList: [],
  }
  newListData.defaultList = mergeListDataFromSnapshot(localListData.defaultList, remoteListData.defaultList, snapshot.defaultList, addMusicLocationType)
  newListData.loveList = mergeListDataFromSnapshot(localListData.loveList, remoteListData.loveList, snapshot.loveList, addMusicLocationType)
  const localUserListData = createUserListDataObj(localListData)
  const remoteUserListData = createUserListDataObj(remoteListData)
  const snapshotUserListData = createUserListDataObj(snapshot)
  const removedListIds: Set<string | number> = new Set()
  const localUserListIds: Set<string | number> = new Set()
  const remoteUserListIds: Set<string | number> = new Set()

  for (const l of localListData.userList) localUserListIds.add(l.id)
  for (const l of remoteListData.userList) remoteUserListIds.add(l.id)

  for (const l of snapshot.userList) {
    if (!localUserListIds.has(l.id) || !remoteUserListIds.has(l.id)) removedListIds.add(l.id)
  }

  let newUserList: LX.List.UserListInfoFull[] = []
  for (const list of localListData.userList) {
    if (removedListIds.has(list.id)) continue
    const remoteList = remoteUserListData[list.id]
    let newList: LX.List.UserListInfoFull
    if (remoteList) {
      newList = { ...list, list: mergeListDataFromSnapshot(list.list, remoteList.list, snapshotUserListData[list.id].list, addMusicLocationType) }
    } else {
      newList = { ...list }
    }
    newUserList.push(newList)
  }

  remoteListData.userList.forEach((list, index) => {
    if (removedListIds.has(list.id)) return
    const remoteUpdateTime = list?.locationUpdateTime ?? 0
    if (localUserListData[list.id]) {
      const localUpdateTime = localUserListData[list.id]?.locationUpdateTime ?? 0
      if (localUpdateTime >= remoteUpdateTime) return
      // 调整位置
      const [newList] = newUserList.splice(newUserList.findIndex(l => l.id == list.id), 1)
      newList.locationUpdateTime = localUpdateTime
      newUserList.splice(index, 0, newList)
    } else {
      if (remoteUpdateTime) {
        newUserList.splice(index, 0, { ...list })
      } else {
        newUserList.push({ ...list })
      }
    }
  })

  newListData.userList = newUserList
  setLocalList(newListData)
  void setRemotelList(socket, newListData)
  return await updateSnapshot(socket.data.snapshotFilePath, JSON.stringify({
    defaultList: newListData.defaultList,
    loveList: newListData.loveList,
    userList: newListData.userList,
  })).then(() => {
    socket.data.isCreatedSnapshot = true
    return newListData
  })
}

const registerUpdateSnapshotTask = (socket: LX.Sync.Socket, snapshot: LX.Sync.ListData) => {
  if (!socket.data.isCreatedSnapshot) return
  const handleUpdateSnapshot = throttle(() => {
    // TODO: 同步成功后再保存快照
    void getLocalListData().then(({ defaultList, loveList, userList }) => {
      if (defaultList != null) snapshot.defaultList = defaultList
      if (loveList != null) snapshot.loveList = loveList
      if (userList != null) snapshot.userList = userList
      void updateSnapshot(socket.data.snapshotFilePath, JSON.stringify(snapshot))
    })
  }, 2000)
  global.lx.event_list.on('list_changed', handleUpdateSnapshot)
  socket.on('disconnect', () => {
    global.lx.event_list.off('list_changed', handleUpdateSnapshot)
  })
}

const syncList = async(socket: LX.Sync.Socket): Promise<LX.Sync.ListData | null> => {
  socket.data.snapshotFilePath = getSnapshotFilePath(socket.data.keyInfo)
  let fileData: any
  let isSyncRequired = false
  try {
    fileData = (await fsPromises.readFile(socket.data.snapshotFilePath)).toString()
    fileData = JSON.parse(fileData)
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code != 'ENOENT') throw err
    isSyncRequired = true
  }
  console.log('isSyncRequired', isSyncRequired)
  if (isSyncRequired) return await handleSyncList(socket)
  return await handleMergeListDataFromSnapshot(socket, patchListData(fileData))
}

const checkSyncQueue = async(): Promise<void> => {
  if (!syncingId) return
  console.log('sync queue...')
  await wait()
  return await checkSyncQueue()
}

// export {
//   syncList = async(_io: Server, socket: LX.Sync.Socket) => {
//     io = _io
//     await checkSyncQueue()
//     syncingId = socket.data.keyInfo.clientId
//     return await syncList(socket).then(newListData => {
//       registerUpdateSnapshotTask(socket, { ...newListData })
//       return finishedSync(socket)
//     }).finally(() => {
//       syncingId = null
//     })
//   }
// }

const _syncList = async(_io: Server, socket: LX.Sync.Socket) => {
  io = _io
  await checkSyncQueue()
  syncingId = socket.data.keyInfo.clientId
  return await syncList(socket).then(newListData => {
    if (newListData) registerUpdateSnapshotTask(socket, { ...newListData })
    return finishedSync(socket)
  }).finally(() => {
    syncingId = null
  })
}

const removeSnapshot = async(keyInfo: LX.Sync.KeyInfo) => {
  const filePath = getSnapshotFilePath(keyInfo)
  return await fsPromises.unlink(filePath)
}

export {
  _syncList as syncList,
  removeSnapshot,
}

