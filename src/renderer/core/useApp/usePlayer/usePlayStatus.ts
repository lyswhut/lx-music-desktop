import { onBeforeUnmount } from '@common/utils/vueTools'
import { setPlayerAction, onPlayerAction } from '@renderer/utils/ipc'
// import store from '@renderer/store'

import { loveList } from '@renderer/store/list/state'
import { addListMusics, removeListMusics, checkListExistMusic } from '@renderer/store/list/action'
import { playMusicInfo } from '@renderer/store/player/state'
import { throttle } from '@common/utils'
import { pause, play, playNext, playPrev } from '@renderer/core/player'

export default () => {
  // const setVisibleDesktopLyric = useCommit('setVisibleDesktopLyric')
  // const setLockDesktopLyric = useCommit('setLockDesktopLyric')

  const buttons = {
    empty: true,
    collect: false,
    play: false,
    prev: true,
    next: true,
    lrc: false,
    lockLrc: false,
  }
  const setButtons = () => {
    setPlayerAction(buttons)
  }
  const updateCollectStatus = async() => {
    let status = !!playMusicInfo.musicInfo && await checkListExistMusic(loveList.id, playMusicInfo.musicInfo.id)
    if (buttons.collect == status) return false
    buttons.collect = status
    return true
  }

  const handlePlay = () => {
    buttons.empty &&= false
    buttons.play = true
    setButtons()
  }
  const handlePause = () => {
    buttons.empty &&= false
    buttons.play = false
    setButtons()
  }
  const handleStop = () => {
    if (playMusicInfo.musicInfo != null) return
    buttons.collect &&= false
    buttons.empty = true
    setButtons()
  }
  const handleSetPlayInfo = () => {
    void updateCollectStatus().then(isExist => {
      if (isExist) setButtons()
    })
  }
  // const handleSetTaskbarThumbnailClip = (clip) => {
  //   setTaskbarThumbnailClip(clip)
  // }
  const throttleListChange = throttle(async listIds => {
    if (!listIds.includes(loveList.id)) return
    if (await updateCollectStatus()) setButtons()
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
        if (await updateCollectStatus()) setButtons()
        break
      case 'unCollect':
        if (!playMusicInfo.musicInfo) return
        void removeListMusics({ listId: loveList.id, ids: ['progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo.id : playMusicInfo.musicInfo.id] })
        if (await updateCollectStatus()) setButtons()
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
  window.app_event.on('play', handlePlay)
  window.app_event.on('pause', handlePause)
  window.app_event.on('stop', handleStop)
  window.app_event.on('musicToggled', handleSetPlayInfo)
  // window.app_event.on(eventTaskbarNames.setTaskbarThumbnailClip, handleSetTaskbarThumbnailClip)
  window.app_event.on('myListUpdate', throttleListChange)

  onBeforeUnmount(() => {
    rTaskbarThumbarClick()
    window.app_event.off('play', handlePlay)
    window.app_event.off('pause', handlePause)
    window.app_event.off('stop', handleStop)
    window.app_event.off('musicToggled', handleSetPlayInfo)
    // window.app_event.off(eventTaskbarNames.setTaskbarThumbnailClip, handleSetTaskbarThumbnailClip)
    window.app_event.off('myListUpdate', throttleListChange)
  })

  return async() => {
    // const setting = store.getters.setting
    // buttons.lrc = setting.desktopLyric.enable
    // buttons.lockLrc = setting.desktopLyric.isLock
    await updateCollectStatus()
    if (playMusicInfo.musicInfo != null) buttons.empty = false
    setButtons()
  }
}
