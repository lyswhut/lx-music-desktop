import { appSetting } from '@renderer/store/setting'
import { setDisableAutoPauseBySource } from '@renderer/core/lyric'

export default () => {
  const handleEnable = (enable: boolean) => {
    setDisableAutoPauseBySource(enable, 'statusBarLyric')
  }

  window.app_event.on('configUpdate', (setting) => {
    if (setting['player.isShowStatusBarLyric'] != null) {
      handleEnable(setting['player.isShowStatusBarLyric'])
    }
  })

  return async() => {
    if (appSetting['player.isShowStatusBarLyric']) {
      handleEnable(true)
    }
  }
}
