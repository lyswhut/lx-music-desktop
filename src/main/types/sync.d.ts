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

          onRemoteEvent: <T extends keyof LX.Sync.ActionSyncSendType>(
            eventName: T,
            handler: (data: LX.Sync.ActionSyncSendType[T]) => (void | Promise<void>)
          ) => () => void

          onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void

          sendData: <T extends keyof LX.Sync.ActionSyncType>(
            eventName: T,
            data?: LX.Sync.ActionSyncType[T],
            callback?: (err?: Error) => void
          ) => void
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
          isMobile: boolean
          isReady: boolean
          keyInfo: LX.Sync.ServerKeyInfo

          onRemoteEvent: <T extends keyof LX.Sync.ActionSyncType>(
            eventName: T,
            handler: (data: LX.Sync.ActionSyncType[T]) => void
          ) => () => void

          onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void

          sendData: <T extends keyof LX.Sync.ActionSyncSendType>(
            eventName: T,
            data?: LX.Sync.ActionSyncSendType[T],
            callback?: (err?: Error) => void
          ) => void
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

