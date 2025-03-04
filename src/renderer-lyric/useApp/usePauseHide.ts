import { ref, watch } from '@common/utils/vueTools'
import { isPlay, setting } from '@lyric/store/state'

export default () => {
  let unWatch: (() => void) | null = null
  let isHide = ref(false)
  let timeout: NodeJS.Timeout | null = null
  const clearIntv = () => {
    if (!timeout) return
    clearTimeout(timeout)
    timeout = null
  }
  watch(() => setting['desktopLyric.pauseHide'], (enable) => {
    if (enable) {
      unWatch = watch(isPlay, (isPlay) => {
        clearIntv()
        if (isPlay) {
          isHide.value &&= false
        } else {
          timeout = setTimeout(() => {
            timeout = null
            isHide.value = true
          }, 200)
        }
      }, {
        immediate: true,
      })
    } else {
      clearIntv()
      isHide.value &&= false
      if (unWatch) {
        unWatch()
        unWatch = null
      }
    }
  }, {
    immediate: true,
  })

  return isHide
}
