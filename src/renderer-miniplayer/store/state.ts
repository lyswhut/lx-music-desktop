import { reactive, computed } from '@common/utils/vueTools'

// 迷你窗本地维护的播放状态副本（数据来源于主窗口经主进程推送）
export const playerStatus = reactive<LX.Player.Status>({
  status: 'stoped',
  name: '',
  singer: '',
  albumName: '',
  picUrl: '',
  progress: 0,
  duration: 0,
  playbackRate: 1,
  lyricLineText: '',
  lyricLineAllText: '',
  lyric: '',
  tlyric: '',
  rlyric: '',
  lxlyric: '',
  collect: false,
  volume: 0,
  mute: false,
})

// 合并主窗口推送的增量状态
export const mergePlayerStatus = (status: Partial<LX.Player.Status>) => {
  for (const [key, value] of Object.entries(status)) {
    if (value === undefined) continue
    // @ts-expect-error
    playerStatus[key] = value
  }
}

// 是否正在播放
export const isPlay = computed(() => playerStatus.status == 'playing')
