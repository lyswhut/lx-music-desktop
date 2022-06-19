import { isLinux } from '@common/utils'
import { getEnvParams, setIgnoreMouseEvents } from '@renderer/utils/tools'

import { useRefGetter } from '@renderer/utils/vueTools'
import { sync, apiSource, proxy, isFullscreen } from '@renderer/core/share'

import useSync from './useSync'
import useUpdate from './useUpdate'
import useDataInit from './useDataInit'
import useHandleEnvParams from './useHandleEnvParams'
import useEventListener from './useEventListener'
import useDeepLink from './useDeepLink'
import usePlayer from './usePlayer'
import useListAutoUpdate from './useListAutoUpdate'


export default () => {
  const isProd = process.env.NODE_ENV === 'production'

  const setting = useRefGetter('setting')

  sync.enable = setting.value.sync.enable
  apiSource.value = setting.value.apiSource
  Object.assign(proxy, setting.value.network.proxy)
  isFullscreen.value = setting.value.startInFullscreen

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
  const handleListAutoUpdate = useListAutoUpdate()


  getEnvParams().then(envParams => {
    // 移除代理相关的环境变量设置，防止请求库自动应用它们
    // eslint-disable-next-line no-undef
    const processEnv = ENVIRONMENT
    for (const key of Object.keys(processEnv)) {
      if (/^(?:http_proxy|https_proxy|NO_PROXY)$/i.test(key)) delete processEnv[key]
    }
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
      handleListAutoUpdate()
    })
  })
}
