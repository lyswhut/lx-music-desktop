declare namespace LX {
  namespace Sync {
      type ActionList = SyncAction<'list_data_overwrite', LX.List.ListActionDataOverwrite>
      | SyncAction<'list_create', LX.List.ListActionAdd>
      | SyncAction<'list_remove', LX.List.ListActionRemove>
      | SyncAction<'list_update', LX.List.ListActionUpdate>
      | SyncAction<'list_update_position', LX.List.ListActionUpdatePosition>
      | SyncAction<'list_music_add', LX.List.ListActionMusicAdd>
      | SyncAction<'list_music_move', LX.List.ListActionMusicMove>
      | SyncAction<'list_music_remove', LX.List.ListActionMusicRemove>
      | SyncAction<'list_music_update', LX.List.ListActionMusicUpdate>
      | SyncAction<'list_music_update_position', LX.List.ListActionMusicUpdatePosition>
      | SyncAction<'list_music_overwrite', LX.List.ListActionMusicOverwrite>
      | SyncAction<'list_music_clear', LX.List.ListActionMusicClear>

      type ServerActions = WarpPromiseRecord<{
        onListSyncAction: (action: LX.Sync.ActionList) => void
      }>

      type ClientActions = WarpPromiseRecord<{
        onListSyncAction: (action: LX.Sync.ActionList) => void
        list_sync_get_md5: () => string
        list_sync_get_sync_mode: () => Mode
        list_sync_get_list_data: () => ListData
        list_sync_set_list_data: (data: ListData) => void
        list_sync_finished: () => void
      }>
  }
}

