import { watch } from '@common/utils/vueTools'
import { setLyric, setVertical, setPlaybackRate } from '@lyric/core/lyric'
import { getStatus } from '@lyric/core/mainWindowChannel'
import { isPlay, setting } from '@lyric/store/state'

export default () => {
  watch(() => setting['player.isShowLyricTranslation'], setLyric)
  watch(() => setting['player.isShowLyricRoma'], setLyric)
  watch(() => setting['player.isPlayLxlrc'], setLyric)
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
