import { updateDeviceSnapshotKey } from '@main/modules/sync/data'
import { registerListActionEvent } from '../../../utils'
import { getCurrentListInfoKey } from '../../utils'

// let socket: LX.Sync.Server.Socket | null
let unregisterLocalListAction: (() => void) | null


const sendListAction = async(wss: LX.Sync.Server.SocketServer, action: LX.Sync.ActionList) => {
  // console.log('sendListAction', action.action)
  const key = await getCurrentListInfoKey()
  for (const client of wss.clients) {
    if (!client.isReady) return
    void client.remoteSyncList.onListSyncAction(action).then(() => {
      updateDeviceSnapshotKey(client.keyInfo, key)
    })
  }
}

export const registerEvent = (wss: LX.Sync.Server.SocketServer) => {
  // socket = _socket
  // socket.onClose(() => {
  //   unregisterLocalListAction?.()
  //   unregisterLocalListAction = null
  // })
  unregisterLocalListAction = registerListActionEvent((action) => {
    void sendListAction(wss, action)
  })
}

export const unregisterEvent = () => {
  unregisterLocalListAction?.()
  unregisterLocalListAction = null
}
