import { musicInfo, isPlay, currentLyric, progress, duration } from './state'

type MusicInfoKeys = keyof typeof musicInfo
const musicInfoKeys: MusicInfoKeys[] = Object.keys(musicInfo) as MusicInfoKeys[]

export const setMusicInfo = (_musicInfo: Partial<typeof musicInfo>) => {
  for (const key of musicInfoKeys) {
    const val = _musicInfo[key]
    if (val !== undefined) {
      // @ts-expect-error
      musicInfo[key] = val
    }
  }
}

export const setIsPlay = (_isPlay: boolean) => {
  isPlay.value = _isPlay
}

export const setCurrentLyric = (lyric: string) => {
  currentLyric.value = lyric
}

export const setProgress = (val: number) => {
  progress.value = val
}

export const setDuration = (val: number) => {
  duration.value = val
}