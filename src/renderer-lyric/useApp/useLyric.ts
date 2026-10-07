import { watch } from '@common/utils/vueTools'
import { setLyric, setVertical, setPlaybackRate } from '@lyric/core/lyric'
import { getStatus } from '@lyric/core/mainWindowChannel'
import { isPlay, setting } from '@lyric/store/state'

export default () => {
  watch(() => setting['desktopLyric.isShowLyricTranslation'], setLyric)
  watch(() => setting['desktopLyric.isShowLyricRoma'], setLyric)
  watch(() => setting['desktopLyric.isSwapLyricTranslationAndRoma'], setLyric)
  watch(() => setting['desktopLyric.isPlayLxlrc'], setLyric)
  watch(() => setting['player.playbackRate'], (rate) => {
    setPlaybackRate(rate)
    if (isPlay.value) {
      setTimeout(() => {
        getStatus()
      })
    }
  })
  watch(() => setting['desktopLyric.direction'], (direction) => {
    setVertical(direction == 'vertical')
    // if (isPlay.value)
  })
}
