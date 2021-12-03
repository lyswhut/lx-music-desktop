import {
  computed,
  useCommit,
} from '@renderer/utils/vueTools'

const playNextModes = [
  'listLoop',
  'random',
  'list',
  'singleLoop',
]

export default ({ setting, t }) => {
  const setPlayNextMode = useCommit('setPlayNextMode')

  const nextTogglePlayName = computed(() => {
    switch (setting.value.player.togglePlayMethod) {
      case 'listLoop': return t('player__play_toggle_mode_list_loop')
      case 'random': return t('player__play_toggle_mode_random')
      case 'singleLoop': return t('player__play_toggle_mode_single_loop')
      case 'list': return t('player__play_toggle_mode_list')
      default: return t('player__play_toggle_mode_off')
    }
  })

  const toggleNextPlayMode = () => {
    let index = playNextModes.indexOf(setting.value.player.togglePlayMethod)
    if (++index >= playNextModes.length) index = -1
    setPlayNextMode(playNextModes[index] || '')
  }

  return {
    nextTogglePlayName,
    toggleNextPlayMode,
  }
}
