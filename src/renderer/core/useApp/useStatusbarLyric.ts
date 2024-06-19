import { watch } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { setDisableAutoPauseBySource } from '@renderer/core/lyric'

export default () => {
  const handleEnable = (enable: boolean) => {
    setDisableAutoPauseBySource(enable, 'statusBarLyric')
  }
  watch(() => appSetting['player.isShowStatusBarLyric'], enable => {
    handleEnable(enable)
  })

  return async() => {
    if (appSetting['player.isShowStatusBarLyric']) {
      handleEnable(true)
    }
  }
}
