import { onBeforeUnmount, ref, computed, useI18n, watch, useCommit } from '@renderer/utils/vueTools'
import { formatPlayTime2 } from '@renderer/utils'

import { setLoopPlay } from '../player'

export default ({ setting }) => {
  const { t } = useI18n()

  const toggleDesktopLyricBtnTitle = computed(() => {
    return `${
      setting.value.desktopLyric.enable
        ? t('desktop_lyric__off')
        : t('desktop_lyric__on')
    }（${
      setting.value.desktopLyric.isLock
        ? t('desktop_lyric__unlock')
        : t('desktop_lyric__lock')
    }）`
  })

  return {
    toggleDesktopLyricBtnTitle,
  }
}
