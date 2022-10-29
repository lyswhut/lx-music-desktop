import { ref } from '@common/utils/vueTools'


export const volume = ref(0)
export const isMute = ref(false)

export const setVolume = (num: number) => {
  volume.value = num
}

export const setMute = (flag: boolean) => {
  isMute.value = flag
}
