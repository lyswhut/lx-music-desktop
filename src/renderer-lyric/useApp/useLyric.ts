import { watch } from '@common/utils/vueTools'
import { setLyric, setVertical } from '@lyric/core/lyric'
import { setting } from '@lyric/store/state'

export default () => {
  watch(() => setting['player.isShowLyricTranslation'], setLyric)
  watch(() => setting['player.isShowLyricRoma'], setLyric)
  watch(() => setting['player.isPlayLxlrc'], setLyric)
  watch(() => setting['desktopLyric.direction'], (direction) => {
    setVertical(direction == 'vertical')
    // if (isPlay.value)
  })
}
