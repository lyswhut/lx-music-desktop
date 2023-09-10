// import { SYNC_CLOSE_CODE } from '../../../../constants'
import { removeSelectModeListener, sendCloseSelectMode, sendSelectMode } from '@main/modules/winMain'
import { getUserSpace, getUserConfig } from '../../../user'
import { buildUserListInfoFull, getLocalListData, setLocalListData } from '@main/modules/sync/listEvent'
import { SYNC_CLOSE_CODE } from '@common/constants_sync'
// import { LIST_IDS } from '@common/constants'

// type ListInfoType = LX.List.UserListInfoFull | LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull

// let wss: LX.Sync.Server.SocketServer | null
let syncingId: string | null = null
const wait = async(time = 1000) => await new Promise((resolve, reject) => setTimeout(resolve, time))

const patchListData = (listData: Partial<LX.Sync.List.ListData>): LX.Sync.List.ListData => {
  return Object.assign({
    defaultList: [],
    loveList: [],
    userList: [],
  }, listData)
}

const getRemoteListData = async(socket: LX.Sync.Server.Socket): Promise<LX.Sync.List.ListData> => {
  console.log('getRemoteListData')
  return patchListData(await socket.remoteQueueList.list_sync_get_list_data())
}

const getRemoteListMD5 = async(socket: LX.Sync.Server.Socket): Promise<string> => {
  return socket.remoteQueueList.list_sync_get_md5()
}

// const getLocalListData = async(socket: LX.Sync.Server.Socket): Promise<LX.Sync.List.ListData> => {
//   return getUserSpace(socket.userInfo.name).listManage.getListData()
// }
const getSyncMode = async(socket: LX.Sync.Server.Socket): Promise<LX.Sync.List.SyncMode> => new Promise((resolve, reject) => {
  const handleDisconnect = (err: Error) => {
    sendCloseSelectMode()
    removeSelectModeListener()
    reject(err)
  }
  let removeEventClose = socket.onClose(handleDisconnect)
  sendSelectMode(socket.keyInfo.deviceName, 'list', (mode) => {
    if (mode == null) {
      reject(new Error('cancel'))
      return
    }
    resolve(mode)
    removeSelectModeListener()
    removeEventClose()
  })
})
// const getSyncMode = async(socket: LX.Sync.Server.Socket): Promise<LX.Sync.List.SyncMode> => {
//   return socket.remoteQueueList.list_sync_get_sync_mode()
// }

const finishedSync = async(socket: LX.Sync.Server.Socket) => {
  await socket.remoteQueueList.list_sync_finished()
}


const setLocalList = async(socket: LX.Sync.Server.Socket, listData: LX.Sync.List.ListData) => {
  await setLocalListData(listData)
  const userSpace = getUserSpace(socket.userInfo.name)
  return userSpace.listManage.createSnapshot()
}

const overwriteRemoteListData = async(socket: LX.Sync.Server.Socket, listData: LX.Sync.List.ListData, key: string, excludeIds: string[] = []) => {
  const action = { action: 'list_data_overwrite', data: listData } as const
  const tasks: Array<Promise<void>> = []
  const userSpace = getUserSpace(socket.userInfo.name)
  socket.broadcast((client) => {
    if (excludeIds.includes(client.keyInfo.clientId) || client.userInfo.name != socket.userInfo.name || !client.moduleReadys?.list) return
    tasks.push(client.remoteQueueList.onListSyncAction(action).then(async() => {
      return userSpace.listManage.updateDeviceSnapshotKey(client.keyInfo.clientId, key)
    }).catch(err => {
      // TODO send status
      client.close(SYNC_CLOSE_CODE.failed)
      // client.moduleReadys.list = false
      console.log(err.message)
    }))
  })
  if (!tasks.length) return
  await Promise.all(tasks)
}
const setRemotelList = async(socket: LX.Sync.Server.Socket, listData: LX.Sync.List.ListData, key: string): Promise<void> => {
  await socket.remoteQueueList.list_sync_set_list_data(listData)
  const userSpace = getUserSpace(socket.userInfo.name)
  await userSpace.listManage.updateDeviceSnapshotKey(socket.keyInfo.clientId, key)
}

