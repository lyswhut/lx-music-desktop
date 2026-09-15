import { appSetting, setTogglePlayMode } from '@renderer/store/setting'
import {
  computed,
} from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { tempPlayList, currentPlayIndex, currentPlaybackOrder } from '@renderer/store/player/state'

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
    if (mode == appSetting['player.togglePlayMethod']) return
    // let index = playNextModes.indexOf(appSetting['player.togglePlayMethod'])
    // if (++index >= playNextModes.length) index = 0
    const N = tempPlayList.length
    const prevPlayIndex = currentPlaybackOrder.value[currentPlayIndex.value]
    if (mode === 'random') {
      currentPlayIndex.value = 0
      const allIndexes = Array.from({ length: N }, (_, i) => i).filter(i => i !== prevPlayIndex)
      for (let i = allIndexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[allIndexes[i], allIndexes[j]] = [allIndexes[j], allIndexes[i]]
      }
      currentPlaybackOrder.value = [prevPlayIndex, ...allIndexes]
    } else {
      currentPlaybackOrder.value = Array.from({ length: N }, (_, i) => i)
      currentPlayIndex.value = prevPlayIndex
    }
    // todo 因为只有此函数会修改播放类别，所以直接在这里应用修改效果
    setTogglePlayMode(mode)
  }

  return {
    nextTogglePlayName,
    toggleNextPlayMode,
  }
}
