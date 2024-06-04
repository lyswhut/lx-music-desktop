import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { sendPlayerStatus, onPlayerAction } from '@renderer/utils/ipc'
// import store from '@renderer/store'

import { loveList } from '@renderer/store/list/state'
import { addListMusics, removeListMusics, checkListExistMusic } from '@renderer/store/list/action'
import { playMusicInfo, musicInfo } from '@renderer/store/player/state'
import { throttle } from '@common/utils'
import { pause, play, playNext, playPrev } from '@renderer/core/player'
import { playProgress } from '@renderer/store/player/playProgress'
import { appSetting } from '@renderer/store/setting'
import { lyric } from '@renderer/store/player/lyric'

export default () => {
  // const setVisibleDesktopLyric = useCommit('setVisibleDesktopLyric')
  // const setLockDesktopLyric = useCommit('setLockDesktopLyric')
  let collect = false

  const updateCollectStatus = async() => {
    let status = !!playMusicInfo.musicInfo && await checkListExistMusic(loveList.id, playMusicInfo.musicInfo.id)
    if (collect == status) return false
    collect = status
    return true
  }

  const handlePlay = () => {
    sendPlayerStatus({ status: 'playing' })
  }
  const handlePause = () => {
    sendPlayerStatus({ status: 'paused' })
  }
  const handleStop = () => {
    if (playMusicInfo.musicInfo != null) return
    sendPlayerStatus({ status: 'stoped' })
  }
  const handleError = () => {
    sendPlayerStatus({ status: 'error' })
  }
  const handleSetPlayInfo = async() => {
    await updateCollectStatus()
    sendPlayerStatus({
      collect,
      name: musicInfo.name,
      singer: musicInfo.singer,
      albumName: musicInfo.album,
      picUrl: musicInfo.pic ?? '',
      lyric: musicInfo.lrc ?? '',
      lyricLineText: '',
      lyricLineAllText: '',
    })
  }
  const handleSetLyric = () => {
    sendPlayerStatus({
      lyric: musicInfo.lrc ?? '',
      lyricLineText: '',
      lyricLineAllText: '',
    })
  }
  const handleSetPic = () => {
    sendPlayerStatus({
      picUrl: musicInfo.pic ?? '',
    })
  }
  const handleSetLyricLine = (text: string, line: number) => {
    let curLine = lyric.lines[line]?.extendedLyrics.join('\n') ?? ''
    sendPlayerStatus({
      lyricLineText: text,
      lyricLineAllText: curLine ? text + '\n' + curLine : text,
    })
  }
  // const handleSetTaskbarThumbnailClip = (clip) => {
  //   setTaskbarThumbnailClip(clip)
  // }
  const throttleListChange = throttle(async listIds => {
    if (!listIds.includes(loveList.id)) return
    if (await updateCollectStatus()) sendPlayerStatus({ collect })
  })
  // const updateSetting = () => {
  //   const setting = store.getters.setting
  //   buttons.lrc = setting.desktopLyric.enable
  //   buttons.lockLrc = setting.desktopLyric.isLock
  //   setButtons()
  // }
  const rTaskbarThumbarClick = onPlayerAction(async({ params: action }) => {
    switch (action) {
      case 'play':
        play()
        break
      case 'pause':
        pause()
        break
      case 'prev':
        void playPrev()
        break
      case 'next':
        void playNext()
        break
      case 'collect':
        if (!playMusicInfo.musicInfo) return
        void addListMusics(loveList.id, ['progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo])
        if (await updateCollectStatus()) sendPlayerStatus({ collect })
        break
      case 'unCollect':
        if (!playMusicInfo.musicInfo) return
        void removeListMusics({ listId: loveList.id, ids: ['progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo.id : playMusicInfo.musicInfo.id] })
        if (await updateCollectStatus()) sendPlayerStatus({ collect })
        break
      // case 'lrc':
      //   setVisibleDesktopLyric(true)
      //   updateSetting()
      //   break
      // case 'unLrc':
      //   setVisibleDesktopLyric(false)
      //   updateSetting()
      //   break
      // case 'lockLrc':
      //   setLockDesktopLyric(true)
      //   updateSetting()
      //   break
      // case 'unlockLrc':
      //   setLockDesktopLyric(false)
      //   updateSetting()
      //   break
    }
  })
  watch(() => playProgress.nowPlayTime, (newValue, oldValue) => {
    // console.log(playProgress.nowPlayTime, newValue, oldValue)
    // if (newValue.toFixed(2) === oldValue.toFixed(2)) return
    // console.log(playProgress.nowPlayTime)
    sendPlayerStatus({ progress: newValue })
  })
  watch(() => playProgress.maxPlayTime, (newValue) => {
    sendPlayerStatus({ duration: newValue })
  })
  watch(() => appSetting['player.playbackRate'], rate => {
    sendPlayerStatus({ playbackRate: rate })
  })

  window.app_event.on('play', handlePlay)
  window.app_event.on('pause', handlePause)
  window.app_event.on('stop', handleStop)
  window.app_event.on('error', handleError)
  window.app_event.on('musicToggled', handleSetPlayInfo)
  window.app_event.on('lyricUpdated', handleSetLyric)
  window.app_event.on('picUpdated', handleSetPic)
  window.app_event.on('lyricLinePlay', handleSetLyricLine)
  // window.app_event.on(eventTaskbarNames.setTaskbarThumbnailClip, handleSetTaskbarThumbnailClip)
  window.app_event.on('myListUpdate', throttleListChange)

  onBeforeUnmount(() => {
    rTaskbarThumbarClick()
    window.app_event.off('play', handlePlay)
    window.app_event.off('pause', handlePause)
    window.app_event.off('stop', handleStop)
    window.app_event.off('error', handleError)
    window.app_event.off('musicToggled', handleSetPlayInfo)
    window.app_event.off('lyricUpdated', handleSetLyric)
    window.app_event.off('picUpdated', handleSetPic)
    window.app_event.off('lyricLinePlay', handleSetLyricLine)
    // window.app_event.off(eventTaskbarNames.setTaskbarThumbnailClip, handleSetTaskbarThumbnailClip)
    window.app_event.off('myListUpdate', throttleListChange)
  })

  return async() => {
    // const setting = store.getters.setting
    // buttons.lrc = setting.desktopLyric.enable
    // buttons.lockLrc = setting.desktopLyric.isLock
    await updateCollectStatus()
    if (playMusicInfo.musicInfo == null) return
    sendPlayerStatus({
      collect,
      name: musicInfo.name,
      singer: musicInfo.singer,
      albumName: musicInfo.album,
      playbackRate: appSetting['player.playbackRate'],
      picUrl: musicInfo.pic ?? '',
      lyric: musicInfo.lrc ?? '',
    })
  }
}
