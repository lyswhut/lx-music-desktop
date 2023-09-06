// import { SYNC_CLOSE_CODE } from '../../../../constants'
import { removeSelectModeListener, sendCloseSelectMode, sendSelectMode } from '@main/modules/winMain'
import { getUserSpace } from '../../../user'
import { getLocalDislikeData, setLocalDislikeData } from '@main/modules/sync/dislikeEvent'
import { SYNC_CLOSE_CODE } from '@common/constants_sync'
import { filterRules } from '../utils'
// import { LIST_IDS } from '@common/constants'

// type ListInfoType = LX.Dislike.UserListInfoFull | LX.Dislike.MyDefaultListInfoFull | LX.Dislike.MyLoveListInfoFull

// let wss: LX.Sync.Server.SocketServer | null
let syncingId: string | null = null
const wait = async(time = 1000) => await new Promise((resolve, reject) => setTimeout(resolve, time))


const getRemoteListData = async(socket: LX.Sync.Server.Socket): Promise<LX.Dislike.DislikeRules> => {
  console.log('getRemoteListData')
  return (await socket.remoteQueueDislike.dislike_sync_get_list_data()) ?? ''
}

const getRemoteDataMD5 = async(socket: LX.Sync.Server.Socket): Promise<string> => {
  return socket.remoteQueueDislike.dislike_sync_get_md5()
}

// const getLocalDislikeData  async(socket: LX.Sync.Server.Socket): Promise<LX.Sync.Dislike.ListData> => {
//   return getUserSpace(socket.userInfo.name).dislikeManage.getListData()
// }
const getSyncMode = async(socket: LX.Sync.Server.Socket): Promise<LX.Sync.Dislike.SyncMode> => new Promise((resolve, reject) => {
  const handleDisconnect = (err: Error) => {
    sendCloseSelectMode()
    removeSelectModeListener()
    reject(err)
  }
  let removeEventClose = socket.onClose(handleDisconnect)
  sendSelectMode(socket.keyInfo.deviceName, 'dislike', (mode) => {
    if (mode == null) {
      reject(new Error('cancel'))
      return
    }
    resolve(mode)
    removeSelectModeListener()
    removeEventClose()
  })
})
// const getSyncMode = async(socket: LX.Sync.Server.Socket): Promise<LX.Sync.Dislike.SyncMode> => {
//   return socket.remoteQueueDislike.list_sync_get_sync_mode()
// }

const finishedSync = async(socket: LX.Sync.Server.Socket) => {
  await socket.remoteQueueDislike.dislike_sync_finished()
}


const setLocalList = async(socket: LX.Sync.Server.Socket, listData: LX.Dislike.DislikeRules) => {
  await setLocalDislikeData(listData)
  const userSpace = getUserSpace(socket.userInfo.name)
  return userSpace.dislikeManage.createSnapshot()
}

