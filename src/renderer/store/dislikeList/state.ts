import { markRaw, ref } from '@common/utils/vueTools'

// import { deduplicationList } from '@common/utils/renderer'


export const dislikeInfo: LX.Dislike.DislikeInfo = markRaw({
  names: markRaw(new Set()),
  musicNames: markRaw(new Set()),
  singerNames: markRaw(new Set()),
  rules: '',
})

export const dislikeRuleCount = ref(0)
