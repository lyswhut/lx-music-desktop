import { PLAYER_EVENT_NAME } from '@common/ipcNames'

// 发送列表操作事件到渲染进程的注册方法
// 哪个渲染进程需要接收则引入此方法注册
export const registerRendererEvents = (sendEvent: <T = any>(name: string, params?: T | undefined) => void) => {
  const list_data_overwrite = async(listData: LX.List.ListActionDataOverwrite) => {
    sendEvent<LX.List.ListActionDataOverwrite>(PLAYER_EVENT_NAME.list_data_overwire, listData)
  }
  const list_create = async(position: number, listInfos: LX.List.UserListInfo[]) => {
    sendEvent<LX.List.ListActionAdd>(PLAYER_EVENT_NAME.list_add, { position, listInfos })
  }
  const list_remove = async(ids: string[]) => {
    sendEvent<LX.List.ListActionRemove>(PLAYER_EVENT_NAME.list_remove, ids)
  }
  const list_update = async(lists: LX.List.UserListInfo[]) => {
    sendEvent<LX.List.ListActionUpdate>(PLAYER_EVENT_NAME.list_update, lists)
  }
  const list_update_position = async(position: number, ids: string[]) => {
    sendEvent<LX.List.ListActionUpdatePosition>(PLAYER_EVENT_NAME.list_update_position, { position, ids })
  }
  const list_music_add = async(id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType) => {
    sendEvent<LX.List.ListActionMusicAdd>(PLAYER_EVENT_NAME.list_music_add, { id, musicInfos, addMusicLocationType })
  }
  const list_music_move = async(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType) => {
    sendEvent<LX.List.ListActionMusicMove>(PLAYER_EVENT_NAME.list_music_move, { fromId, toId, musicInfos, addMusicLocationType })
  }
  const list_music_remove = async(listId: string, ids: string[]) => {
    sendEvent<LX.List.ListActionMusicRemove>(PLAYER_EVENT_NAME.list_music_remove, { listId, ids })
  }
  const list_music_update = async(musicInfos: LX.List.ListActionMusicUpdate) => {
    sendEvent<LX.List.ListActionMusicUpdate>(PLAYER_EVENT_NAME.list_music_update, musicInfos)
  }
  const list_music_update_position = async(listId: string, position: number, ids: string[]) => {
    sendEvent<LX.List.ListActionMusicUpdatePosition>(PLAYER_EVENT_NAME.list_music_update_position, { listId, position, ids })
  }
  const list_music_overwrite = async(listId: string, musicInfos: LX.Music.MusicInfo[]) => {
    sendEvent<LX.List.ListActionMusicOverwrite>(PLAYER_EVENT_NAME.list_music_overwrite, { listId, musicInfos })
  }
  const list_music_clear = async(ids: string[]) => {
    sendEvent<LX.List.ListActionMusicClear>(PLAYER_EVENT_NAME.list_data_overwire, ids)
  }
  global.lx.event_list.on('list_data_overwrite', list_data_overwrite)
  global.lx.event_list.on('list_create', list_create)
  global.lx.event_list.on('list_remove', list_remove)
  global.lx.event_list.on('list_update', list_update)
  global.lx.event_list.on('list_update_position', list_update_position)
  global.lx.event_list.on('list_music_add', list_music_add)
  global.lx.event_list.on('list_music_move', list_music_move)
  global.lx.event_list.on('list_music_remove', list_music_remove)
  global.lx.event_list.on('list_music_update', list_music_update)
  global.lx.event_list.on('list_music_update_position', list_music_update_position)
  global.lx.event_list.on('list_music_overwrite', list_music_overwrite)
  global.lx.event_list.on('list_music_clear', list_music_clear)

  return () => {
    global.lx.event_list.off('list_data_overwrite', list_data_overwrite)
    global.lx.event_list.off('list_create', list_create)
    global.lx.event_list.off('list_remove', list_remove)
    global.lx.event_list.off('list_update', list_update)
    global.lx.event_list.off('list_update_position', list_update_position)
    global.lx.event_list.off('list_music_add', list_music_add)
    global.lx.event_list.off('list_music_move', list_music_move)
    global.lx.event_list.off('list_music_remove', list_music_remove)
    global.lx.event_list.off('list_music_update', list_music_update)
    global.lx.event_list.off('list_music_update_position', list_music_update_position)
    global.lx.event_list.off('list_music_overwrite', list_music_overwrite)
    global.lx.event_list.off('list_music_clear', list_music_clear)
  }
}
