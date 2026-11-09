import { mainHandle, mainOn } from '@common/mainIpc'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import {
  startServer,
  stopServer,
  getStatus,
} from '@main/modules/openApi'
import { handleDshBridgeResponse } from '@main/modules/openApi/dshBridge'


export default () => {
  mainHandle<LX.OpenAPI.Actions, any>(WIN_MAIN_RENDERER_EVENT_NAME.open_api_action, async({ params: data }) => {
    switch (data.action) {
      case 'enable':
        return data.data.enable ? await startServer(parseInt(data.data.port), data.data.bindLan) : await stopServer()
      case 'status': return getStatus()
    }
  })
  // DSH Bridge：接收渲染进程回传的搜索/播放结果
  mainOn<LX.DshBridge.Response>(WIN_MAIN_RENDERER_EVENT_NAME.dsh_bridge_response, handleDshBridgeResponse)
}
