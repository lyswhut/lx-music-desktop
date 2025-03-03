declare namespace LX {
  namespace DesktopLyric {
    interface Config {
      'desktopLyric.enable': LX.AppSetting['desktopLyric.enable']
      'desktopLyric.isLock': LX.AppSetting['desktopLyric.isLock']
      'desktopLyric.isAlwaysOnTop': LX.AppSetting['desktopLyric.isAlwaysOnTop']
      'desktopLyric.isAlwaysOnTopLoop': LX.AppSetting['desktopLyric.isAlwaysOnTopLoop']
      'desktopLyric.isShowTaskbar': LX.AppSetting['desktopLyric.isShowTaskbar']
      'desktopLyric.pauseHide': LX.AppSetting['desktopLyric.pauseHide']
      'desktopLyric.audioVisualization': LX.AppSetting['desktopLyric.audioVisualization']
      'desktopLyric.width': LX.AppSetting['desktopLyric.width']
      'desktopLyric.height': LX.AppSetting['desktopLyric.height']
      'desktopLyric.x': LX.AppSetting['desktopLyric.x']
      'desktopLyric.y': LX.AppSetting['desktopLyric.y']
      'desktopLyric.isLockScreen': LX.AppSetting['desktopLyric.isLockScreen']
      'desktopLyric.isDelayScroll': LX.AppSetting['desktopLyric.isDelayScroll']
      'desktopLyric.scrollAlign': LX.AppSetting['desktopLyric.scrollAlign']
      'desktopLyric.isHoverHide': LX.AppSetting['desktopLyric.isHoverHide']
      'desktopLyric.direction': LX.AppSetting['desktopLyric.direction']
      'desktopLyric.style.align': LX.AppSetting['desktopLyric.style.align']
      'desktopLyric.style.font': LX.AppSetting['desktopLyric.style.font']
      'desktopLyric.style.fontSize': LX.AppSetting['desktopLyric.style.fontSize']
      'desktopLyric.style.lineGap': LX.AppSetting['desktopLyric.style.lineGap']
      'desktopLyric.style.lyricUnplayColor': LX.AppSetting['desktopLyric.style.lyricUnplayColor']
      'desktopLyric.style.lyricPlayedColor': LX.AppSetting['desktopLyric.style.lyricPlayedColor']
      'desktopLyric.style.lyricShadowColor': LX.AppSetting['desktopLyric.style.lyricShadowColor']
      // 'desktopLyric.style.fontWeight': LX.AppSetting['desktopLyric.style.fontWeight']
      'desktopLyric.style.opacity': LX.AppSetting['desktopLyric.style.opacity']
      'desktopLyric.style.ellipsis': LX.AppSetting['desktopLyric.style.ellipsis']
      'desktopLyric.style.isFontWeightFont': LX.AppSetting['desktopLyric.style.isFontWeightFont']
      'desktopLyric.style.isFontWeightLine': LX.AppSetting['desktopLyric.style.isFontWeightLine']
      'desktopLyric.style.isFontWeightExtended': LX.AppSetting['desktopLyric.style.isFontWeightExtended']
      'desktopLyric.style.isZoomActiveLrc': LX.AppSetting['desktopLyric.style.isZoomActiveLrc']
      'common.langId': LX.AppSetting['common.langId']
      'player.isShowLyricTranslation': LX.AppSetting['player.isShowLyricTranslation']
      'player.isShowLyricRoma': LX.AppSetting['player.isShowLyricRoma']
      'player.isPlayLxlrc': LX.AppSetting['player.isPlayLxlrc']
      'player.playbackRate': LX.AppSetting['player.playbackRate']
    }

    type WinMainActions = 'get_info' | 'get_status' | 'get_analyser_data_array'

    interface LyricActionBase <A> {
      action: A
    }
    interface LyricActionData<A, D> extends LyricActionBase<A> {
      data: D
    }
    type LyricAction<A, D = undefined> = D extends undefined ? LyricActionBase<A> : LyricActionData<A, D>

    type LyricActions = LyricAction<'set_info', {
      id: string | null
      singer: string
      name: string
      album: string
      lrc: string | null
      tlrc: string | null
      rlrc: string | null
      lxlrc: string | null
      // pic: string | null
      isPlay: boolean
      line: number
      played_time: number
    }>
    | LyricAction<'set_status', {
      isPlay: boolean
      line: number
      played_time: number
    }>
    | LyricAction<'set_lyric', {
      lrc: string | null
      tlrc: string | null
      rlrc: string | null
      lxlrc: string | null
    }>
    | LyricAction<'set_offset', number>
    | LyricAction<'set_playbackRate', number>
    | LyricAction<'set_play', number>
    | LyricAction<'set_pause'>
    | LyricAction<'set_stop'>
    | LyricAction<'send_analyser_data_array', Uint8Array>


    interface NewBounds {
      x: number
      y: number
      w: number
      h: number
    }
  }
}
