import { onBeforeUnmount, watch, useCommit } from '@renderer/utils/vueTools'
import { formatPlayTime2, getRandom, throttle } from '@renderer/utils'
import { setTaskBarProgress, wait, waitCancel, savePlayInfo } from '@renderer/utils/tools'
import { player as eventPlayerNames } from '@renderer/event/names'
import { onTimeupdate, getCurrentTime, getDuration, setCurrentTime, onVisibilityChange } from '@renderer/plugins/player'
import { playProgress, setNowPlayTime, setMaxplayTime } from '@renderer/core/share/playProgress'
import { musicInfo, musicInfoItem, playMusicInfo, playInfo } from '@renderer/core/share/player'
// import { getList } from '@renderer/core/share/utils'

const delaySavePlayInfo = throttle(savePlayInfo, 2000)

export default ({ setting, playNext }) => {
  let restorePlayTime = 0
  let prevProgressStatus = 'none'
  const mediaBuffer = {
    timeout: null,
    playTime: 0,
  }

  const updateMusicInfo = useCommit('list', 'updateMusicInfo')

  const startBuffering = () => {
    console.log('start t')
    if (mediaBuffer.timeout) return
    mediaBuffer.timeout = Math.random()
    wait(3000, mediaBuffer.timeout).then(() => {
      mediaBuffer.timeout = null
      const currentTime = getCurrentTime()
      if (!mediaBuffer.playTime) mediaBuffer.playTime = currentTime
      let skipTime = currentTime + getRandom(3, 6)
      if (skipTime > playProgress.maxPlayTime) skipTime = (playProgress.maxPlayTime - currentTime) / 2
      if (skipTime - mediaBuffer.playTime < 1 || playProgress.maxPlayTime - skipTime < 1) {
        mediaBuffer.playTime = 0
        playNext()
        return
      }
      startBuffering()
      setCurrentTime(skipTime)
      console.log(mediaBuffer.playTime)
      console.log(currentTime)
    }).catch(_ => _)
  }
  const clearBufferTimeout = () => {
    console.log('clear t')
    if (!mediaBuffer.timeout) return
    waitCancel(mediaBuffer.timeout)
    mediaBuffer.timeout = null
    mediaBuffer.playTime = 0
  }

  const setProgress = (time) => {
    if (!musicInfo.songmid) return
    restorePlayTime = time
    if (mediaBuffer.playTime) {
      clearBufferTimeout()
      mediaBuffer.playTime = time
      startBuffering()
    }
    setNowPlayTime(time)
    setCurrentTime(time)

    // if (!isPlay) audio.play()
  }

  const handleSetTaskBarState = (progress, status) => {
    if (setting.value.player.isShowTaskProgess) setTaskBarProgress(progress, status)
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
    if (!restorePlayTime) restorePlayTime = getCurrentTime() // 记录出错的播放时间
    prevProgressStatus = 'error'
    handleSetTaskBarState(playProgress.progress, prevProgressStatus)
  }

  const handleLoadeddata = () => {
    setMaxplayTime(getDuration())

    if (restorePlayTime) {
      setCurrentTime(restorePlayTime)
      restorePlayTime = 0
    }

    if (!musicInfoItem.value.interval && playMusicInfo.listId != 'download') {
      updateMusicInfo({
        listId: playMusicInfo.listId,
        id: musicInfo.songmid,
        musicInfo: musicInfoItem.value,
        data: { interval: formatPlayTime2(playProgress.maxPlayTime) },
      })
    }
  }

  const handleCanplay = () => {
    if (mediaBuffer.playTime) {
      let playTime = mediaBuffer.playTime
      mediaBuffer.playTime = 0
      setCurrentTime(playTime)
    }
  }
  const handleWating = () => {
    startBuffering()
  }

  const handleEmpied = () => {
    mediaBuffer.playTime = 0
    clearBufferTimeout()
  }

  const handleSetPlayInfo = ({ musicInfo, progress }) => {
    setNowPlayTime(restorePlayTime = progress.time)
    setMaxplayTime(progress.maxTime)
    handlePause()
    if (!playMusicInfo.isTempPlay) {
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
    if (Math.abs(newValue - oldValue) > 2) window.eventHub.emit(eventPlayerNames.activeTransition)
    if (setting.value.player.isSavePlayTime && !playMusicInfo.isTempPlay) {
      delaySavePlayInfo({
        time: newValue,
        maxTime: playProgress.maxPlayTime,
        listId: playMusicInfo.listId,
        index: playInfo.playIndex,
      })
    }
  })
  watch(() => playProgress.maxPlayTime, maxPlayTime => {
    if (!playMusicInfo.isTempPlay) {
      delaySavePlayInfo({
        time: playProgress.nowPlayTime,
        maxTime: maxPlayTime,
        listId: playMusicInfo.listId,
        index: playInfo.playIndex,
      })
    }
  })

  window.eventHub.on(eventPlayerNames.play, handlePlay)
  window.eventHub.on(eventPlayerNames.pause, handlePause)
  window.eventHub.on(eventPlayerNames.stop, handleStop)
  window.eventHub.on(eventPlayerNames.error, handleError)
  window.eventHub.on(eventPlayerNames.setProgress, setProgress)
  // window.eventHub.on(eventPlayerNames.restorePlay, handleRestorePlay)
  window.eventHub.on(eventPlayerNames.player_loadeddata, handleLoadeddata)
  window.eventHub.on(eventPlayerNames.player_canplay, handleCanplay)
  window.eventHub.on(eventPlayerNames.player_waiting, handleWating)
  window.eventHub.on(eventPlayerNames.player_emptied, handleEmpied)
  window.eventHub.on(eventPlayerNames.setPlayInfo, handleSetPlayInfo)

  const rOnTimeupdate = onTimeupdate(() => {
    setNowPlayTime(getCurrentTime())
  })

  let currentPlayTime = 0
  const rVisibilityChange = onVisibilityChange(() => {
    if (document.hidden) {
      currentPlayTime = playProgress.nowPlayTime
    } else {
      if (Math.abs(playProgress.nowPlayTime - currentPlayTime) > 2) {
        window.eventHub.emit(eventPlayerNames.activeTransition)
      }
    }
  })

  onBeforeUnmount(() => {
    rOnTimeupdate()
    rVisibilityChange()
    window.eventHub.off(eventPlayerNames.play, handlePlay)
    window.eventHub.off(eventPlayerNames.pause, handlePause)
    window.eventHub.off(eventPlayerNames.stop, handleStop)
    window.eventHub.off(eventPlayerNames.error, handleError)
    window.eventHub.off(eventPlayerNames.setProgress, setProgress)
    // window.eventHub.off(eventPlayerNames.restorePlay, handleRestorePlay)
    window.eventHub.off(eventPlayerNames.player_loadeddata, handleLoadeddata)
    window.eventHub.off(eventPlayerNames.player_canplay, handleCanplay)
    window.eventHub.off(eventPlayerNames.player_waiting, handleWating)
    window.eventHub.off(eventPlayerNames.player_emptied, handleEmpied)
    window.eventHub.off(eventPlayerNames.setPlayInfo, handleSetPlayInfo)
  })
}
