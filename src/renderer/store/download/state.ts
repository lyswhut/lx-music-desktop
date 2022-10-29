import { reactive, ref, markRaw } from '@common/utils/vueTools'
import { DOWNLOAD_STATUS } from '@common/constants'

export const isInitedList = ref(false)

export const setInited = () => {
  isInitedList.value = true
}

export const downloadList = reactive<LX.Download.ListItem[]>([])
// export const downloadListMap = new Map<string, LX.Download.ListItem>()

export const downloadStatus = markRaw(DOWNLOAD_STATUS)
