// 这个文件导出的方法将暴露给服务端调用，第一个参数固定为当前 socket 对象
import {
  handleRemoteListAction,
  getLocalListData,
  setLocalListData,
} from '@main/modules/sync/listEvent'
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
const getSyncMode = async(socket: LX.Sync.Client.Socket): Promise<LX.Sync.List.SyncMode> => new Promise((resolve, reject) => {
  const handleDisconnect = (err: Error) => {
    sendCloseSelectMode()
    removeSelectModeListener()
    reject(err)
  }
  let removeEventClose = socket.onClose(handleDisconnect)
  sendSelectMode(socket.data.keyInfo.serverName, 'list', (mode) => {
    if (mode == null) {
      reject(new Error('cancel'))
      return
    }
    resolve(mode)
    removeSelectModeListener()
    removeEventClose()
  })
})

const handler: LX.Sync.ClientSyncHandlerListActions<LX.Sync.Client.Socket> = {
  async onListSyncAction(socket, action) {
    if (!socket.moduleReadys?.list) return
    await handleRemoteListAction(action)
  },

  async list_sync_get_md5(socket) {
    logInfo('list:sync:list_sync_get_md5')
    return toMD5(JSON.stringify(await getLocalListData()))
  },


  async list_sync_get_sync_mode(socket) {
    return getSyncMode(socket)
  },

  async list_sync_get_list_data(socket) {
    logInfo('list:sync:list_sync_get_list_data')
    return getLocalListData()
  },

  async list_sync_set_list_data(socket, data) {
    logInfo('list:sync:list_sync_set_list_data')
    await setLocalListData(data)
  },

  async list_sync_finished(socket) {
    logInfo('list:sync:finished')
    socket.moduleReadys.list = true
    registerEvent(socket)
    socket.onClose(() => {
      unregisterEvent()
    })
  },
}

export default handler
