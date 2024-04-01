import { mainHandle } from '@common/mainIpc'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import {
  startServer,
  stopServer,
  getStatus,
} from '@main/modules/openApi'


export default () => {
  mainHandle<LX.OpenAPI.Actions, any>(WIN_MAIN_RENDERER_EVENT_NAME.open_api_action, async({ params: data }) => {
    switch (data.action) {
      case 'enable':
        return data.data.enable ? await startServer(parseInt(data.data.port), data.data.bindLan) : await stopServer()
      case 'status': return getStatus()
    }
  })
}
