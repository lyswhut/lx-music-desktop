import initOn from './on'
import initSend from './send'

export default (socket: LX.Sync.Client.Socket) => {
  initOn(socket)
  initSend(socket)
}