const overwriteRemoteListData = async(socket: LX.Sync.Server.Socket, listData: LX.Dislike.DislikeRules, key: string, excludeIds: string[] = []) => {
  const action = { action: 'dislike_data_overwrite', data: listData } as const
  const tasks: Array<Promise<void>> = []
  const userSpace = getUserSpace(socket.userInfo.name)
  socket.broadcast((client) => {
    if (excludeIds.includes(client.keyInfo.clientId) || client.userInfo?.name != socket.userInfo.name || !client.moduleReadys?.dislike) return
    tasks.push(client.remoteQueueDislike.onDislikeSyncAction(action).then(async() => {
      return userSpace.dislikeManage.updateDeviceSnapshotKey(client.keyInfo.clientId, key)
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
const setRemotelList = async(socket: LX.Sync.Server.Socket, listData: LX.Dislike.DislikeRules, key: string): Promise<void> => {
  await socket.remoteQueueDislike.dislike_sync_set_list_data(listData)
  const userSpace = getUserSpace(socket.userInfo.name)
  await userSpace.dislikeManage.updateDeviceSnapshotKey(socket.keyInfo.clientId, key)
}


const mergeList = (socket: LX.Sync.Server.Socket, sourceListData: LX.Dislike.DislikeRules, targetListData: LX.Dislike.DislikeRules): LX.Dislike.DislikeRules => {
  return Array.from(filterRules(sourceListData + '\n' + targetListData)).join('\n')
}

const handleMergeListData = async(socket: LX.Sync.Server.Socket): Promise<[LX.Dislike.DislikeRules, boolean, boolean]> => {
  const mode: LX.Sync.Dislike.SyncMode = await getSyncMode(socket)

  if (mode == 'cancel') throw new Error('cancel')
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalDislikeData()])
  console.log('handleMergeListData', 'remoteListData, localListData')
  let listData: LX.Dislike.DislikeRules
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
      listData = localListData
      requiredUpdateLocalListData = false
      break
    case 'overwrite_remote_local':
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
  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalDislikeData()])
  console.log('handleSyncList', 'remoteListData, localListData')
  console.log('localListData', localListData.length)
  console.log('remoteListData', remoteListData.length)
  const userSpace = getUserSpace(socket.userInfo.name)
  const clientId = socket.keyInfo.clientId
  if (localListData.length) {
    if (remoteListData.length) {
      const [mergedList, requiredUpdateLocalListData, requiredUpdateRemoteListData] = await handleMergeListData(socket)
      console.log('handleMergeListData', 'mergedList', requiredUpdateLocalListData, requiredUpdateRemoteListData)
      let key
      if (requiredUpdateLocalListData) {
        key = await setLocalList(socket, mergedList)
        await overwriteRemoteListData(socket, mergedList, key, [clientId])
        if (!requiredUpdateRemoteListData) await userSpace.dislikeManage.updateDeviceSnapshotKey(clientId, key)
      }
      if (requiredUpdateRemoteListData) {
        if (!key) key = await userSpace.dislikeManage.getCurrentListInfoKey()
        await setRemotelList(socket, mergedList, key)
      }
    } else {
      await setRemotelList(socket, localListData, await userSpace.dislikeManage.getCurrentListInfoKey())
    }
  } else {
    let key: string
    if (remoteListData.length) {
      key = await setLocalList(socket, remoteListData)
      await overwriteRemoteListData(socket, remoteListData, key, [clientId])
    }
    key ??= await userSpace.dislikeManage.getCurrentListInfoKey()
    await userSpace.dislikeManage.updateDeviceSnapshotKey(clientId, key)
  }
}

const mergeDataFromSnapshot = (
  sourceList: LX.Dislike.DislikeRules,
  targetList: LX.Dislike.DislikeRules,
  snapshotList: LX.Dislike.DislikeRules,
): LX.Dislike.DislikeRules => {
  const removedRules = new Set<string>()
  const sourceRules = filterRules(sourceList)
  const targetRules = filterRules(targetList)

  if (snapshotList) {
    const snapshotRules = filterRules(snapshotList)
    for (const m of snapshotRules.values()) {
      if (!sourceRules.has(m) || !targetRules.has(m)) removedRules.add(m)
    }
  }
  return Array.from(new Set(Array.from([...sourceRules, ...targetRules]).filter((rule) => {
    return !removedRules.has(rule)
  }))).join('\n')
}
const checkListLatest = async(socket: LX.Sync.Server.Socket) => {
  const remoteListMD5 = await getRemoteDataMD5(socket)
  const userSpace = getUserSpace(socket.userInfo.name)
  const userCurrentListInfoKey = await userSpace.dislikeManage.getDeviceCurrentSnapshotKey(socket.keyInfo.clientId)
  const currentListInfoKey = await userSpace.dislikeManage.getCurrentListInfoKey()
  const latest = remoteListMD5 == currentListInfoKey
  if (latest && userCurrentListInfoKey != currentListInfoKey) await userSpace.dislikeManage.updateDeviceSnapshotKey(socket.keyInfo.clientId, currentListInfoKey)
  return latest
}

const handleMergeListDataFromSnapshot = async(socket: LX.Sync.Server.Socket, snapshot: LX.Dislike.DislikeRules) => {
  if (await checkListLatest(socket)) return

  const [remoteListData, localListData] = await Promise.all([getRemoteListData(socket), getLocalDislikeData()])
  const newDislikeData = mergeDataFromSnapshot(localListData, remoteListData, snapshot)

  const key = await setLocalList(socket, newDislikeData)
  const err = await setRemotelList(socket, newDislikeData, key).catch(err => err)
  await overwriteRemoteListData(socket, newDislikeData, key, [socket.keyInfo.clientId])
  if (err) throw err
}

const syncDislike = async(socket: LX.Sync.Server.Socket) => {
  // socket.data.snapshotFilePath = getSnapshotFilePath(socket.keyInfo)
  // console.log(socket.keyInfo)
  if (!socket.feature.dislike) throw new Error('dislike feature options not available')
  if (!socket.feature.dislike.skipSnapshot) {
    const user = getUserSpace(socket.userInfo.name)
    const userCurrentDislikeInfoKey = await user.dislikeManage.getDeviceCurrentSnapshotKey(socket.keyInfo.clientId)
    if (userCurrentDislikeInfoKey) {
      const listData = await user.dislikeManage.snapshotDataManage.getSnapshot(userCurrentDislikeInfoKey)
      if (listData) {
        console.log('handleMergeDislikeDataFromSnapshot')
        await handleMergeListDataFromSnapshot(socket, listData)
        return
      }
    }
  }
  await handleSyncList(socket)
}

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
  await syncDislike(socket).then(async() => {
    await finishedSync(socket)
    socket.moduleReadys.dislike = true
  }).finally(() => {
    syncingId = null
  })
}
