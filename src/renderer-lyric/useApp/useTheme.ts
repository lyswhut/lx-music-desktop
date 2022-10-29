import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { setting } from '@lyric/store/state'
import { onThemeChange } from '@lyric/utils/ipc'
import { RGB_Alpha_Shade } from '@common/theme/colorUtils'

export default () => {
  const rThemeChange = onThemeChange(({ params: setting }) => {
    window.setTheme(setting.theme.colors)
  })
  watch(() => [setting['desktopLyric.style.lyricUnplayColor'], setting['desktopLyric.style.lyricPlayedColor'], setting['desktopLyric.style.lyricShadowColor']], ([unplayColor, playedColor, shadowColor]) => {
    window.setLyricColor({
      '--color-lyric-unplay': unplayColor,
      '--color-lyric-played': playedColor,
      '--color-lyric-shadow': shadowColor,
      '--color-lyric-shadow-font-mode': RGB_Alpha_Shade(0.49, shadowColor),
    })
  }, {
    immediate: true,
  })

  onBeforeUnmount(() => {
    rThemeChange()
  })
}
