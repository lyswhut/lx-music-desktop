import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { formatPlayTime2, getRandom } from '@common/utils/common'
import { throttle } from '@common/utils'
import { setTaskBarProgress, savePlayInfo } from '@renderer/utils/ipc'
import { onTimeupdate, getCurrentTime, getDuration, setCurrentTime, onVisibilityChange } from '@renderer/plugins/player'
import { playProgress, setNowPlayTime, setMaxplayTime } from '@renderer/store/player/playProgress'
import { musicInfo, playMusicInfo, playInfo } from '@renderer/store/player/state'
// import { getList } from '@renderer/store/utils'
import { appSetting } from '@renderer/store/setting'
import { playNext } from '@renderer/core/player'
import { updateListMusics } from '@renderer/store/list/action'

const delaySavePlayInfo = throttle(savePlayInfo, 2000)

export default () => {
  let restorePlayTime = 0
  let prevProgressStatus: Electron.ProgressBarOptions['mode'] = 'none'
  const mediaBuffer: {
    timeout: NodeJS.Timeout | null
    playTime: number
  } = {
    timeout: null,
    playTime: 0,
  }

  // const updateMusicInfo = useCommit('list', 'updateMusicInfo')

  const startBuffering = () => {
    console.log('start t')
    if (mediaBuffer.timeout) return
    mediaBuffer.timeout = setTimeout(() => {
      mediaBuffer.timeout = null
      if (window.lx.isPlayedStop) return
      const currentTime = getCurrentTime()

      mediaBuffer.playTime ||= currentTime
      let skipTime = currentTime + getRandom(3, 6)
      if (skipTime > playProgress.maxPlayTime) skipTime = (playProgress.maxPlayTime - currentTime) / 2
      if (skipTime - mediaBuffer.playTime < 1 || playProgress.maxPlayTime - skipTime < 1) {
        mediaBuffer.playTime = 0
        if (appSetting['player.autoSkipOnError']) {
          console.warn('buffering end')
          void playNext(true)
        }
        return
      }
      startBuffering()
      setCurrentTime(skipTime)
      console.log(mediaBuffer.playTime)
      console.log(currentTime)
    }, 3000)
  }
  const clearBufferTimeout = () => {
    console.log('clear t')
    if (!mediaBuffer.timeout) return
    clearTimeout(mediaBuffer.timeout)
    mediaBuffer.timeout = null
    mediaBuffer.playTime = 0
  }

  const setProgress = (time: number, maxTime?: number) => {
    if (!musicInfo.id) return
    console.log('setProgress', time, maxTime)
    if (time > 0) restorePlayTime = time
    if (mediaBuffer.playTime) {
      clearBufferTimeout()
      mediaBuffer.playTime = time
      startBuffering()
    }
    setNowPlayTime(time)
    setCurrentTime(time)

    if (maxTime != null) setMaxplayTime(maxTime)

    // if (!isPlay) audio.play()
  }

  const handleSetTaskBarState = (progress: number, status?: Electron.ProgressBarOptions['mode']) => {
    if (appSetting['player.isShowTaskProgess']) setTaskBarProgress(progress, status)
  }

  const handlePlay = () => {
    prevProgressStatus = 'normal'
    handleSetTaskBarState(playProgress.progress, prevProgressStatus)
  }
  const handlePause = () => {
    prevProgressStatus = 'paused'
    handleSetTaskBarState(playProgress.progress, prevProgressStatus)
    clearBufferTimeout()
  }

  const handleStop = () => {
    setNowPlayTime(0)
    setMaxplayTime(0)
    prevProgressStatus = 'none'
    handleSetTaskBarState(playProgress.progress, prevProgressStatus)
  }

  const handleError = () => {
    restorePlayTime ||= getCurrentTime() // 记录出错的播放时间
    console.log('handleError')
    prevProgressStatus = 'error'
    handleSetTaskBarState(playProgress.progress, prevProgressStatus)
  }

  const handleLoadeddata = () => {
    setMaxplayTime(getDuration())

    if (playMusicInfo.musicInfo && 'source' in playMusicInfo.musicInfo && !playMusicInfo.musicInfo.interval) {
      // console.log(formatPlayTime2(playProgress.maxPlayTime))

      if (playMusicInfo.listId) {
        void updateListMusics([{
          id: playMusicInfo.listId,
          musicInfo: {
            ...playMusicInfo.musicInfo,
            interval: formatPlayTime2(playProgress.maxPlayTime),
          },
        }])
      }
    }
  }

  const handleCanplay = () => {
    console.log('handleCanplay', mediaBuffer.playTime, restorePlayTime)
    clearBufferTimeout()
    if (mediaBuffer.playTime) {
      let playTime = mediaBuffer.playTime
      mediaBuffer.playTime = 0
      setCurrentTime(playTime)
    } else if (restorePlayTime) {
      setCurrentTime(restorePlayTime)
      restorePlayTime = 0
    }
  }
  const handleWating = () => {
    startBuffering()
  }

  const handleEmpied = () => {
    mediaBuffer.playTime = 0
    clearBufferTimeout()
  }

  const handleSetPlayInfo = () => {
    // restorePlayTime = playProgress.nowPlayTime
    setCurrentTime(restorePlayTime = playProgress.nowPlayTime)
    // setMaxplayTime(playProgress.maxPlayTime)
    handlePause()
    if (!playMusicInfo.isTempPlay && playMusicInfo.listId) {
      delaySavePlayInfo({
        time: playProgress.nowPlayTime,
        maxTime: playProgress.maxPlayTime,
        listId: playMusicInfo.listId,
        index: playInfo.playIndex,
      })
    }
  }

  watch(() => playProgress.progress, (newValue, oldValue) => {
    if (newValue.toFixed(2) === oldValue.toFixed(2)) return
    handleSetTaskBarState(newValue, prevProgressStatus)
  })
  watch(() => playProgress.nowPlayTime, (newValue, oldValue) => {
    if (Math.abs(newValue - oldValue) > 2) window.app_event.activePlayProgressTransition()
    if (appSetting['player.isSavePlayTime'] && !playMusicInfo.isTempPlay) {
      delaySavePlayInfo({
        time: newValue,
        maxTime: playProgress.maxPlayTime,
        listId: playMusicInfo.listId as string,
        index: playInfo.playIndex,
      })
    }
  })
  watch(() => playProgress.maxPlayTime, maxPlayTime => {
    if (!playMusicInfo.isTempPlay) {
      delaySavePlayInfo({
        time: playProgress.nowPlayTime,
        maxTime: maxPlayTime,
        listId: playMusicInfo.listId as string,
        index: playInfo.playIndex,
      })
    }
  })

  window.app_event.on('play', handlePlay)
  window.app_event.on('pause', handlePause)
  window.app_event.on('stop', handleStop)
  window.app_event.on('error', handleError)
  window.app_event.on('setProgress', setProgress)
  // window.app_event.on(eventPlayerNames.restorePlay, handleRestorePlay)
  window.app_event.on('playerLoadeddata', handleLoadeddata)
  window.app_event.on('playerCanplay', handleCanplay)
  window.app_event.on('playerWaiting', handleWating)
  window.app_event.on('playerEmptied', handleEmpied)
  window.app_event.on('musicToggled', handleSetPlayInfo)

  const rOnTimeupdate = onTimeupdate(() => {
    setNowPlayTime(getCurrentTime())
  })

  let currentPlayTime = 0
  const rVisibilityChange = onVisibilityChange(() => {
    if (document.hidden) {
      currentPlayTime = playProgress.nowPlayTime
    } else {
      if (Math.abs(playProgress.nowPlayTime - currentPlayTime) > 2) {
        window.app_event.activePlayProgressTransition()
      }
    }
  })

  onBeforeUnmount(() => {
    rOnTimeupdate()
    rVisibilityChange()
    window.app_event.off('play', handlePlay)
    window.app_event.off('pause', handlePause)
    window.app_event.off('stop', handleStop)
    window.app_event.off('error', handleError)
    window.app_event.off('setProgress', setProgress)
    // window.app_event.off(eventPlayerNames.restorePlay, handleRestorePlay)
    window.app_event.off('playerLoadeddata', handleLoadeddata)
    window.app_event.off('playerCanplay', handleCanplay)
    window.app_event.off('playerWaiting', handleWating)
    window.app_event.off('playerEmptied', handleEmpied)
    window.app_event.off('musicToggled', handleSetPlayInfo)
  })
}
