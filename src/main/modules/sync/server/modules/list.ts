// import { throttle } from '@common/utils/common'
// import { sendSyncActionList } from '@main/modules/winMain'
import { SYNC_CLOSE_CODE } from '@common/constants'
import { updateDeviceSnapshotKey } from '../../data'
import { handleRemoteListAction, registerListActionEvent } from '../../utils'
import { createSnapshot, encryptMsg, getCurrentListInfoKey } from '../utils'

let wss: LX.Sync.Server.SocketServer | null
let removeListener: (() => void) | null

// type listAction = 'list:action'

// const addMusic = (orderId, callback) => {
//   // ...
// }

const broadcast = async(key: string, data: any, excludeIds: string[] = []) => {
  if (!wss) return
  const dataStr = JSON.stringify({ action: 'list:sync:action', data })
  for (const socket of wss.clients) {
    if (excludeIds.includes(socket.keyInfo.clientId) || !socket.isReady) continue
    socket.send(encryptMsg(socket.keyInfo, dataStr), (err) => {
      if (err) {
        socket.close(SYNC_CLOSE_CODE.failed)
        return
      }
      updateDeviceSnapshotKey(socket.keyInfo, key)
    })
  }
}

const sendListAction = async(action: LX.Sync.ActionList) => {
  console.log('sendListAction', action.action)
  // io.sockets
  await broadcast(await getCurrentListInfoKey(), action)
}

export const registerListHandler = (_wss: LX.Sync.Server.SocketServer, socket: LX.Sync.Server.Socket) => {
  if (!wss) {
    wss = _wss
    removeListener = registerListActionEvent(sendListAction)
  }

  socket.onRemoteEvent('list:sync:action', (action) => {
    if (!socket.isReady) return
    // console.log(msg)
    void handleRemoteListAction(action).then(updated => {
      if (!updated) return
      void createSnapshot().then(key => {
        if (!key) return
        updateDeviceSnapshotKey(socket.keyInfo, key)
        void broadcast(key, action, [socket.keyInfo.clientId])
      })
    })
    // socket.broadcast.emit('list:action', { action: 'list_remove', data: { id: 'default', index: 0 } })
  })

  // socket.on('list:add', addMusic)
}
export const unregisterListHandler = () => {
  wss = null

  if (removeListener) {
    removeListener()
    removeListener = null
  }
}

