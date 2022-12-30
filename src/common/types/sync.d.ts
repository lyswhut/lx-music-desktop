declare namespace LX {
  namespace Sync {

    interface Enable {
      enable: boolean
      port: string
    }

    interface SyncActionBase <A> {
      action: A
    }
    interface SyncActionData<A, D> extends SyncActionBase<A> {
      data: D
    }
    type SyncAction<A, D = undefined> = D extends undefined ? SyncActionBase<A> : SyncActionData<A, D>

    type SyncMainWindowActions = SyncAction<'select_mode', KeyInfo>
    | SyncAction<'close_select_mode'>
    | SyncAction<'status', Status>

    type SyncServiceActions = SyncAction<'select_mode', Mode>
    | SyncAction<'get_status'>
    | SyncAction<'generate_code'>
    | SyncAction<'enable', Enable>

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


    interface List {
      action: string
      data: any
    }

    interface Status {
      status: boolean
      message: string
      address: string[]
      code: string
      devices: KeyInfo[]
    }

    interface KeyInfo {
      clientId: string
      key: string
      deviceName: string
      connectionTime?: number
    }

    type ListData = Omit<LX.List.ListDataFull, 'tempList'>

    type Mode = 'merge_local_remote'
    | 'merge_remote_local'
    | 'overwrite_local_remote'
    | 'overwrite_remote_local'
    | 'overwrite_local_remote_full'
    | 'overwrite_remote_local_full'
    | 'none'
    | 'cancel'

  }
}
