// 这个文件导出的方法将暴露给服务端调用，第一个参数固定为当前 socket 对象
import { handleRemoteDislikeAction, getLocalDislikeData, setLocalDislikeData } from '@main/modules/sync/dislikeEvent'
import { toMD5 } from '@common/utils/nodejs'
import { removeSelectModeListener, sendCloseSelectMode, sendSelectMode } from '@main/modules/winMain'
import log from '@main/modules/sync/log'
import { registerEvent, unregisterEvent } from './localEvent'

const logInfo = (eventName: string, success = false) => {
  log.info(`[${eventName}]${eventName.replace('dislike:sync:dislike_sync_', '').replaceAll('_', ' ')}${success ? ' success' : ''}`)
}
// const logError = (eventName: string, err: Error) => {
//   log.error(`[${eventName}]${eventName.replace('dislike:sync:dislike_sync_', '').replaceAll('_', ' ')} error: ${err.message}`)
// }
const getSyncMode = async(socket: LX.Sync.Client.Socket): Promise<LX.Sync.Dislike.SyncMode> => new Promise((resolve, reject) => {
  const handleDisconnect = (err: Error) => {
    sendCloseSelectMode()
    removeSelectModeListener()
    reject(err)
  }
  let removeEventClose = socket.onClose(handleDisconnect)
  sendSelectMode(socket.data.keyInfo.serverName, 'dislike', (mode) => {
    if (mode == null) {
      reject(new Error('cancel'))
      return
    }
    resolve(mode)
    removeSelectModeListener()
    removeEventClose()
  })
})
const handler: LX.Sync.ClientSyncHandlerDislikeActions<LX.Sync.Client.Socket> = {
  async onDislikeSyncAction(socket, action) {
    if (!socket.moduleReadys?.dislike) return
    await handleRemoteDislikeAction(action)
  },

  async dislike_sync_get_md5(socket) {
    logInfo('dislike:sync:dislike_sync_get_md5')
    return toMD5((await getLocalDislikeData()).trim())
  },


  async dislike_sync_get_sync_mode(socket) {
    return getSyncMode(socket)
  },

  async dislike_sync_get_list_data(socket) {
    logInfo('dislike:sync:dislike_sync_get_list_data')
    return getLocalDislikeData()
  },

  async dislike_sync_set_list_data(socket, data) {
    logInfo('dislike:sync:dislike_sync_set_list_data')
    await setLocalDislikeData(data)
  },

  async dislike_sync_finished(socket) {
    logInfo('dislike:sync:finished')
    socket.moduleReadys.dislike = true
    registerEvent(socket)
    socket.onClose(() => {
      unregisterEvent()
    })
  },
}

export default handler

