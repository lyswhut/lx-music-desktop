import { registerListActionEvent } from '../../../../utils'
import { getUserSpace } from '../../../user'

// let socket: LX.Sync.Server.Socket | null
let unregisterLocalListAction: (() => void) | null


const sendListAction = async(wss: LX.Sync.Server.SocketServer, action: LX.Sync.List.ActionList) => {
  // console.log('sendListAction', action.action)
  const userSpace = getUserSpace()
  const key = await userSpace.listManage.createSnapshot()
  for (const client of wss.clients) {
    if (!client.moduleReadys?.list) continue
    void client.remoteQueueList.onListSyncAction(action).then(() => {
      void userSpace.listManage.updateDeviceSnapshotKey(client.keyInfo.clientId, key)
    })
  }
}

export const registerEvent = (wss: LX.Sync.Server.SocketServer) => {
  // socket = _socket
  // socket.onClose(() => {
  //   unregisterLocalListAction?.()
  //   unregisterLocalListAction = null
  // })
  unregisterEvent()
  unregisterLocalListAction = registerListActionEvent((action) => {
    void sendListAction(wss, action)
  })
}

export const unregisterEvent = () => {
  unregisterLocalListAction?.()
  unregisterLocalListAction = null
}
