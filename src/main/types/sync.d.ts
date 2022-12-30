import { Socket as _Socket, RemoteSocket as _RemoteSocket } from 'socket.io'

type DefaultEventsMap = Record<string, (...args: any[]) => void>


declare global {
  namespace LX {
    namespace Sync {
      class Socket extends _Socket {
        data: SocketData
      }
      class RemoteSocket extends _RemoteSocket<DefaultEventsMap, any> {
        readonly data: SocketData
      }
      interface Data {
        action: string
        data: any
      }
      interface SocketData {
        snapshotFilePath: string
        isCreatedSnapshot: boolean
        keyInfo: KeyInfo
        isReady: boolean
      }
      type Action = 'list:sync'
      type ListAction = 'getData' | 'finished'
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

