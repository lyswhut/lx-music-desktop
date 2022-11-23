import { watch } from '@common/utils/vueTools'
import { isFullscreen, proxy, sync, windowSizeList } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { sendSyncAction, setTaskBarProgress, setWindowSize } from '@renderer/utils/ipc'
import { setLanguage } from '@/lang'
import { setUserApi } from '../apiSource'
// import { applyTheme, getThemes } from '@renderer/store/utils'


export default () => {
  watch(() => appSetting['common.windowSizeId'], (index) => {
    let info = index == null ? windowSizeList[2] : windowSizeList[index]
    setWindowSize(info.width, info.height)
  })
  watch(() => appSetting['common.fontSize'], (fontSize) => {
    if (isFullscreen.value) return
    document.documentElement.style.fontSize = `${fontSize}px`
  })

  watch(() => appSetting['common.langId'], (id) => {
    if (!id) return
    setLanguage(id)
  })

  watch(() => appSetting['common.apiSource'], apiSource => {
    void setUserApi(apiSource)
  })

  watch(() => appSetting['common.font'], (val) => {
    document.documentElement.style.fontFamily = val
  }, {
    immediate: true,
  })

  watch(() => appSetting['sync.enable'], enable => {
    void sendSyncAction({
      action: 'enable',
      data: {
        enable,
        port: appSetting['sync.port'],
      },
    })
    sync.enable = enable
  })
  watch(() => appSetting['sync.port'], port => {
    void sendSyncAction({
      action: 'enable',
      data: {
        enable: appSetting['sync.enable'],
        port: appSetting['sync.port'],
      },
    })
    sync.port = port
  })

  watch(() => appSetting['network.proxy.enable'], enable => {
    proxy.enable = enable
  })
  watch(() => appSetting['network.proxy.enable'], enable => {
    proxy.enable = enable
  })
  watch(() => appSetting['network.proxy.host'], host => {
    proxy.host = host
  })
  watch(() => appSetting['network.proxy.port'], port => {
    proxy.port = port
  })
  watch(() => appSetting['network.proxy.username'], username => {
    proxy.username = username
  })
  watch(() => appSetting['network.proxy.password'], password => {
    proxy.password = password
  })

  watch(() => appSetting['player.isShowTaskProgess'], val => {
    if (val) return
    setTimeout(() => {
      setTaskBarProgress(-1, 'normal')
    })
  })
}
