import { modules } from '../../modules'

export const registerLocalSyncEvent = async(wss: LX.Sync.Server.SocketServer) => {
  unregisterLocalSyncEvent()
  for (const module of Object.values(modules)) {
    module.registerEvent(wss)
  }
}

export const unregisterLocalSyncEvent = () => {
  for (const module of Object.values(modules)) {
    module.unregisterEvent()
  }
}
