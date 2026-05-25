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
  themeColor: string
  backgroundColorMode: 'theme' | 'custom'
  backgroundColor: string
  backgroundOpacity: number
  songInfoFontColorMode: 'theme' | 'custom'
  songInfoFontColor: string
  lyricFontColorMode: 'theme' | 'custom'
  lyricFontColor: string
  songInfoFontSize: number
  lyricFontSize: number
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
  themeColor: 'rgb(77, 175, 124)',
  backgroundColorMode: 'theme',
  backgroundColor: 'rgba(15, 23, 42, 1)',
  backgroundOpacity: 72,
  songInfoFontColorMode: 'theme',
  songInfoFontColor: 'rgba(226, 232, 240, 1)',
  lyricFontColorMode: 'theme',
  lyricFontColor: 'rgba(248, 250, 252, 1)',
  songInfoFontSize: 11,
  lyricFontSize: 12,
})

export const patchState = (payload: Partial<LX.TaskbarLyric.State>) => {
  Object.assign(state, payload)
}
