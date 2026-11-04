import { ref } from '@common/utils/vueTools'


export const volume = ref(0)
export const isMute = ref(false)

export const setVolume = (num: number) => {
  volume.value = num
}

export const setMute = (flag: boolean) => {
  isMute.value = flag
}

/** 滚轮调节音量时气泡提示的显示状态 */
export const showVolumeBubble = ref(false)
let bubbleTimer: number | null = null

/** 短暂显示音量气泡 */
export const flashVolumeBubble = () => {
  showVolumeBubble.value = true
  if (bubbleTimer) clearTimeout(bubbleTimer)
  bubbleTimer = setTimeout(() => {
    bubbleTimer = null
    showVolumeBubble.value = false
  }, 1000) as unknown as number
}
