import { SYNC_CLOSE_CODE } from '@common/constants_sync'
import { registerListActionEvent } from '@main/modules/sync/listEvent'

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
    void socket.remoteQueueList.onListSyncAction(action).catch(err => {
      // TODO send status
      socket.moduleReadys.list = false
      socket.close(SYNC_CLOSE_CODE.failed)
      console.log(err.message)
    })
  })
}

export const unregisterEvent = () => {
  unregisterLocalListAction?.()
  unregisterLocalListAction = null
}
