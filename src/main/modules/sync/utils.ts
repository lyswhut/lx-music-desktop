import { createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'node:crypto'
import os, { networkInterfaces } from 'node:os'
import zlib from 'node:zlib'
import cp from 'node:child_process'
import { LIST_IDS } from '@common/constants'


export const getAddress = (): string[] => {
  const nets = networkInterfaces()
  const results: string[] = []
  // console.log(nets)

  for (const interfaceInfos of Object.values(nets)) {
    if (!interfaceInfos) continue
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    for (const interfaceInfo of interfaceInfos) {
      if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
        results.push(interfaceInfo.address)
      }
    }
  }
  return results
}


// https://stackoverflow.com/a/75309339
export const getComputerName = () => {
  let name: string | undefined
  switch (process.platform) {
    case 'win32':
      name = process.env.COMPUTERNAME
      break
    case 'darwin':
      name = cp.execSync('scutil --get ComputerName').toString().trim()
      break
    case 'linux':
      name = cp.execSync('hostnamectl --pretty').toString().trim()
      break
  }
  if (!name) name = os.hostname()
  return name
}

const gzip = async(data: string) => new Promise<string>((resolve, reject) => {
  zlib.gzip(data, (err, buf) => {
    if (err) {
      reject(err)
      return
    }
    resolve(buf.toString('base64'))
  })
})
const unGzip = async(data: string) => new Promise<string>((resolve, reject) => {
  zlib.gunzip(Buffer.from(data, 'base64'), (err, buf) => {
    if (err) {
      reject(err)
      return
    }
    resolve(buf.toString())
  })
})

export const encodeData = async(data: string) => {
  return data.length > 1024
    ? 'cg_' + await gzip(data)
    : data
}

export const decodeData = async(enData: string) => {
  return enData.substring(0, 3) == 'cg_'
    ? await unGzip(enData.replace('cg_', ''))
    : enData
}


export const aesEncrypt = (text: string, key: string) => {
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]).toString('base64')
}

export const aesDecrypt = (text: string, key: string) => {
  const decipher = createDecipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
}

export const rsaEncrypt = (buffer: Buffer, key: string): string => {
  return publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer).toString('base64')
}
export const rsaDecrypt = (buffer: Buffer, key: string): Buffer => {
  return privateDecrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer)
}

export const getLocalListData = async(): Promise<LX.Sync.List.ListData> => {
  const lists: LX.Sync.List.ListData = {
    defaultList: await global.lx.worker.dbService.getListMusics(LIST_IDS.DEFAULT),
    loveList: await global.lx.worker.dbService.getListMusics(LIST_IDS.LOVE),
    userList: [],
  }

  const userListInfos = await global.lx.worker.dbService.getAllUserList()
  for await (const list of userListInfos) {
    lists.userList.push(await global.lx.worker.dbService.getListMusics(list.id)
      .then(musics => ({ ...list, list: musics })))
  }

  return lists
}

export const setLocalListData = async(listData: LX.Sync.List.ListData) => {
  await global.lx.event_list.list_data_overwrite(listData, true)
}


export const registerListActionEvent = (sendListAction: (action: LX.Sync.List.ActionList) => (void | Promise<void>)) => {
  const list_data_overwrite = async(listData: MakeOptional<LX.List.ListDataFull, 'tempList'>, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_data_overwrite', data: listData })
  }
  const list_create = async(position: number, listInfos: LX.List.UserListInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_create', data: { position, listInfos } })
  }
  const list_remove = async(ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_remove', data: ids })
  }
  const list_update = async(lists: LX.List.UserListInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_update', data: lists })
  }
  const list_update_position = async(position: number, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_update_position', data: { position, ids } })
  }
  const list_music_overwrite = async(listId: string, musicInfos: LX.Music.MusicInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_overwrite', data: { listId, musicInfos } })
  }
  const list_music_add = async(id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_add', data: { id, musicInfos, addMusicLocationType } })
  }
  const list_music_move = async(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_move', data: { fromId, toId, musicInfos, addMusicLocationType } })
  }
  const list_music_remove = async(listId: string, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_remove', data: { listId, ids } })
  }
  const list_music_update = async(musicInfos: LX.List.ListActionMusicUpdate, isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_update', data: musicInfos })
  }
  const list_music_clear = async(ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_clear', data: ids })
  }
  const list_music_update_position = async(listId: string, position: number, ids: string[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendListAction({ action: 'list_music_update_position', data: { listId, position, ids } })
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

export const handleRemoteListAction = async({ action, data }: LX.Sync.List.ActionList) => {
  // console.log('handleRemoteListAction', action)

  switch (action) {
    case 'list_data_overwrite':
      await global.lx.event_list.list_data_overwrite(data, true)
      break
    case 'list_create':
      await global.lx.event_list.list_create(data.position, data.listInfos, true)
      break
    case 'list_remove':
      await global.lx.event_list.list_remove(data, true)
      break
    case 'list_update':
      await global.lx.event_list.list_update(data, true)
      break
    case 'list_update_position':
      await global.lx.event_list.list_update_position(data.position, data.ids, true)
      break
    case 'list_music_add':
      await global.lx.event_list.list_music_add(data.id, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_move':
      await global.lx.event_list.list_music_move(data.fromId, data.toId, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_remove':
      await global.lx.event_list.list_music_remove(data.listId, data.ids, true)
      break
    case 'list_music_update':
      await global.lx.event_list.list_music_update(data, true)
      break
    case 'list_music_update_position':
      await global.lx.event_list.list_music_update_position(data.listId, data.position, data.ids, true)
      break
    case 'list_music_overwrite':
      await global.lx.event_list.list_music_overwrite(data.listId, data.musicInfos, true)
      break
    case 'list_music_clear':
      await global.lx.event_list.list_music_clear(data, true)
      break
    default:
      throw new Error('unknown list sync action')
  }
}
