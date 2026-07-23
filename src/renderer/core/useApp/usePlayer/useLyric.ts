import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { debounce } from '@common/utils/common'
// import { setDesktopLyricInfo, onGetDesktopLyricInfo } from '@renderer/utils/ipc'
// import { musicInfo } from '@renderer/store/player/state'
import {
  setLyric,
  stop,
  init,
  sendInfo,
  setPlaybackRate,
  cleanup,
  play as playLyric,
  pause as pauseLyric,
} from '@renderer/core/lyric'
import { appSetting } from '@renderer/store/setting'

const handleApplyPlaybackRate = debounce(setPlaybackRate, 300)

export default () => {
  init()

  const setPlayInfo = () => {
    stop()
    sendInfo()
  }

  watch(() => appSetting['player.isShowLyricTranslation'], setLyric)
  watch(() => appSetting['player.isShowLyricRoma'], setLyric)
  watch(() => appSetting['player.isSwapLyricTranslationAndRoma'], setLyric)
  watch(() => appSetting['player.isPlayLxlrc'], setLyric)

  // 播放/暂停时同步歌词状态（参照迷你播放桌面歌词逻辑）
  // onTimeupdate 中仅在播放状态下刷新歌词，状态切换时需主动触发一次
  window.app_event.on('musicToggled', setPlayInfo)
  window.app_event.on('lyricUpdated', setLyric)
  window.app_event.on('setPlaybackRate', handleApplyPlaybackRate)
  window.app_event.on('play', playLyric)
  window.app_event.on('pause', pauseLyric)

  onBeforeUnmount(() => {
    cleanup()
    window.app_event.off('musicToggled', setPlayInfo)
    window.app_event.off('lyricUpdated', setLyric)
    window.app_event.off('setPlaybackRate', handleApplyPlaybackRate)
    window.app_event.off('play', playLyric)
    window.app_event.off('pause', pauseLyric)
  })
}