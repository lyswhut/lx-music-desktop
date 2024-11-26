import { watch } from '@common/utils/vueTools'
import { isFullscreen, proxy, sync, windowSizeList } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { sendSyncAction, setWindowSize } from '@renderer/utils/ipc'
import { setLanguage } from '@root/lang'
import { setUserApi } from '../apiSource'
// import { applyTheme, getThemes } from '@renderer/store/utils'


export default () => {
  watch(() => appSetting['common.windowSizeId'], (index) => {
    const info = index == null ? windowSizeList[2] : windowSizeList[index]
    setWindowSize(info.width, info.height)
  })
  watch(() => appSetting['common.fontSize'], (fontSize) => {
    if (isFullscreen.value) return
    document.documentElement.style.fontSize = `${fontSize}px`
  })

  watch(() => appSetting['common.langId'], (id) => {
    if (!id) return
    setLanguage(id)
    window.setLang(id)
  })

  watch(() => appSetting['common.apiSource'], apiSource => {
    void setUserApi(apiSource)
  })

  watch(() => appSetting['common.font'], (val) => {
    document.documentElement.style.fontFamily = val
  }, {
    immediate: true,
  })

  watch(() => appSetting['sync.mode'], (mode) => {
    sync.mode = mode
  })

  watch(() => appSetting['sync.enable'], enable => {
    switch (appSetting['sync.mode']) {
      case 'server':
        if (appSetting['sync.server.port']) {
          void sendSyncAction({
            action: 'enable_server',
            data: {
              enable: appSetting['sync.enable'],
              port: appSetting['sync.server.port'],
            },
          }).catch(err => {
            console.log(err)
          })
        }
        break
      case 'client':
        if (appSetting['sync.client.host']) {
          void sendSyncAction({
            action: 'enable_client',
            data: {
              enable: appSetting['sync.enable'],
              host: appSetting['sync.client.host'],
            },
          }).catch(err => {
            console.log(err)
          })
        }
        break
      default:
        break
    }
    sync.enable = enable
  })
  watch(() => appSetting['sync.server.port'], port => {
    if (appSetting['sync.mode'] == 'server') {
      void sendSyncAction({
        action: 'enable_server',
        data: {
          enable: appSetting['sync.enable'],
          port: appSetting['sync.server.port'],
        },
      })
    }
    sync.server.port = port
  })
  watch(() => appSetting['sync.client.host'], host => {
    if (appSetting['sync.mode'] == 'client') {
      void sendSyncAction({
        action: 'enable_client',
        data: {
          enable: appSetting['sync.enable'],
          host: appSetting['sync.client.host'],
        },
      })
    }
    sync.client.host = host
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
}
