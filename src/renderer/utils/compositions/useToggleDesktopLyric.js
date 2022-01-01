import {
  computed,
  useCommit,
} from '@renderer/utils/vueTools'

export default ({ setting, t }) => {
  const setVisibleDesktopLyric = useCommit('setVisibleDesktopLyric')
  const setLockDesktopLyric = useCommit('setLockDesktopLyric')

  const toggleDesktopLyricBtnTitle = computed(() => {
    return `${
      setting.value.desktopLyric.enable
        ? t('player__desktop_lyric_off')
        : t('player__desktop_lyric_on')
    }（${
      setting.value.desktopLyric.isLock
        ? t('player__desktop_lyric_unlock')
        : t('player__desktop_lyric_lock')
    }）`
  })

  const toggleDesktopLyric = () => {
    setVisibleDesktopLyric(!setting.value.desktopLyric.enable)
  }
  const toggleLockDesktopLyric = () => {
    setLockDesktopLyric(!setting.value.desktopLyric.isLock)
  }

  return {
    toggleDesktopLyricBtnTitle,
    toggleDesktopLyric,
    toggleLockDesktopLyric,
  }
}
