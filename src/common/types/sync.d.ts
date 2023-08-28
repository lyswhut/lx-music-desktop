declare namespace LX {
  namespace Sync {

    interface EnableServer {
      enable: boolean
      port: string
    }
    interface EnableClient {
      enable: boolean
      host: string
      authCode?: string
    }

    interface SyncActionBase <A> {
      action: A
    }
    interface SyncActionData<A, D> extends SyncActionBase<A> {
      data: D
    }
    type SyncAction<A, D = undefined> = D extends undefined ? SyncActionBase<A> : SyncActionData<A, D>

    type SyncMainWindowActions = SyncAction<'select_mode', string>
    | SyncAction<'close_select_mode'>
    | SyncAction<'client_status', ClientStatus>
    | SyncAction<'server_status', ServerStatus>

    type SyncServiceActions = SyncAction<'select_mode', LX.Sync.List.SyncMode>
    | SyncAction<'get_server_status'>
    | SyncAction<'get_client_status'>
    | SyncAction<'generate_code'>
    | SyncAction<'enable_server', EnableServer>
    | SyncAction<'enable_client', EnableClient>

    interface ServerStatus {
      status: boolean
      message: string
      address: string[]
      code: string
      devices: ServerKeyInfo[]
    }

    interface ClientStatus {
      status: boolean
      message: string
      address: string[]
    }

    interface ClientKeyInfo {
      clientId: string
      key: string
      serverName: string
    }

    interface ServerKeyInfo {
      clientId: string
      key: string
      deviceName: string
      lastConnectDate?: number
      isMobile: boolean
    }

    type ServerType = 'desktop-app' | 'server'
    interface EnabledFeatures {
      list: boolean
    }
    type SupportedFeatures = Partial<{ [k in keyof EnabledFeatures]: number }>
  }
}
