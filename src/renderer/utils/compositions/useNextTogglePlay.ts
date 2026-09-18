import { appSetting, setTogglePlayMode } from '@renderer/store/setting'
import {
  computed,
} from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { resetRandomPlayQueue } from '@renderer/core/player'
import { resolvePlayModeSelection } from '@renderer/core/player/playMode.mjs'

// const playNextModes = [
//   'listLoop',
//   'random',
//   'list',
//   'singleLoop',
//   'none',
// ] as const

export default () => {
  const t = useI18n()
  const nextTogglePlayName = computed(() => {
    switch (appSetting['player.togglePlayMethod']) {
      case 'listLoop': return t('player__play_toggle_mode_list_loop')
      case 'random': return t('player__play_toggle_mode_random')
      case 'singleLoop': return t('player__play_toggle_mode_single_loop')
      case 'list': return t('player__play_toggle_mode_list')
      default: return t('player__play_toggle_mode_off')
    }
  })

  const toggleNextPlayMode = (mode: LX.AppSetting['player.togglePlayMethod']) => {
    const { nextMode, shouldResetRandomQueue } = resolvePlayModeSelection(appSetting['player.togglePlayMethod'], mode)
    if (nextMode != appSetting['player.togglePlayMethod']) setTogglePlayMode(nextMode)
    if (shouldResetRandomQueue) resetRandomPlayQueue()
  }

  return {
    nextTogglePlayName,
    toggleNextPlayMode,
  }
}
