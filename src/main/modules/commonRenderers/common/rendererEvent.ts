import { mainHandle, mainOn } from '@common/mainIpc'
import { CMMON_EVENT_NAME } from '@common/ipcNames'
import { getFonts } from '@main/utils/fontManage'

// 公共操作事件（公共，只注册一次）
export default () => {
  mainHandle<LX.AppSetting>(CMMON_EVENT_NAME.get_app_setting, async() => {
    return global.lx.appSetting
  })
  mainHandle<Partial<LX.AppSetting>>(CMMON_EVENT_NAME.set_app_setting, async({ params: config }) => {
    global.lx.event_app.update_config(config)
  })

  mainHandle<LX.EnvParams>(CMMON_EVENT_NAME.get_env_params, async() => {
    return global.envParams
  })

  mainOn(CMMON_EVENT_NAME.clear_env_params_deeplink, () => {
    global.envParams.deeplink = null
  })

  mainHandle<string[]>(CMMON_EVENT_NAME.get_system_fonts, async() => {
    return getFonts()
  })
}

