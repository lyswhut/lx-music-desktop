import { mainHandle } from '@common/mainIpc'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { startServer, stopServer, getStatus, generateCode } from '@main/modules/sync'
import { sendEvent } from '../main'

let selectModeListenr: ((mode: LX.Sync.Mode) => void) | null = null

export default () => {
  mainHandle<LX.Sync.SyncServiceActions, any>(WIN_MAIN_RENDERER_EVENT_NAME.sync_action, async({ params: data }) => {
    switch (data.action) {
      case 'enable':
        return data.data.enable ? await startServer(parseInt(data.data.port)) : await stopServer()
      case 'get_status':
        return getStatus()
      case 'generate_code':
        return await generateCode()
      case 'select_mode':
        if (selectModeListenr) selectModeListenr(data.data)
        break
      default:
        break
    }
  })
}


export const sendSyncAction = (data: LX.Sync.SyncMainWindowActions) => {
  sendEvent(WIN_MAIN_RENDERER_EVENT_NAME.sync_action, data)
}

export const sendStatus = (status: LX.Sync.Status) => {
  sendSyncAction({
    action: 'status',
    data: status,
  })
}
export const sendSelectMode = (keyInfo: LX.Sync.KeyInfo, listener: (mode: LX.Sync.Mode) => void) => {
  selectModeListenr = listener
  sendSyncAction({ action: 'select_mode', data: keyInfo })
  return () => {
    selectModeListenr = null
  }
}
export const sendCloseSelectMode = () => {
  sendSyncAction({ action: 'close_select_mode' })
}
