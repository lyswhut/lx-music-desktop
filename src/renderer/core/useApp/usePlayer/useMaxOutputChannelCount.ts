import { watch } from '@common/utils/vueTools'
import { setMaxOutputChannelCount } from '@renderer/plugins/player'

import { appSetting } from '@renderer/store/setting'

export default () => {
  // console.log(appSetting['player.soundEffect.panner.enable'])
  setMaxOutputChannelCount(appSetting['player.isMaxOutputChannelCount'])

  watch(() => appSetting['player.isMaxOutputChannelCount'], (val) => {
    setMaxOutputChannelCount(val)
  })
}

