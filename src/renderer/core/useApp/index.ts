import { checkUpdate, getEnvParams, getViewPrevState, sendInited } from '@renderer/utils/ipc'

import { proxy, isFullscreen, themeId } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'

import useSync from './useSync'
import useOpenAPI from './useOpenAPI'
import useStatusbarLyric from './useStatusbarLyric'
import useUpdate from './useUpdate'
import useDataInit from './useDataInit'
import useHandleEnvParams from './useHandleEnvParams'
import useEventListener from './useEventListener'
import useDeeplink from './useDeeplink'
import usePlayer from './usePlayer'
import useSettingSync from './useSettingSync'
import { useRouter } from '@common/utils/vueRouter'
import handleListAutoUpdate from './listAutoUpdate'


export default () => {
  // apiSource.value = appSetting['common.apiSource']
  proxy.enable = appSetting['network.proxy.enable']
  proxy.host = appSetting['network.proxy.host']
  proxy.port = appSetting['network.proxy.port']
  isFullscreen.value = appSetting['common.startInFullscreen']
  themeId.value = appSetting['theme.id']

  const router = useRouter()
  const initSyncService = useSync()
  const initOpenAPI = useOpenAPI()
  const initStatusbarLyric = useStatusbarLyric()
  useEventListener()
  const initPlayer = usePlayer()
  const handleEnvParams = useHandleEnvParams()
  const initData = useDataInit()
  const initDeeplink = useDeeplink()
  // const handleListAutoUpdate = useListAutoUpdate()

  useUpdate()
  useSettingSync()

  void getEnvParams().then(envParams => {
    // 移除代理相关的环境变量设置，防止请求库自动应用它们
    // eslint-disable-next-line no-undef
    // const processEnv = ENVIRONMENT
    // for (const key of Object.keys(processEnv)) {
    //   // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    //   if (/^(?:http_proxy|https_proxy|NO_PROXY)$/i.test(key)) delete processEnv[key]
    // }
    const envProxy = envParams.cmdParams['proxy-server']
    if (envProxy && typeof envProxy == 'string') {
      const [host, port = ''] = envProxy.split(':')
      proxy.envProxy = {
        host,
        port,
      }
    }

    void getViewPrevState().then(state => {
      void router.push({ path: state.url, query: state.query })
    })

    // 初始化我的列表、下载列表等数据
    void initData().then(() => {
      initPlayer()
      handleEnvParams(envParams) // 处理传入的启动参数
      void initDeeplink(envParams)
      void initSyncService()
      void initOpenAPI()
      void initStatusbarLyric()
      sendInited()

      handleListAutoUpdate()
      if (window.lx.isProd && appSetting['common.isAgreePact']) checkUpdate()
    })
  })
}
