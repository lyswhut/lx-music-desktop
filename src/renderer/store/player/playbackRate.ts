import { ref } from '@common/utils/vueTools'


export const playbackRate = ref(1)

export const setplaybackRate = (num: number) => {
  playbackRate.value = num
}
