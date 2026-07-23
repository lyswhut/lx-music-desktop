import { ref, shallowReactive } from '@common/utils/vueTools'

export const isPlay = ref(false)

export const musicInfo = shallowReactive<{
  id: string | null
  pic: string | null
  name: string
  singer: string
  album: string
}>({
  id: null,
  pic: null,
  name: '',
  singer: '',
  album: '',
})

export const currentLyric = ref('')
export const progress = ref(0)
export const duration = ref(0)