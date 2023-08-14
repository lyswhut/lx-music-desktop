import { SYNC_CLOSE_CODE } from '@common/constants'
import { getLocalListData, setLocalListData } from '@main/modules/sync/utils'
import { removeSelectModeListener, sendCloseSelectMode, sendSelectMode } from '@main/modules/winMain'
import { createSnapshot, getCurrentListInfoKey } from '../../utils'
import { getSnapshot, updateDeviceSnapshotKey } from '@main/modules/sync/data'


const handleSetLocalListData = async(listData: LX.Sync.ListData) => {
  await setLocalListData(listData)
  return createSnapshot()
}

// type ListInfoType = LX.List.UserListInfoFull | LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull

// let wss: LX.Sync.Server.SocketServer | null
let syncingId: string | null = null
const wait = async(time = 1000) => await new Promise((resolve, reject) => setTimeout(resolve, time))

const patchListData = (listData: Partial<LX.Sync.ListData>): LX.Sync.ListData => {
  return Object.assign({
    defaultList: [],
    loveList: [],
    userList: [],
  }, listData)
}

const getRemoteListData = async(socket: LX.Sync.Server.Socket): Promise<LX.Sync.ListData> => {
  console.log('getRemoteListData')
  return patchListData(await socket.remoteSyncList.list_sync_get_list_data())
}

const getRemoteListMD5 = async(socket: LX.Sync.Server.Socket): Promise<string> => {
  return socket.remoteSyncList.list_sync_get_md5()
}

const getSyncMode = async(socket: LX.Sync.Server.Socket): Promise<LX.Sync.Mode> => new Promise((resolve, reject) => {
  const handleDisconnect = (err: Error) => {
    sendCloseSelectMode()
    removeSelectModeListener()
    reject(err)
  }
  let removeEventClose = socket.onClose(handleDisconnect)
  sendSelectMode(socket.keyInfo.deviceName, (mode) => {
    if (mode == null) {
      reject(new Error('cancel'))
      return
    }
    resolve(mode)
    removeSelectModeListener()
    removeEventClose()
  })
})

const finishedSync = async(socket: LX.Sync.Server.Socket) => {
  await socket.remoteSyncList.list_sync_finished()
}

const overwriteRemoteListData = async(socket: LX.Sync.Server.Socket, listData: LX.Sync.ListData, key: string, excludeIds: string[] = []) => {
  const action = { action: 'list_data_overwrite', data: listData } as const
  const tasks: Array<Promise<void>> = []
  socket.broadcast((client) => {
    if (excludeIds.includes(client.keyInfo.clientId) || !client.isReady) return
    tasks.push(client.remoteSyncList.onListSyncAction(action).then(() => {
      updateDeviceSnapshotKey(socket.keyInfo, key)
    }))
  })
  if (!tasks.length) return
  await Promise.all(tasks)
}
const setRemotelList = async(socket: LX.Sync.Server.Socket, listData: LX.Sync.ListData, key: string): Promise<void> => {
  await socket.remoteSyncList.list_sync_set_list_data(listData)
  updateDeviceSnapshotKey(socket.keyInfo, key)
}

type UserDataObj = Map<string, LX.List.UserListInfoFull>
const createUserListDataObj = (listData: LX.Sync.ListData): UserDataObj => {
  const userListDataObj: UserDataObj = new Map()
  for (const list of listData.userList) userListDataObj.set(list.id, list)
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
  const map = new Map<string | number, LX.Music.MusicInfo>()
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
    const sourceList = userListDataObj.get(list.id)
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
    if (userListDataObj.has(list.id)) return
    if (list?.locationUpdateTime) {
      newListData.userList.splice(index, 0, list)
    } else {
      newListData.userList.push(list)
    }
  })

  return newListData
}

const handleMergeListData = async(socket: LX.Sync.Server.Socket): Promise<[LX.Sync.ListData, boolean, boolean]> => {
  const mode: LX.Sync.Mode = await getSyncMode(socket)

  if (mode == 'cancel') {
    socket.close(SYNC_CLOSE_CODE.normal)
    throw new Error('cancel')
  }
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalListData()])
  console.log('handleMergeListData', 'remoteListData, localListData')
  let listData: LX.Sync.ListData
  let requiredUpdateLocalListData = true
  let requiredUpdateRemoteListData = true
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
      requiredUpdateLocalListData = false
      break
    case 'overwrite_remote_local_full':
      listData = remoteListData
      requiredUpdateRemoteListData = false
      break
    // case 'none': return null
    // case 'cancel':
    default:
      socket.close(SYNC_CLOSE_CODE.normal)
      throw new Error('cancel')
  }
  return [listData, requiredUpdateLocalListData, requiredUpdateRemoteListData]
}

const handleSyncList = async(socket: LX.Sync.Server.Socket) => {
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalListData()])
  console.log('handleSyncList', 'remoteListData, localListData')
  if (localListData.defaultList.length || localListData.loveList.length || localListData.userList.length) {
    if (remoteListData.defaultList.length || remoteListData.loveList.length || remoteListData.userList.length) {
      const [mergedList, requiredUpdateLocalListData, requiredUpdateRemoteListData] = await handleMergeListData(socket)
      console.log('handleMergeListData', 'mergedList')
      let key
      if (requiredUpdateLocalListData) {
        key = await handleSetLocalListData(mergedList)
        await overwriteRemoteListData(socket, mergedList, key, [socket.keyInfo.clientId])
        if (!requiredUpdateRemoteListData) updateDeviceSnapshotKey(socket.keyInfo, key)
      }
      if (requiredUpdateRemoteListData) {
        if (!key) key = await getCurrentListInfoKey()
        await setRemotelList(socket, mergedList, key)
      }
    } else {
      await setRemotelList(socket, localListData, await getCurrentListInfoKey())
    }
  } else {
    let key: string
    if (remoteListData.defaultList.length || remoteListData.loveList.length || remoteListData.userList.length) {
      key = await handleSetLocalListData(remoteListData)
      await overwriteRemoteListData(socket, remoteListData, key, [socket.keyInfo.clientId])
    }
    key ??= await getCurrentListInfoKey()
    updateDeviceSnapshotKey(socket.keyInfo, key)
  }
}

