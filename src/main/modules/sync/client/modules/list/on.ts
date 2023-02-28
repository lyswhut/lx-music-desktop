import { handleRemoteListAction } from '@main/modules/sync/utils'

export default (socket: LX.Sync.Client.Socket) => {
  socket.onRemoteEvent('list:sync:action', (action) => {
    if (!socket.isReady) return
    void handleRemoteListAction(action)
  })
}

