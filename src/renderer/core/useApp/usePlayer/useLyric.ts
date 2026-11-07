import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { debounce, throttle } from '@common/utils/common'
// import { setDesktopLyricInfo, onGetDesktopLyricInfo } from '@renderer/utils/ipc'
// import { musicInfo } from '@renderer/store/player/state'
import {
  pause,
  play,
  playAtTime,
  setLyric,
  stop,
  init,
  sendInfo,
  setPlaybackRate,
} from '@renderer/core/lyric'
import { appSetting } from '@renderer/store/setting'
import { getCurrentTime as getPlayerCurrentTime } from '@renderer/plugins/player'
import { isPlay } from '@renderer/store/player/state'

const handleApplyPlaybackRate = debounce(setPlaybackRate, 300)

const handleSetProgress = () => {
  // 进度变化时将歌词同步到当前播放位置（秒转毫秒）
  playAtTime(getPlayerCurrentTime() * 1000)

  // 再按播放器状态设置歌词播放/暂停
  if (isPlay.value) {
    play()
  } else {
    pause()
  }
}

// 拖动进度条时节流更新，避免性能问题
const handleProgressDragging = throttle((time: number) => {
  // 拖动过程中实时同步歌词（秒转毫秒）
  playAtTime(time * 1000)
  // 音乐暂停时歌词保持暂停
  if (!isPlay.value) {
    pause()
  }
}, 100)

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

  window.app_event.on('play', play)
  window.app_event.on('pause', pause)
  window.app_event.on('stop', stop)
  window.app_event.on('error', pause)
  window.app_event.on('musicToggled', setPlayInfo)
  window.app_event.on('lyricUpdated', setLyric)
  window.app_event.on('setPlaybackRate', handleApplyPlaybackRate)
  window.app_event.on('setProgress', handleSetProgress)
  window.app_event.on('progressDragging', handleProgressDragging)

  onBeforeUnmount(() => {
    window.app_event.off('play', play)
    window.app_event.off('pause', pause)
    window.app_event.off('stop', stop)
    window.app_event.off('error', pause)
    window.app_event.off('musicToggled', setPlayInfo)
    window.app_event.off('lyricUpdated', setLyric)
    window.app_event.off('setPlaybackRate', handleApplyPlaybackRate)
    window.app_event.off('setProgress', handleSetProgress)
    window.app_event.off('progressDragging', handleProgressDragging)
  })
}
