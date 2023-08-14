// import { throttle } from '@common/utils/common'
// import { sendSyncActionList } from '@main/modules/winMain'
// import { SYNC_CLOSE_CODE } from '@common/constants'
import { updateDeviceSnapshotKey } from '@main/modules/sync/data'
import { handleRemoteListAction } from '../../../utils'
import { createSnapshot } from '../../utils'

// let wss: LX.Sync.Server.SocketServer | null
// let removeListener: (() => void) | null

// type listAction = 'list:action'

// const addMusic = (orderId, callback) => {
//   // ...
// }

// const broadcast = async(key: string, data: any, excludeIds: string[] = []) => {
//   if (!wss) return
//   const dataStr = JSON.stringify({ action: 'list:sync:action', data })
//   const clients = Array.from(wss.clients).filter(socket => !excludeIds.includes(socket.keyInfo.clientId) && socket.isReady)
//   if (!clients.length) return
//   const enData = await encryptMsg(null, dataStr)
//   for (const socket of clients) {
//     if (excludeIds.includes(socket.keyInfo.clientId) || !socket.isReady) continue
//     socket.send(enData, (err) => {
//       if (err) {
//         socket.close(SYNC_CLOSE_CODE.failed)
//         return
//       }
//       updateDeviceSnapshotKey(socket.keyInfo, key)
//     })
//   }
// }

// const sendListAction = async(action: LX.Sync.ActionList) => {
//   console.log('sendListAction', action.action)
//   // io.sockets
//   await broadcast(await getCurrentListInfoKey(), action)
// }

// export const registerListHandler = (_wss: LX.Sync.Server.SocketServer, socket: LX.Sync.Server.Socket) => {
//   if (!wss) {
//     wss = _wss
//     removeListener = registerListActionEvent(sendListAction)
//   }

//   socket.onRemoteEvent('list:sync:action', (action) => {
//     if (!socket.isReady) return
//     // console.log(msg)
//     void handleRemoteListAction(action).then(updated => {
//       if (!updated) return
//       void createSnapshot().then(key => {
//         if (!key) return
//         updateDeviceSnapshotKey(socket.keyInfo, key)
//         void broadcast(key, action, [socket.keyInfo.clientId])
//       })
//     })
//     // socket.broadcast.emit('list:action', { action: 'list_remove', data: { id: 'default', index: 0 } })
//   })

//   // socket.on('list:add', addMusic)
// }
// export const unregisterListHandler = () => {
//   wss = null

//   if (removeListener) {
//     removeListener()
//     removeListener = null
//   }
// }

export const onListSyncAction = async(socket: LX.Sync.Server.Socket, action: LX.Sync.ActionList) => {
  await handleRemoteListAction(action).then(updated => {
    if (!updated) return
    console.log(updated)
    void createSnapshot().then(key => {
      if (!key) return
      updateDeviceSnapshotKey(socket.keyInfo, key)
      const currentId = socket.keyInfo.clientId
      socket.broadcast((client) => {
        if (client.keyInfo.clientId == currentId || !client.isReady) return
        void client.remoteSyncList.onListSyncAction(action)
      })
    })
  })
}
