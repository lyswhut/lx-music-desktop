import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { setTitle } from '@renderer/utils'

import {
  setPause, setStop,
} from '@renderer/plugins/player'

import useMediaSessionInfo from './useMediaSessionInfo'
import usePlayProgress from './usePlayProgress'
import usePlayEvent from './usePlayEvent'

import {
  musicInfo,
  playMusicInfo,
  playedList,
} from '@renderer/store/player/state'
import {
  setPlay,
  setAllStatus,
  addPlayedList,
  clearPlayedList,
  // resetPlayerMusicInfo,
} from '@renderer/store/player/action'

import { appSetting } from '@renderer/store/setting'

import useLyric from './useLyric'
import useVolume from './useVolume'
import useWatchList from './useWatchList'
import { HOTKEY_PLAYER } from '@common/hotKey'
import { playNext, pause, playPrev, togglePlay, collectMusic, uncollectMusic, dislikeMusic } from '@renderer/core/player'
import usePlaybackRate from './usePlaybackRate'
import useSoundEffect from './useSoundEffect'


export default () => {
  const t = useI18n()

  usePlayProgress()
  useMediaSessionInfo()
  usePlayEvent()
  useLyric()
  useVolume()
  useSoundEffect()
  usePlaybackRate()
  useWatchList()

  const handlePlayNext = () => {
    void playNext()
  }
  const handlePlayPrev = () => {
    void playPrev()
  }

  const setPlayStatus = () => {
    setPlay(true)
  }
  const setPauseStatus = () => {
    setPlay(false)
    if (window.lx.isPlayedStop) pause()
  }

  const handleUpdatePlayInfo = () => {
    setTitle(musicInfo.id ? `${musicInfo.name} - ${musicInfo.singer}` : null)
  }

  const handleCanplay = () => {
    if (window.lx.isPlayedStop) {
      setPause()
    }
  }
  const handleEnded = () => {
    // setTimeout(() => {
    if (window.lx.isPlayedStop) {
      setAllStatus(t('player__end'))
      return
    }
    // resetPlayerMusicInfo()
    // window.app_event.stop()
    setAllStatus(t('player__end'))
    void playNext(true)
    // })
  }

  const setStopStatus = () => {
    setPlay(false)
    setTitle(null)
    setAllStatus('')
    setStop()
  }

  watch(() => appSetting['player.togglePlayMethod'], newValue => {
    // setLoopPlay(newValue == 'singleLoop')
    if (playedList.length) clearPlayedList()
    if (newValue == 'random' && playMusicInfo.musicInfo && !playMusicInfo.isTempPlay) addPlayedList({ ...(playMusicInfo as LX.Player.PlayMusicInfo) })
  })

  // setLoopPlay(appSetting['player.togglePlayMethod'] == 'singleLoop')


  window.key_event.on(HOTKEY_PLAYER.next.action, handlePlayNext)
  window.key_event.on(HOTKEY_PLAYER.prev.action, handlePlayPrev)
  window.key_event.on(HOTKEY_PLAYER.toggle_play.action, togglePlay)
  window.key_event.on(HOTKEY_PLAYER.music_love.action, collectMusic)
  window.key_event.on(HOTKEY_PLAYER.music_unlove.action, uncollectMusic)
  window.key_event.on(HOTKEY_PLAYER.music_dislike.action, dislikeMusic)

  window.app_event.on('play', setPlayStatus)
  window.app_event.on('pause', setPauseStatus)
  window.app_event.on('error', setPauseStatus)
  window.app_event.on('stop', setStopStatus)
  window.app_event.on('musicToggled', handleUpdatePlayInfo)
  window.app_event.on('playerCanplay', handleCanplay)

  window.app_event.on('playerEnded', handleEnded)


  onBeforeUnmount(() => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
    window.key_event.off(HOTKEY_PLAYER.next.action, handlePlayNext)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    window.key_event.off(HOTKEY_PLAYER.prev.action, handlePlayPrev)
    window.key_event.off(HOTKEY_PLAYER.toggle_play.action, togglePlay)
    window.key_event.off(HOTKEY_PLAYER.music_love.action, collectMusic)
    window.key_event.off(HOTKEY_PLAYER.music_unlove.action, uncollectMusic)
    window.key_event.off(HOTKEY_PLAYER.music_dislike.action, dislikeMusic)


    window.app_event.off('play', setPlayStatus)
    window.app_event.off('pause', setPauseStatus)
    window.app_event.off('error', setPauseStatus)
    window.app_event.off('stop', setStopStatus)
    window.app_event.off('musicToggled', handleUpdatePlayInfo)
    window.app_event.on('playerCanplay', handleCanplay)

    window.app_event.off('playerEnded', handleEnded)
  })
}
