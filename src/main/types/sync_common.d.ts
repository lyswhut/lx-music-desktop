type WarpSyncHandlerActions<Socket, Actions> = {
  [K in keyof Actions]: (...args: [Socket, ...Parameters<Actions[K]>]) => ReturnType<Actions[K]>
}

declare namespace LX {
  namespace Sync {
    type ServerSyncActions = WarpPromiseRecord<{
      onFeatureChanged: (feature: EnabledFeatures) => void
    }>
    type ServerSyncHandlerActions<Socket> = WarpSyncHandlerActions<Socket, ServerSyncActions>

    type ServerSyncListActions = WarpPromiseRecord<{
      onListSyncAction: (action: LX.Sync.List.ActionList) => void
    }>
    type ServerSyncHandlerListActions<Socket> = WarpSyncHandlerActions<Socket, ServerSyncListActions>

    type ServerSyncDislikeActions = WarpPromiseRecord<{
      onDislikeSyncAction: (action: LX.Sync.Dislike.ActionList) => void
    }>
    type ServerSyncHandlerDislikeActions<Socket> = WarpSyncHandlerActions<Socket, ServerSyncDislikeActions>

    type ClientSyncActions = WarpPromiseRecord<{
      getEnabledFeatures: (serverType: ServerType, supportedFeatures: SupportedFeatures) => EnabledFeatures
      finished: () => void
    }>
    type ClientSyncHandlerActions<Socket> = WarpSyncHandlerActions<Socket, ClientSyncActions>

    type ClientSyncListActions = WarpPromiseRecord<{
      onListSyncAction: (action: LX.Sync.List.ActionList) => void
      list_sync_get_md5: () => string
      list_sync_get_sync_mode: () => LX.Sync.List.SyncMode
      list_sync_get_list_data: () => LX.Sync.List.ListData
      list_sync_set_list_data: (data: LX.Sync.List.ListData) => void
      list_sync_finished: () => void
    }>
    type ClientSyncHandlerListActions<Socket> = WarpSyncHandlerActions<Socket, ClientSyncListActions>

    type ClientSyncDislikeActions = WarpPromiseRecord<{
      onDislikeSyncAction: (action: LX.Sync.Dislike.ActionList) => void
      dislike_sync_get_md5: () => string
      dislike_sync_get_sync_mode: () => LX.Sync.Dislike.SyncMode
      dislike_sync_get_list_data: () => LX.Dislike.DislikeRules
      dislike_sync_set_list_data: (data: LX.Dislike.DislikeRules) => void
      dislike_sync_finished: () => void
    }>
    type ClientSyncHandlerDislikeActions<Socket> = WarpSyncHandlerActions<Socket, ClientSyncDislikeActions>
  }
}


