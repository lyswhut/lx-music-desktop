import { shallowReactive } from '@common/utils/vueTools'

interface TaskbarLyricViewState {
  enabled: boolean
  isPlaying: boolean
  songId: string | null
  title: string
  artist: string
  lyricLine: string
  albumCoverUrl: string | null
  offsetX: number
  showCover: boolean
  showSongInfo: boolean
  showCurrentLine: boolean
}

export const state = shallowReactive<TaskbarLyricViewState>({
  enabled: false,
  isPlaying: false,
  songId: null,
  title: 'LX Music',
  artist: 'Taskbar lyric',
  lyricLine: 'Renderer target ready for state wiring.',
  albumCoverUrl: null,
  offsetX: 0,
  showCover: true,
  showSongInfo: true,
  showCurrentLine: true,
})

export const patchState = (payload: Partial<LX.TaskbarLyric.State>) => {
  Object.assign(state, payload)
}
