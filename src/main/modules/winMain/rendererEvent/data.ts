import { STORE_NAMES } from '@common/constants'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { mainOn, mainHandle } from '@common/mainIpc'
import getStore from '@main/utils/store'

export default () => {
  mainHandle<string, any>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, ({ params: path }) => {
    return getStore(STORE_NAMES.DATA).get(path) as any
  })

  mainOn<{
    path: string
    data: any
  }>(WIN_MAIN_RENDERER_EVENT_NAME.save_data, ({ params: { path, data } }) => {
    getStore(STORE_NAMES.DATA).set(path, data)
  })
}
