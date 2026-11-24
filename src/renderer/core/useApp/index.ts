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
import { initRecommendRadio, notifyRecommendConfigChanged } from '@renderer/core/recommend/session'
import { initRecommendProfile } from '@renderer/core/recommend/profile'
import { createYtmAdapter } from '@renderer/core/recommend/ytmAdapter'
import { assertPlaybackSupport } from '@renderer/core/music/sourceCapabilities'


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

  // 电台启动恢复（D15）：必须在同步段完成切歌订阅注册，先于下方 getEnvParams().then 里的 initData
  // （useDataInit 恢复上次播放会经 playList 派发首个 musicToggled，错过注册点首事件就会被吞掉）
  initRecommendRadio({
    createYtmAdapter,
    assertPlaybackSupport,
    getGlobalProxy: () => proxy,
  })
  // 画像常驻订阅（TP-2）：同上的先注册约束——不开电台也累计画像，收藏/听完捕获不能丢首个事件
  initRecommendProfile()

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
      notifyRecommendConfigChanged()
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
