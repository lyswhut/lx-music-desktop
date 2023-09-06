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


    interface ModeTypes {
      list: LX.Sync.List.SyncMode
      dislike: LX.Sync.Dislike.SyncMode
    }

    type ModeType = { [K in keyof ModeTypes]: { type: K, mode: ModeTypes[K] } }[keyof ModeTypes]

    type SyncMainWindowActions = SyncAction<'select_mode', { deviceName: string, type: keyof ModeTypes }>
    | SyncAction<'close_select_mode'>
    | SyncAction<'client_status', ClientStatus>
    | SyncAction<'server_status', ServerStatus>

    type SyncServiceActions = SyncAction<'select_mode', ModeType>
    | SyncAction<'get_server_status'>
    | SyncAction<'get_client_status'>
    | SyncAction<'generate_code'>
    | SyncAction<'enable_server', EnableServer>
    | SyncAction<'enable_client', EnableClient>

    type ServerDevices = ServerKeyInfo[]

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

    interface ListConfig {
      skipSnapshot: boolean
    }
    interface DislikeConfig {
      skipSnapshot: boolean
    }
    type ServerType = 'desktop-app' | 'server'
    interface EnabledFeatures {
      list?: false | ListConfig
      dislike?: false | DislikeConfig
    }
    type SupportedFeatures = Partial<{ [k in keyof EnabledFeatures]: number }>
  }
}