type UserDataObj = Map<string, LX.List.UserListInfoFull>
const createUserListDataObj = (listData: LX.Sync.List.ListData): UserDataObj => {
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
const mergeList = (socket: LX.Sync.Server.Socket, sourceListData: LX.Sync.List.ListData, targetListData: LX.Sync.List.ListData): LX.Sync.List.ListData => {
  const addMusicLocationType = getUserConfig(socket.userInfo.name)['list.addMusicLocationType']
  const newListData: LX.Sync.List.ListData = {
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
const overwriteList = (sourceListData: LX.Sync.List.ListData, targetListData: LX.Sync.List.ListData): LX.Sync.List.ListData => {
  const newListData: LX.Sync.List.ListData = {
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

const handleMergeListData = async(socket: LX.Sync.Server.Socket): Promise<[LX.Sync.List.ListData, boolean, boolean]> => {
  const mode: LX.Sync.List.SyncMode = await getSyncMode(socket)

  if (mode == 'cancel') throw new Error('cancel')
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalListData()])
  console.log('handleMergeListData', 'remoteListData, localListData')
  let listData: LX.Sync.List.ListData
  let requiredUpdateLocalListData = true
  let requiredUpdateRemoteListData = true
  switch (mode) {
    case 'merge_local_remote':
      listData = mergeList(socket, localListData, remoteListData)
      break
    case 'merge_remote_local':
      listData = mergeList(socket, remoteListData, localListData)
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
    default: throw new Error('cancel')
  }
  return [listData, requiredUpdateLocalListData, requiredUpdateRemoteListData]
}

const handleSyncList = async(socket: LX.Sync.Server.Socket) => {
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalListData()])
  console.log('handleSyncList', 'remoteListData, localListData')
  console.log('localListData', localListData.defaultList.length || localListData.loveList.length || localListData.userList.length)
  console.log('remoteListData', remoteListData.defaultList.length || remoteListData.loveList.length || remoteListData.userList.length)
  const userSpace = getUserSpace(socket.userInfo.name)
  const clientId = socket.keyInfo.clientId
  if (localListData.defaultList.length || localListData.loveList.length || localListData.userList.length) {
    if (remoteListData.defaultList.length || remoteListData.loveList.length || remoteListData.userList.length) {
      const [mergedList, requiredUpdateLocalListData, requiredUpdateRemoteListData] = await handleMergeListData(socket)
      console.log('handleMergeListData', 'mergedList', requiredUpdateLocalListData, requiredUpdateRemoteListData)
      let key
      if (requiredUpdateLocalListData) {
        key = await setLocalList(socket, mergedList)
        await overwriteRemoteListData(socket, mergedList, key, [clientId])
        if (!requiredUpdateRemoteListData) await userSpace.listManage.updateDeviceSnapshotKey(clientId, key)
      }
      if (requiredUpdateRemoteListData) {
        if (!key) key = await userSpace.listManage.getCurrentListInfoKey()
        await setRemotelList(socket, mergedList, key)
      }
    } else {
      await setRemotelList(socket, localListData, await userSpace.listManage.getCurrentListInfoKey())
    }
  } else {
    let key: string
    if (remoteListData.defaultList.length || remoteListData.loveList.length || remoteListData.userList.length) {
      key = await setLocalList(socket, remoteListData)
      await overwriteRemoteListData(socket, remoteListData, key, [clientId])
    }
    key ??= await userSpace.listManage.getCurrentListInfoKey()
    await userSpace.listManage.updateDeviceSnapshotKey(clientId, key)
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
  const userSpace = getUserSpace(socket.userInfo.name)
  const userCurrentListInfoKey = await userSpace.listManage.getDeviceCurrentSnapshotKey(socket.keyInfo.clientId)
  const currentListInfoKey = await userSpace.listManage.getCurrentListInfoKey()
  const latest = remoteListMD5 == currentListInfoKey
  if (latest && userCurrentListInfoKey != currentListInfoKey) await userSpace.listManage.updateDeviceSnapshotKey(socket.keyInfo.clientId, currentListInfoKey)
  return latest
}
const selectData = <T>(snapshot: T | null, local: T, remote: T): T => {
  return snapshot == local
    ? remote
    // ? (snapshot == remote ? snapshot as T : remote)
    : local
}
const handleMergeListDataFromSnapshot = async(socket: LX.Sync.Server.Socket, snapshot: LX.Sync.List.ListData) => {
  if (await checkListLatest(socket)) return

  const addMusicLocationType = getUserConfig(socket.userInfo.name)['list.addMusicLocationType']
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalListData()])
  const newListData: LX.Sync.List.ListData = {
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
      const snapshotList = snapshotUserListData.get(list.id) ?? { name: null, source: null, sourceListId: null, list: [] }
      newList = buildUserListInfoFull({
        id: list.id,
        name: selectData(snapshotList.name, list.name, remoteList.name),
        source: selectData(snapshotList.source, list.source, remoteList.source),
        sourceListId: selectData(snapshotList.sourceListId, list.sourceListId, remoteList.sourceListId),
        locationUpdateTime: list.locationUpdateTime,
        list: mergeListDataFromSnapshot(list.list, remoteList.list, snapshotList.list, addMusicLocationType),
      })
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
  const key = await setLocalList(socket, newListData)
  const err = await setRemotelList(socket, newListData, key).catch(err => err)
  await overwriteRemoteListData(socket, newListData, key, [socket.keyInfo.clientId])
  if (err) throw err
}

const syncList = async(socket: LX.Sync.Server.Socket) => {
  // socket.data.snapshotFilePath = getSnapshotFilePath(socket.keyInfo)
  // console.log(socket.keyInfo)
  if (!socket.feature.list) throw new Error('list feature options not available')
  if (!socket.feature.list.skipSnapshot) {
    const user = getUserSpace(socket.userInfo.name)
    const userCurrentListInfoKey = await user.listManage.getDeviceCurrentSnapshotKey(socket.keyInfo.clientId)
    if (userCurrentListInfoKey) {
      const listData = await user.listManage.snapshotDataManage.getSnapshot(userCurrentListInfoKey)
      if (listData) {
        console.log('handleMergeListDataFromSnapshot')
        await handleMergeListDataFromSnapshot(socket, listData)
        return
      }
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
//     return finishedSync(socket)
//   }).finally(() => {
//     syncingId = null
//   })
// }

// const removeSnapshot = async(keyInfo: LX.Sync.KeyInfo) => {
//   const filePath = getSnapshotFilePath(keyInfo)
//   await fsPromises.unlink(filePath)
// }

export const sync = async(socket: LX.Sync.Server.Socket) => {
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
    await finishedSync(socket)
    socket.moduleReadys.list = true
  }).finally(() => {
    syncingId = null
  })
}
