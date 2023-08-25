declare namespace LX {
  namespace Sync {
      type ServerActions = WarpPromiseRecord<{
        onListSyncAction: (action: LX.List.ActionList) => void
      }>

      type ClientActions = WarpPromiseRecord<{
        onListSyncAction: (action: LX.List.ActionList) => void
        list_sync_get_md5: () => string
        list_sync_get_sync_mode: () => ListSyncMode
        list_sync_get_list_data: () => ListData
        list_sync_set_list_data: (data: ListData) => void
        list_sync_finished: () => void
      }>
  }
}

