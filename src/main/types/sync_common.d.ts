declare namespace LX {
  namespace Sync {
    type ServerSyncActions = WarpPromiseRecord<{
      onFeatureChanged: (feature: EnabledFeatures) => void
    }>
    type ServerSyncListActions = WarpPromiseRecord<{
      onListSyncAction: (action: LX.Sync.List.ActionList) => void
    }>

    type ClientSyncActions = WarpPromiseRecord<{
      getEnabledFeatures: (serverType: ServerType, supportedFeatures: SupportedFeatures) => EnabledFeatures
      finished: () => void
    }>
    type ClientSyncListActions = WarpPromiseRecord<{
      onListSyncAction: (action: LX.Sync.List.ActionList) => void
      list_sync_get_md5: () => string
      list_sync_get_sync_mode: () => LX.Sync.List.SyncMode
      list_sync_get_list_data: () => LX.Sync.List.ListData
      list_sync_set_list_data: (data: LX.Sync.List.ListData) => void
      list_sync_finished: () => void
    }>
  }
}


