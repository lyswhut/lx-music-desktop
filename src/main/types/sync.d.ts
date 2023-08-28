import type WS from 'ws'

type DefaultEventsMap = Record<string, (...args: any[]) => void>


declare global {
  namespace LX {
    namespace Sync {
      namespace Client {
        interface Socket extends WS.WebSocket {
          isReady: boolean
          data: {
            keyInfo: ClientKeyInfo
            urlInfo: UrlInfo
          }
          moduleReadys: {
            list: boolean
          }

          onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void
          remote: LX.Sync.ServerSyncActions
          remoteQueueList: LX.Sync.ServerSyncListActions
        }

        interface UrlInfo {
          wsProtocol: string
          httpProtocol: string
          hostPath: string
          href: string
        }
      }
      namespace Server {
        interface Socket extends WS.WebSocket {
          isAlive?: boolean
          isReady: boolean
          userInfo: { name: 'default' }
          keyInfo: ServerKeyInfo
          feature: LX.Sync.EnabledFeatures
          moduleReadys: {
            list: boolean
          }

          onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void
          broadcast: (handler: (client: Socket) => void) => void

          remote: LX.Sync.ClientSyncActions
          remoteQueueList: LX.Sync.ClientSyncListActions
        }
        type SocketServer = WS.Server<Socket>
      }
    }
  }

  // interface SyncListActionData_none {
  //   action: 'finished'
  // }
  // interface SyncListActionData_getData {
  //   action: 'getData'
  //   data: 'all'
  // }

  // type SyncListActionData = SyncListActionData_none | SyncListActionData_getData
}

