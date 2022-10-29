// import { throttle } from '@common/utils/common'
import { Server } from 'socket.io'
// import { sendSyncActionList } from '@main/modules/winMain'
import { encryptMsg, decryptMsg } from '../server/utils'

let io: Server | null
let removeListener: (() => void) | null

type listAction = 'list:action'

const handleListAction = ({ action, data }: LX.Sync.ActionList) => {
  // console.log(action, data)

  switch (action) {
    case 'list_data_overwrite':
      void global.lx.event_list.list_data_overwrite(data, true)
      break
    case 'list_create':
      void global.lx.event_list.list_create(data.position, data.listInfos, true)
      break
    case 'list_remove':
      void global.lx.event_list.list_remove(data, true)
      break
    case 'list_update':
      void global.lx.event_list.list_update(data, true)
      break
    case 'list_update_position':
      void global.lx.event_list.list_update_position(data.position, data.ids, true)
      break
    case 'list_music_add':
      void global.lx.event_list.list_music_add(data.id, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_move':
      void global.lx.event_list.list_music_move(data.fromId, data.toId, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_remove':
      void global.lx.event_list.list_music_remove(data.listId, data.ids, true)
      break
    case 'list_music_update':
      void global.lx.event_list.list_music_update(data, true)
      break
    case 'list_music_update_position':
      void global.lx.event_list.list_music_update_position(data.listId, data.position, data.ids, true)
      break
    case 'list_music_overwrite':
      void global.lx.event_list.list_music_overwrite(data.listId, data.musicInfos, true)
      break
    case 'list_music_clear':
      void global.lx.event_list.list_music_clear(data, true)
      break
    default:
      break
  }
}

const registerListActionEvent = () => {
  const list_data_overwrite = async(listData: MakeOptional<LX.List.ListDataFull, 'tempList'>, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_data_overwrite', listData)
  }
  const list_create = async(position: number, lists: LX.List.UserListInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_create', { position, lists })
  }
  const list_remove = async(ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_remove', ids)
  }
  const list_update = async(lists: LX.List.UserListInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_update', lists)
  }
  const list_update_position = async(position: number, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_update_position', { position, ids })
  }
  const list_music_overwrite = async(listId: string, musicInfos: LX.Music.MusicInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_music_overwrite', { listId, musicInfos })
  }
  const list_music_add = async(listId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_music_add', { listId, musicInfos, addMusicLocationType })
  }
  const list_music_move = async(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_music_move', { fromId, toId, musicInfos, addMusicLocationType })
  }
  const list_music_remove = async(listId: string, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_music_remove', { listId, ids })
  }
  const list_music_update = async(musicInfos: LX.List.ListActionMusicUpdate, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_music_update', musicInfos)
  }
  const list_music_clear = async(listId: string, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_music_clear', listId)
  }
  const list_music_update_position = async(listId: string, position: number, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction('list_music_update_position', { listId, position, ids })
  }
  global.lx.event_list.on('list_data_overwrite', list_data_overwrite)
  global.lx.event_list.on('list_create', list_create)
  global.lx.event_list.on('list_remove', list_remove)
  global.lx.event_list.on('list_update', list_update)
  global.lx.event_list.on('list_update_position', list_update_position)
  global.lx.event_list.on('list_music_overwrite', list_music_overwrite)
  global.lx.event_list.on('list_music_add', list_music_add)
  global.lx.event_list.on('list_music_move', list_music_move)
  global.lx.event_list.on('list_music_remove', list_music_remove)
  global.lx.event_list.on('list_music_update', list_music_update)
  global.lx.event_list.on('list_music_clear', list_music_clear)
  global.lx.event_list.on('list_music_update_position', list_music_update_position)
  return () => {
    global.lx.event_list.off('list_data_overwrite', list_data_overwrite)
    global.lx.event_list.off('list_create', list_create)
    global.lx.event_list.off('list_remove', list_remove)
    global.lx.event_list.off('list_update', list_update)
    global.lx.event_list.off('list_update_position', list_update_position)
    global.lx.event_list.off('list_music_overwrite', list_music_overwrite)
    global.lx.event_list.off('list_music_add', list_music_add)
    global.lx.event_list.off('list_music_move', list_music_move)
    global.lx.event_list.off('list_music_remove', list_music_remove)
    global.lx.event_list.off('list_music_update', list_music_update)
    global.lx.event_list.off('list_music_clear', list_music_clear)
    global.lx.event_list.off('list_music_update_position', list_music_update_position)
  }
}

// const addMusic = (orderId, callback) => {
//   // ...
// }

const broadcast = async(action: listAction, data: any, excludeIds: string[] = []) => {
  if (!io) return
  const sockets: LX.Sync.RemoteSocket[] = await io.fetchSockets()
  for (const socket of sockets) {
    if (excludeIds.includes(socket.data.keyInfo.clientId)) continue
    socket.emit(action, encryptMsg(socket.data.keyInfo, data))
  }
}

export const sendListAction = async(action: string, data: any) => {
  // io.sockets
  return await broadcast('list:action', JSON.stringify({ action, data }))
}

export const registerListHandler = (_io: Server, socket: LX.Sync.Socket) => {
  io = _io
  socket.on('list:action', msg => {
    // console.log(msg)
    msg = decryptMsg(socket.data.keyInfo, msg)
    if (!msg) return
    handleListAction(JSON.parse(msg))
    void broadcast('list:action', msg, [socket.data.keyInfo.clientId])
    // socket.broadcast.emit('list:action', { action: 'list_remove', data: { id: 'default', index: 0 } })
  })

  removeListener = registerListActionEvent()
  // socket.on('list:add', addMusic)
}
export const unregisterListHandler = () => {
  io = null

  if (removeListener) {
    removeListener()
    removeListener = null
  }
}
