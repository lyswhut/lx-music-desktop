import { isLinux } from '@common/utils'
import { getEnvParams, setIgnoreMouseEvents } from '@renderer/utils/tools'

import { useRefGetter } from '@renderer/utils/vueTools'
import { sync, apiSource, proxy } from '@renderer/core/share'

import useSync from './useSync'
import useUpdate from './useUpdate'
import useDataInit from './useDataInit'
import useHandleEnvParams from './useHandleEnvParams'
import useEventListener from './useEventListener'
import useDeepLink from './useDeepLink'
import usePlayer from './usePlayer'


export default () => {
  const isProd = process.env.NODE_ENV === 'production'

  const setting = useRefGetter('setting')

  sync.enable = setting.value.sync.enable
  apiSource.value = setting.value.apiSource
  Object.assign(proxy, setting.value.network.proxy)

  const dieableIgnoreMouseEvents = () => {
    if (window.dt) return
    setIgnoreMouseEvents(false)
  }
  const enableIgnoreMouseEvents = () => {
    if (window.dt) return
    setIgnoreMouseEvents(true)
  }

  useUpdate(setting)
  useSync()
  useEventListener({
    dieableIgnoreMouseEvents,
    enableIgnoreMouseEvents,
    setting,
    isProd,
    isLinux,
  })
  const initPlayer = usePlayer({ setting })
  const handleEnvParams = useHandleEnvParams()
  const initData = useDataInit({
    setting,
  })
  const initDeepLink = useDeepLink()


  getEnvParams().then(envParams => {
    const envProxy = envParams.cmdParams['proxy-server']
    if (envProxy && typeof envProxy == 'string') {
      const [host, port = ''] = envProxy.split(':')
      proxy.envProxy = {
        host,
        port,
      }
    }

    // 初始化我的列表、下载列表等数据
    initData().then(() => {
      initPlayer()
      handleEnvParams(envParams) // 处理传入的启动参数
      initDeepLink(envParams)
    })
  })
}
