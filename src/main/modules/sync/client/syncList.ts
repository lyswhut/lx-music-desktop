import log from '../log'
import { getLocalListData, setLocalListData } from '../utils'
import { toMD5 } from '@common/utils/nodejs'
import { removeSelectModeListener, sendCloseSelectMode, sendSelectMode } from '@main/modules/winMain'
import { SYNC_CLOSE_CODE } from '@common/constants'

const logInfo = (eventName: keyof LX.Sync.ActionSyncSendType, success = false) => {
  log.info(`[${eventName as string}]${eventName.replace('list:sync:list_sync_', '').replaceAll('_', ' ')}${success ? ' success' : ''}`)
}
const logError = (eventName: keyof LX.Sync.ActionSyncSendType, err: Error) => {
  log.error(`[${eventName as string}]${eventName.replace('list:sync:list_sync_', '').replaceAll('_', ' ')} error: ${err.message}`)
}

export default async(socket: LX.Sync.Client.Socket) => new Promise<void>((resolve, reject) => {
  let listenEvents: Array<() => void> = []
  const unregisterEvents = () => {
    while (listenEvents.length) listenEvents.shift()?.()
  }

  socket.onClose(() => {
    unregisterEvents()
    sendCloseSelectMode()
    removeSelectModeListener()
    reject(new Error('closed'))
  })
  listenEvents.push(socket.onRemoteEvent('list:sync:list_sync_get_md5', async() => {
    logInfo('list:sync:list_sync_get_md5')
    const md5 = toMD5(JSON.stringify(await getLocalListData()))
    socket?.sendData('list:sync:list_sync_get_md5', md5, (err) => {
      if (err) {
        logError('list:sync:list_sync_get_md5', err)
        socket.close(SYNC_CLOSE_CODE.failed)
        return
      }
      logInfo('list:sync:list_sync_get_md5', true)
    })
  }))
  listenEvents.push(socket.onRemoteEvent('list:sync:list_sync_get_list_data', async() => {
    logInfo('list:sync:list_sync_get_list_data')
    socket?.sendData('list:sync:list_sync_get_list_data', await getLocalListData(), (err) => {
      if (err) {
        logError('list:sync:list_sync_get_list_data', err)
        socket.close(SYNC_CLOSE_CODE.failed)
        return
      }
      logInfo('list:sync:list_sync_get_list_data', true)
    })
  }))
  listenEvents.push(socket.onRemoteEvent('list:sync:list_sync_get_sync_mode', async() => {
    logInfo('list:sync:list_sync_get_sync_mode')
    sendSelectMode(socket.data.keyInfo.serverName, (mode) => {
      removeSelectModeListener()
      socket?.sendData('list:sync:list_sync_get_sync_mode', mode, (err) => {
        if (err) {
          logError('list:sync:list_sync_get_sync_mode', err)
          socket.close(SYNC_CLOSE_CODE.failed)
          return
        }
        logInfo('list:sync:list_sync_get_sync_mode', true)
      })
    })
  }))
  listenEvents.push(socket.onRemoteEvent('list:sync:list_sync_set_data', async(data) => {
    logInfo('list:sync:list_sync_set_data')
    await setLocalListData(data)
    logInfo('list:sync:list_sync_set_data', true)
  }))
  listenEvents.push(socket.onRemoteEvent('list:sync:finished', async() => {
    unregisterEvents()
    resolve()
    logInfo('list:sync:finished', true)
  }))
})
