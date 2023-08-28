declare namespace LX {

  namespace Sync {
    namespace List {
      interface ListInfo {
        lastSyncDate?: number
        snapshotKey: string
      }

      type ActionList = LX.Sync.SyncAction<'list_data_overwrite', LX.List.ListActionDataOverwrite>
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

      type ListData = Omit<LX.List.ListDataFull, 'tempList'>
      type SyncMode = 'merge_local_remote'
      | 'merge_remote_local'
      | 'overwrite_local_remote'
      | 'overwrite_remote_local'
      | 'overwrite_local_remote_full'
      | 'overwrite_remote_local_full'
      // | 'none'
      | 'cancel'
    }
  }
}
