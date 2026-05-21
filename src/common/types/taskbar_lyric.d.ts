declare namespace LX {
  namespace TaskbarLyric {
    interface State {
      enabled: boolean
      isPlaying: boolean
      songId: string | null
      title: string
      artist: string
      lyricLine: string
      albumCoverUrl: string | null
      showCover: boolean
      showSongInfo: boolean
      showCurrentLine: boolean
    }
  }
}
