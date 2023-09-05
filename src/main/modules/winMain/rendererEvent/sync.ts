import { mainHandle } from '@common/mainIpc'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import {
  startServer,
  stopServer,
  getServerStatus,
  generateCode,
  connectServer,
  disconnectServer,
  getClientStatus,
  getServerDevices,
  removeServerDevice,
} from '@main/modules/sync'
import { sendEvent } from '../main'


let selectModeListenr: ((mode: LX.Sync.ModeTypes[keyof LX.Sync.ModeTypes] | null) => void) | null = null

export default () => {
  mainHandle<LX.Sync.SyncServiceActions, any>(WIN_MAIN_RENDERER_EVENT_NAME.sync_action, async({ params: data }) => {
    switch (data.action) {
      case 'enable_server':
        data.data.enable ? await startServer(parseInt(data.data.port)) : await stopServer()
        return
      case 'enable_client':
        data.data.enable ? await connectServer(data.data.host, data.data.authCode) : await disconnectServer()
        return
      case 'get_server_status': return getServerStatus()
      case 'get_client_status': return getClientStatus()
      case 'generate_code': return generateCode()
      case 'select_mode':
        if (selectModeListenr) {
          selectModeListenr(data.data.mode)
          selectModeListenr = null
        }
        break
      default:
        break
    }
  })
  mainHandle<never, LX.Sync.ServerDevices>(WIN_MAIN_RENDERER_EVENT_NAME.sync_get_server_devices, async() => {
    return getServerDevices()
  })
  mainHandle<string>(WIN_MAIN_RENDERER_EVENT_NAME.sync_remove_server_device, async({ params: clientId }) => {
    await removeServerDevice(clientId)
  })
}


export const sendSyncAction = (data: LX.Sync.SyncMainWindowActions) => {
  sendEvent(WIN_MAIN_RENDERER_EVENT_NAME.sync_action, data)
}

export const sendClientStatus = (status: LX.Sync.ClientStatus) => {
  sendSyncAction({
    action: 'client_status',
    data: status,
  })
}
export const sendServerStatus = (status: LX.Sync.ServerStatus) => {
  sendSyncAction({
    action: 'server_status',
    data: status,
  })
}
export const sendSelectMode = <T extends keyof LX.Sync.ModeTypes>(deviceName: string, type: T, listener: (mode: LX.Sync.ModeTypes[T] | null) => void) => {
  selectModeListenr = listener as typeof selectModeListenr
  sendSyncAction({ action: 'select_mode', data: { deviceName, type } })
}
export const removeSelectModeListener = () => {
  if (selectModeListenr) selectModeListenr(null)
  selectModeListenr = null
}
export const sendCloseSelectMode = () => {
  sendSyncAction({ action: 'close_select_mode' })
}
