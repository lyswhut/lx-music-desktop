import { ref } from '@renderer/utils/vueTools'


export const volume = ref(0)
export const isMute = ref(false)

export const setVolume = num => {
  volume.value = num
}

export const setMute = flag => {
  isMute.value = flag
}
