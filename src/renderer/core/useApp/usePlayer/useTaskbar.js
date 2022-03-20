import { onBeforeUnmount, useCommit } from '@renderer/utils/vueTools'
import { player as eventPlayerNames, taskbar as eventTaskbarNames, list as eventListNames } from '@renderer/event/names'
import { onTaskbarThumbarClick, setTaskbarThumbnailClip, setTaskbarThumbarButtons } from '@renderer/utils/tools'
// import store from '@renderer/store'

import { loveList, getList } from '@renderer/core/share/list'
import { playMusicInfo } from '@renderer/core/share/player'
import { throttle } from '@renderer/utils'

export default () => {
  const listAdd = useCommit('list', 'listAdd')
  const listRemove = useCommit('list', 'listRemove')
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
    setTaskbarThumbarButtons(buttons)
  }
  const updateCollectStatus = () => {
    let status = !!playMusicInfo.musicInfo && getList(loveList.id).some(musicInfo => playMusicInfo.musicInfo.songmid == musicInfo.songmid)
    if (buttons.collect == status) return false
    buttons.collect = status
    return true
  }

  const handlePlay = () => {
    if (buttons.empty) buttons.empty = false
    buttons.play = true
    setButtons()
  }
  const handlePause = () => {
    if (buttons.empty) buttons.empty = false
    buttons.play = false
    setButtons()
  }
  const handleStop = async() => {
    if (playMusicInfo.musicInfo != null) return
    if (buttons.collect) buttons.collect = false
    buttons.empty = true
    setButtons()
  }
  const handleSetPlayInfo = () => {
    if (!updateCollectStatus()) return
    setButtons()
  }
  const handleSetTaskbarThumbnailClip = (clip) => {
    setTaskbarThumbnailClip(clip)
  }
  const throttleListChange = throttle(listIds => {
    if (!listIds.includes(loveList.id)) return
    if (!updateCollectStatus()) return
    setButtons()
  })
  // const updateSetting = () => {
  //   const setting = store.getters.setting
  //   buttons.lrc = setting.desktopLyric.enable
  //   buttons.lockLrc = setting.desktopLyric.isLock
  //   setButtons()
  // }
  const rTaskbarThumbarClick = onTaskbarThumbarClick((event, action) => {
    switch (action) {
      case 'play':
        window.eventHub.emit(eventPlayerNames.setPlay)
        break
      case 'pause':
        window.eventHub.emit(eventPlayerNames.setPause)
        break
      case 'prev':
        window.eventHub.emit(eventPlayerNames.setPlayPrev)
        break
      case 'next':
        window.eventHub.emit(eventPlayerNames.setPlayNext)
        break
      case 'collect':
        if (!playMusicInfo.musicInfo) return
        listAdd({ id: loveList.id, musicInfo: playMusicInfo.musicInfo })
        if (updateCollectStatus()) setButtons()
        break
      case 'unCollect':
        if (!playMusicInfo.musicInfo) return
        listRemove({ listId: loveList.id, id: playMusicInfo.musicInfo.songmid })
        if (updateCollectStatus()) setButtons()
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
  window.eventHub.on(eventPlayerNames.play, handlePlay)
  window.eventHub.on(eventPlayerNames.pause, handlePause)
  window.eventHub.on(eventPlayerNames.stop, handleStop)
  window.eventHub.on(eventPlayerNames.setPlayInfo, handleSetPlayInfo)
  window.eventHub.on(eventTaskbarNames.setTaskbarThumbnailClip, handleSetTaskbarThumbnailClip)
  window.eventHub.on(eventListNames.listChange, throttleListChange)

  onBeforeUnmount(() => {
    rTaskbarThumbarClick()
    window.eventHub.off(eventPlayerNames.play, handlePlay)
    window.eventHub.off(eventPlayerNames.pause, handlePause)
    window.eventHub.off(eventPlayerNames.stop, handleStop)
    window.eventHub.off(eventPlayerNames.setPlayInfo, handleSetPlayInfo)
    window.eventHub.off(eventTaskbarNames.setTaskbarThumbnailClip, handleSetTaskbarThumbnailClip)
    window.eventHub.off(eventListNames.listChange, throttleListChange)
  })

  return () => {
    // const setting = store.getters.setting
    // buttons.lrc = setting.desktopLyric.enable
    // buttons.lockLrc = setting.desktopLyric.isLock
    updateCollectStatus()
    if (playMusicInfo.musicInfo != null) buttons.empty = false
    setButtons()
  }
}
