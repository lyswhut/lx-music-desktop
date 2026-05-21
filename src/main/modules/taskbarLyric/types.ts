export interface TaskbarLyricDisplay extends Electron.Rectangle {
  workArea: Electron.Rectangle
}

export interface TaskbarLyricBoundsOptions {
  display: TaskbarLyricDisplay
  width: number
  height: number
  position: LX.AppSetting['taskbarLyric.position']
}

export interface TaskbarLyricState {
  enabled: boolean
  isPlaying: boolean
  songId: string | null
  title: string
  artist: string
  lyricLine: string
  albumCoverUrl: string | null
}
