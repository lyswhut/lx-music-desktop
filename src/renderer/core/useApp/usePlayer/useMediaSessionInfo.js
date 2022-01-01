import { onBeforeUnmount } from '@renderer/utils/vueTools'
import { getDuration, getPlaybackRate, getCurrentTime } from '@renderer/plugins/player'
import { player } from '@renderer/event/names'

export default ({ playPrev, playNext }) => {
  const updateMediaSessionInfo = ({ name, singer, albumName, img }) => {
    const mediaMetadata = {
      title: name,
      artist: singer,
      album: albumName,
    }
    if (img) mediaMetadata.artwork = [{ src: img }]
    navigator.mediaSession.metadata = new window.MediaMetadata(mediaMetadata)
  }

  const updatePositionState = (state = {}) => {
    navigator.mediaSession.setPositionState({
      duration: state.duration ?? getDuration(),
      playbackRate: state.playbackRate ?? getPlaybackRate(),
      position: state.position ?? getCurrentTime(),
    })
  }

  const setProgress = time => {
    window.eventHub.emit(player.setProgress, time)
  }

  const setStop = () => {
    window.eventHub.emit(player.setStop)
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
  const handleSetPlayInfo = ({ musicInfo, progress }) => {
    updateMediaSessionInfo(musicInfo)
    updatePositionState({
      position: progress.time,
      duration: progress.maxTime,
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
    setProgress(Math.max(getCurrentTime() - details.seekOffset, 0))
  })
  navigator.mediaSession.setActionHandler('seekforward', details => {
    console.log('seekforward')
    setProgress(Math.min(getCurrentTime() + details.seekOffset, getDuration()))
  })
  navigator.mediaSession.setActionHandler('seekto', details => {
    console.log('seekto', details.seekTime)
    let time = Math.min(details.seekTime, getDuration())
    time = Math.max(time, 0)
    setProgress(time)
  })
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    console.log('previoustrack')
    playPrev()
  })
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    console.log('nexttrack')
    playNext()
  })
  // navigator.mediaSession.setActionHandler('skipad', () => {
  //   console.log('')
  // })
  // }

  window.eventHub.on(player.player_loadeddata, updatePositionState)
  window.eventHub.on(player.player_canplay, updatePositionState)
  window.eventHub.on(player.play, handlePlay)
  window.eventHub.on(player.pause, handlePause)
  window.eventHub.on(player.stop, handleStop)
  window.eventHub.on(player.error, handlePause)
  window.eventHub.on(player.setPlayInfo, handleSetPlayInfo)
  window.eventHub.on(player.updatePic, updateMediaSessionInfo)

  onBeforeUnmount(() => {
    window.eventHub.off(player.player_loadeddata, updatePositionState)
    window.eventHub.off(player.player_canplay, updatePositionState)
    window.eventHub.off(player.play, handlePlay)
    window.eventHub.off(player.pause, handlePause)
    window.eventHub.off(player.stop, handleStop)
    window.eventHub.off(player.error, handlePause)
    window.eventHub.off(player.setPlayInfo, handleSetPlayInfo)
    window.eventHub.off(player.updatePic, updateMediaSessionInfo)
  })
}