const mergeListDataFromSnapshot = (
  sourceList: LX.Music.MusicInfo[],
  targetList: LX.Music.MusicInfo[],
  snapshotList: LX.Music.MusicInfo[],
  addMusicLocationType: LX.AddMusicLocationType,
): LX.Music.MusicInfo[] => {
  const removedListIds = new Set<string | number>()
  const sourceListItemIds = new Set<string | number>()
  const targetListItemIds = new Set<string | number>()
  for (const m of sourceList) sourceListItemIds.add(m.id)
  for (const m of targetList) targetListItemIds.add(m.id)
  if (snapshotList) {
    for (const m of snapshotList) {
      if (!sourceListItemIds.has(m.id) || !targetListItemIds.has(m.id)) removedListIds.add(m.id)
    }
  }

  let newList
  const map = new Map<string | number, LX.Music.MusicInfo>()
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
const checkListLatest = async(socket: LX.Sync.Server.Socket) => {
  const remoteListMD5 = await getRemoteListMD5(socket)
  const currentListInfoKey = await getCurrentListInfoKey()
  const latest = remoteListMD5 == currentListInfoKey
  if (latest && socket.keyInfo.snapshotKey != currentListInfoKey) updateDeviceSnapshotKey(socket.keyInfo, currentListInfoKey)
  return latest
}
const handleMergeListDataFromSnapshot = async(socket: LX.Sync.Server.Socket, snapshot: LX.Sync.ListData) => {
  if (await checkListLatest(socket)) return

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
  const removedListIds = new Set<string | number>()
  const localUserListIds = new Set<string | number>()
  const remoteUserListIds = new Set<string | number>()

  for (const l of localListData.userList) localUserListIds.add(l.id)
  for (const l of remoteListData.userList) remoteUserListIds.add(l.id)

  for (const l of snapshot.userList) {
    if (!localUserListIds.has(l.id) || !remoteUserListIds.has(l.id)) removedListIds.add(l.id)
  }

  let newUserList: LX.List.UserListInfoFull[] = []
  for (const list of localListData.userList) {
    if (removedListIds.has(list.id)) continue
    const remoteList = remoteUserListData.get(list.id)
    let newList: LX.List.UserListInfoFull
    if (remoteList) {
      newList = { ...list, list: mergeListDataFromSnapshot(list.list, remoteList.list, snapshotUserListData.get(list.id)?.list ?? [], addMusicLocationType) }
    } else {
      newList = { ...list }
    }
    newUserList.push(newList)
  }

  remoteListData.userList.forEach((list, index) => {
    if (removedListIds.has(list.id)) return
    const remoteUpdateTime = list?.locationUpdateTime ?? 0
    if (localUserListData.has(list.id)) {
      const localUpdateTime = localUserListData.get(list.id)?.locationUpdateTime ?? 0
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
  const key = await handleSetLocalListData(newListData)
  await setRemotelList(socket, newListData, key)
  await overwriteRemoteListData(socket, newListData, key, [socket.keyInfo.clientId])
}


const syncList = async(socket: LX.Sync.Server.Socket) => {
  // socket.data.snapshotFilePath = getSnapshotFilePath(socket.keyInfo)
  if (socket.keyInfo.snapshotKey) {
    const listData = await getSnapshot(socket.keyInfo.snapshotKey)
    if (listData) {
      await handleMergeListDataFromSnapshot(socket, listData)
      return
    }
  }
  await handleSyncList(socket)
}


// export default async(_wss: LX.Sync.Server.SocketServer, socket: LX.Sync.Server.Socket) => {
//   if (!wss) {
//     wss = _wss
//     _wss.addListener('close', () => {
//       wss = null
//     })
//   }

//   let disconnected = false
//   socket.onClose(() => {
//     disconnected = true
//     if (syncingId == socket.keyInfo.clientId) syncingId = null
//   })

//   while (true) {
//     if (disconnected) throw new Error('disconnected')
//     if (!syncingId) break
//     await wait()
//   }

//   syncingId = socket.keyInfo.clientId
//   await syncList(socket).then(async() => {
//     // if (newListData) registerUpdateSnapshotTask(socket, { ...newListData })
//     return finishedSync(socket)
//   }).finally(() => {
//     syncingId = null
//   })
// }

// const removeSnapshot = async(keyInfo: LX.Sync.KeyInfo) => {
//   const filePath = getSnapshotFilePath(keyInfo)
//   await fsPromises.unlink(filePath)
// }

export default async(socket: LX.Sync.Server.Socket) => {
  let disconnected = false
  socket.onClose(() => {
    disconnected = true
    if (syncingId == socket.keyInfo.clientId) syncingId = null
  })

  while (true) {
    if (disconnected) throw new Error('disconnected')
    if (!syncingId) break
    await wait()
  }

  syncingId = socket.keyInfo.clientId
  await syncList(socket).then(async() => {
    return finishedSync(socket)
  }).finally(() => {
    syncingId = null
  })
}
