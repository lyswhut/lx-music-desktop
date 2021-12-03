import { reactive, ref, markRaw } from '@renderer/utils/vueTools'

export const isInitedList = ref(false)

export const setInited = () => {
  isInitedList.value = true
}

export const downloadList = reactive([])
export const downloadListMap = new Map()

export const initDownloadList = list => {
  downloadList.splice(0, downloadList.length, ...list)
  downloadListMap.clear()
  for (const task of list) {
    downloadListMap.set(task.key, task)
  }
}

export const downloadStatus = markRaw({
  RUN: 'run',
  WAITING: 'waiting',
  PAUSE: 'pause',
  ERROR: 'error',
  COMPLETED: 'completed',
})
