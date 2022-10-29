import { reactive } from '@common/utils/vueTools'
import { formatPlayTime2 } from '@common/utils/common'

export const playProgress = reactive({
  nowPlayTime: 0,
  maxPlayTime: 0,
  progress: 0,
  nowPlayTimeStr: '00:00',
  maxPlayTimeStr: '00:00',
})

export const setNowPlayTime = (time: number) => {
  playProgress.nowPlayTime = time
  playProgress.nowPlayTimeStr = formatPlayTime2(time)
  playProgress.progress = playProgress.maxPlayTime ? time / playProgress.maxPlayTime : 0
}

export const setMaxplayTime = (time: number) => {
  playProgress.maxPlayTime = time
  playProgress.maxPlayTimeStr = formatPlayTime2(time)
  playProgress.progress = time ? playProgress.nowPlayTime / time : 0
}

export const setProgress = (currentTime: number, totalTime: number) => {
  setMaxplayTime(totalTime)
  setNowPlayTime(currentTime)
}
