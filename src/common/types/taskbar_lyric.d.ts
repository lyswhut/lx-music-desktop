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
      songInfoFontColorMode: LX.AppSetting['taskbarLyric.style.songInfoFontColorMode']
      songInfoFontColor: LX.AppSetting['taskbarLyric.style.songInfoFontColor']
      lyricFontColorMode: LX.AppSetting['taskbarLyric.style.lyricFontColorMode']
      lyricFontColor: LX.AppSetting['taskbarLyric.style.lyricFontColor']
      songInfoFontSize: LX.AppSetting['taskbarLyric.style.songInfoFontSize']
      lyricFontSize: LX.AppSetting['taskbarLyric.style.lyricFontSize']
    }
  }
}
