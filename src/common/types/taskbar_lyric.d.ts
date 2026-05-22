declare namespace LX {
  namespace TaskbarLyric {
    interface State {
      enabled: boolean
      isPlaying: boolean
      isCollected: boolean
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
      backgroundColorMode: LX.AppSetting['taskbarLyric.style.backgroundColorMode']
      backgroundColor: LX.AppSetting['taskbarLyric.style.backgroundColor']
      backgroundOpacity: LX.AppSetting['taskbarLyric.style.backgroundOpacity']
      fontColorMode: LX.AppSetting['taskbarLyric.style.fontColorMode']
      fontColor: LX.AppSetting['taskbarLyric.style.fontColor']
    }
  }
}
