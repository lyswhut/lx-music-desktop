declare namespace LX {
  namespace Player {
    interface ProgressBarOptions {
      progress: number
      mode?: Electron.ProgressBarOptions['mode']
    }

    type StatusButtonActions = 'unCollect'
    | 'collect'
    | 'prev'
    | 'pause'
    | 'play'
    | 'next'

    interface LyricInfo extends LX.Music.LyricInfo {
      rawlrcInfo: LX.Music.LyricInfo
    }
  }
}
