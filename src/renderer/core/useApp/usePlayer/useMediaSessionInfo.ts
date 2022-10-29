import { onBeforeUnmount } from '@common/utils/vueTools'
import { getDuration, getPlaybackRate, getCurrentTime } from '@renderer/plugins/player'
import { musicInfo } from '@renderer/store/player/state'
import { playProgress } from '@renderer/store/player/playProgress'
import { playNext, playPrev, stop } from '@renderer/core/player'
// import { } from ''

export default () => {
  const updateMediaSessionInfo = () => {
    const mediaMetadata: MediaMetadata = {
      title: musicInfo.name,
      artist: musicInfo.singer,
      album: musicInfo.album,
      artwork: [],
    }
    if (musicInfo.pic) mediaMetadata.artwork = [{ src: musicInfo.pic }]

    // @ts-expect-error
    navigator.mediaSession.metadata = new window.MediaMetadata(mediaMetadata)
  }

  const updatePositionState = (state: {
    duration?: number
    position?: number
    playbackRate?: number
  } = {}) => {
    navigator.mediaSession.setPositionState({
      duration: state.duration ?? getDuration(),
      playbackRate: state.playbackRate ?? getPlaybackRate(),
      position: state.position ?? getCurrentTime(),
    })
  }

  const setProgress = (time: number) => {
    window.app_event.setProgress(time)
  }

  const setStop = () => {
    stop()
  }
  const handlePlay = () => {
    navigator.mediaSession.playbackState = 'playing'
  }
  const handlePause = () => {
    navigator.mediaSession.playbackState = 'paused'
  }
  const handleStop = () => {
    navigator.mediaSession.playbackState = 'none'
  }
  const handleSetPlayInfo = () => {
    updateMediaSessionInfo()
    updatePositionState({
      position: playProgress.nowPlayTime,
      duration: playProgress.maxPlayTime,
    })
    handlePause()
  }

  // const registerMediaSessionHandler = () => {
  // navigator.mediaSession.setActionHandler('play', () => {
  //   if (this.isPlay || !this.playMusicInfo) return
  //   console.log('play')
  //   this.startPlay()
  // })
  // navigator.mediaSession.setActionHandler('pause', () => {
  //   if (!this.isPlay || !this.playMusicInfo) return
  //   console.log('pause')
  //   this.stopPlay()
  // })
  navigator.mediaSession.setActionHandler('stop', () => {
    console.log('stop')
    setStop()
  })
  navigator.mediaSession.setActionHandler('seekbackward', details => {
    console.log('seekbackward')
    const seekOffset = details.seekOffset == null ? 5 : details.seekOffset
    setProgress(Math.max(getCurrentTime() - seekOffset, 0))
  })
  navigator.mediaSession.setActionHandler('seekforward', details => {
    console.log('seekforward')
    const seekOffset = details.seekOffset == null ? 5 : details.seekOffset
    setProgress(Math.min(getCurrentTime() + seekOffset, getDuration()))
  })
  navigator.mediaSession.setActionHandler('seekto', details => {
    console.log('seekto', details.seekTime)
    if (details.seekTime == null) return
    let time = Math.min(details.seekTime, getDuration())
    time = Math.max(time, 0)
    setProgress(time)
  })
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    console.log('previoustrack')
    void playPrev()
  })
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    console.log('nexttrack')
    void playNext()
  })
  // navigator.mediaSession.setActionHandler('skipad', () => {
  //   console.log('')
  // })
  // }

  window.app_event.on('playerLoadeddata', updatePositionState)
  window.app_event.on('playerCanplay', updatePositionState)
  window.app_event.on('play', handlePlay)
  window.app_event.on('pause', handlePause)
  window.app_event.on('stop', handleStop)
  window.app_event.on('error', handlePause)
  window.app_event.on('musicToggled', handleSetPlayInfo)
  window.app_event.on('picUpdated', updateMediaSessionInfo)

  onBeforeUnmount(() => {
    window.app_event.off('playerLoadeddata', updatePositionState)
    window.app_event.off('playerCanplay', updatePositionState)
    window.app_event.off('play', handlePlay)
    window.app_event.off('pause', handlePause)
    window.app_event.off('stop', handleStop)
    window.app_event.off('error', handlePause)
    window.app_event.off('musicToggled', handleSetPlayInfo)
    window.app_event.off('picUpdated', updateMediaSessionInfo)
  })
}
