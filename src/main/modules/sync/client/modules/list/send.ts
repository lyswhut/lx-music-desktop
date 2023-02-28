import { registerListActionEvent } from '@main/modules/sync/utils'

let socket: LX.Sync.Client.Socket | null
let unregisterLocalListAction: (() => void) | null


const sendListAction = (action: LX.Sync.ActionList) => {
  // console.log('sendListAction', action.action)
  if (!socket?.isReady) return
  socket.sendData('list:sync:action', action)
}

export default (_socket: LX.Sync.Client.Socket) => {
  socket = _socket
  socket.onClose(() => {
    socket = null
    unregisterLocalListAction?.()
    unregisterLocalListAction = null
  })
  unregisterLocalListAction = registerListActionEvent(sendListAction)
}
