export interface TaskbarLyricStatePayload {
  enabled: boolean
  isPlaying: boolean
  songId: string | null
  title: string
  artist: string
  lyricLine: string
  albumCoverUrl: string | null
}

// Task 3 keeps the renderer static-first. Live IPC wiring will land in a later task.
export const sendTaskbarLyricState = (_state: TaskbarLyricStatePayload) => {}

// Placeholder for the later refresh handshake once playback state wiring is implemented.
export const requestTaskbarLyricRefresh = () => {}
