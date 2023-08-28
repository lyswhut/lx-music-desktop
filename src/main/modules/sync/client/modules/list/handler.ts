// 这个文件导出的方法将暴露给服务端调用，第一个参数固定为当前 socket 对象
import { handleRemoteListAction } from '@main/modules/sync/utils'
import { getLocalListData, setLocalListData } from '../../../utils'
import { toMD5 } from '@common/utils/nodejs'
import { removeSelectModeListener, sendCloseSelectMode, sendSelectMode } from '@main/modules/winMain'
import log from '@main/modules/sync/log'
import { registerEvent, unregisterEvent } from './localEvent'

const logInfo = (eventName: string, success = false) => {
  log.info(`[${eventName}]${eventName.replace('list:sync:list_sync_', '').replaceAll('_', ' ')}${success ? ' success' : ''}`)
}
// const logError = (eventName: string, err: Error) => {
//   log.error(`[${eventName}]${eventName.replace('list:sync:list_sync_', '').replaceAll('_', ' ')} error: ${err.message}`)
// }

export const onListSyncAction = async(socket: LX.Sync.Client.Socket, action: LX.Sync.List.ActionList) => {
  if (!socket.moduleReadys?.list) return
  await handleRemoteListAction(action)
}

export const list_sync_get_md5 = async(socket: LX.Sync.Client.Socket) => {
  logInfo('list:sync:list_sync_get_md5')
  return toMD5(JSON.stringify(await getLocalListData()))
}

const getSyncMode = async(socket: LX.Sync.Client.Socket): Promise<LX.Sync.List.SyncMode> => new Promise((resolve, reject) => {
  const handleDisconnect = (err: Error) => {
    sendCloseSelectMode()
    removeSelectModeListener()
    reject(err)
  }
  let removeEventClose = socket.onClose(handleDisconnect)
  sendSelectMode(socket.data.keyInfo.serverName, (mode) => {
    if (mode == null) {
      reject(new Error('cancel'))
      return
    }
    resolve(mode)
    removeSelectModeListener()
    removeEventClose()
  })
})
export const list_sync_get_sync_mode = async(socket: LX.Sync.Client.Socket) => {
  return getSyncMode(socket)
}

export const list_sync_get_list_data = async(socket: LX.Sync.Client.Socket) => {
  logInfo('list:sync:list_sync_get_list_data')
  return getLocalListData()
}

export const list_sync_set_list_data = async(socket: LX.Sync.Client.Socket, data: LX.Sync.List.ListData) => {
  logInfo('list:sync:list_sync_set_list_data')
  await setLocalListData(data)
}

export const list_sync_finished = async(socket: LX.Sync.Client.Socket) => {
  logInfo('list:sync:finished')
  socket.moduleReadys.list = true
  registerEvent(socket)
  socket.onClose(() => {
    unregisterEvent()
  })
}

