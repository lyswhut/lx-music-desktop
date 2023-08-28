import { registerListActionEvent } from '@main/modules/sync/utils'

let unregisterLocalListAction: (() => void) | null

export const registerEvent = (socket: LX.Sync.Client.Socket) => {
  // socket = _socket
  // socket.onClose(() => {
  //   unregisterLocalListAction?.()
  //   unregisterLocalListAction = null
  // })
  unregisterEvent()
  unregisterLocalListAction = registerListActionEvent((action) => {
    if (!socket.moduleReadys?.list) return
    void socket.remoteQueueList.onListSyncAction(action)
  })
}

export const unregisterEvent = () => {
  unregisterLocalListAction?.()
  unregisterLocalListAction = null
}
