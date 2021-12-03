import { reactive } from '@renderer/utils/vueTools'
import { formatPlayTime2 } from '@renderer/utils'

export const playProgress = reactive({
  nowPlayTime: 0,
  maxPlayTime: 0,
  progress: 0,
  nowPlayTimeStr: '00:00',
  maxPlayTimeStr: '00:00',
})

export const setNowPlayTime = time => {
  playProgress.nowPlayTime = time
  playProgress.nowPlayTimeStr = formatPlayTime2(time)
  playProgress.progress = playProgress.maxPlayTime ? time / playProgress.maxPlayTime : 0
}

export const setMaxplayTime = time => {
  playProgress.maxPlayTime = time
  playProgress.maxPlayTimeStr = formatPlayTime2(time)
  playProgress.progress = time ? playProgress.nowPlayTime / time : 0
}
