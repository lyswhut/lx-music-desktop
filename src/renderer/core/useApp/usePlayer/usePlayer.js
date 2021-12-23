import { onBeforeUnmount, useI18n, watch, useCommit, useAction } from '@renderer/utils/vueTools'
import { setTitle, checkPath } from '@renderer/utils'
import { langS2T, wait, waitCancel } from '@renderer/utils/tools'

import {
  setStop as setPlayerStop,
  setPause as setPlayerPause,
  setPlay as setPlayerPlay,
  setResource,
  isEmpty as isPlayerEmpty,
  setLoopPlay,
} from '@renderer/plugins/player'

import { player as eventKeyPlayerNames } from '@common/hotKey'
import { player as eventPlayerNames } from '@renderer/event/names'

import useMediaSessionInfo from './useMediaSessionInfo'
import usePlayProgress from './usePlayProgress'
import usePlayEvent from './usePlayEvent'
import { requestMsg } from '@renderer/utils/message'

import {
  isPlay,
  setPlay,
  setStatus,
  setStatusText,
  setAllStatus,
  musicInfo,
  setMusicInfo,
  musicInfoItem,
  playMusicInfo,
  playInfo,
  setPlayList,
  setPlayMusicInfo,
  playedList,
} from '@renderer/core/share/player'
import { downloadList } from '@renderer/core/share/download'
import { qualityList } from '@renderer/core/share'
import { getList } from '@renderer/core/share/utils'

import path from 'path'
import useLyric from './useLyric'
import useVolume from './useVolume'
import useWatchList from './useWatchList'


const getPlayType = (highQuality, songInfo) => {
  let type = '128k'
  let list = qualityList.value[songInfo.source]
  if (highQuality && songInfo._types['320k'] && list && list.includes('320k')) type = '320k'
  return type
}

const useDelayNextTimeout = ({ playNext, timeout }) => {
  let delayNextTimeout
  const clearDelayNextTimeout = () => {
    // console.log(this.delayNextTimeout)
    if (delayNextTimeout) {
      waitCancel(delayNextTimeout)
      delayNextTimeout = null
    }
  }

  const addDelayNextTimeout = () => {
    clearDelayNextTimeout()
    delayNextTimeout = Math.random()
    wait(timeout, delayNextTimeout).then(() => {
      delayNextTimeout = null
      playNext()
    }).catch(_ => _)
  }

  return {
    clearDelayNextTimeout,
    addDelayNextTimeout,
  }
}

export default ({ setting }) => {
  const { t } = useI18n()

  const playNext = useAction('player', 'playNext')
  const playPrev = useAction('player', 'playPrev')
  const getUrl = useAction('player', 'getUrl')
  const getPic = useAction('player', 'getPic')
  const getLrc = useAction('player', 'getLrc')

  const clearPlayedList = useCommit('player', 'clearPlayedList')
  const setPlayedList = useCommit('player', 'setPlayedList')
  const { addDelayNextTimeout, clearDelayNextTimeout } = useDelayNextTimeout({ playNext, timeout: 5000 })
  const { addDelayNextTimeout: addLoadTimeout, clearDelayNextTimeout: clearLoadTimeout } = useDelayNextTimeout({ playNext, timeout: 123000 })

  const setUrl = (targetSong, isRefresh, isRetryed = false) => {
    let type = getPlayType(setting.value.player.highQuality, targetSong)
    // this.musicInfo.url = await getMusicUrl(targetSong, type)
    setAllStatus(t('player__geting_url'))
    addLoadTimeout()

    return getUrl({
      musicInfo: targetSong,
      type,
      isRefresh,
      onToggleSource() {
        if (targetSong !== musicInfoItem.value || isPlay.value || type != getPlayType(setting.value.player.highQuality, musicInfoItem.value)) return
        setAllStatus('Try toggle source...')
      },
    }).then(url => {
      if (targetSong !== musicInfoItem.value || isPlay.value || type != getPlayType(setting.value.player.highQuality, musicInfoItem.value)) return
      setMusicInfo({ url })
      setResource(url)
    }).catch(err => {
      // console.log('err', err.message)
      if (targetSong !== musicInfoItem.value || isPlay.value) return
      if (err.message == requestMsg.cancelRequest) return
      if (!isRetryed) return setUrl(targetSong, isRefresh, true)
      setAllStatus(err.message)
      addDelayNextTimeout()
      return Promise.reject(err)
    }).finally(() => {
      clearLoadTimeout()
    })
  }
  const setImg = ({ listId, musicInfo: targetSong }) => {
    if (targetSong.img) {
      setMusicInfo({ img: targetSong.img })
    } else {
      getPic({ musicInfo: targetSong, listId }).then(() => {
        if (targetSong.songmid !== musicInfo.songmid) return
        setMusicInfo({ img: targetSong.img })

        window.eventHub.emit(eventPlayerNames.updatePic, musicInfo)
      })
    }
  }
  const setLrc = (targetSong) => {
    getLrc(targetSong).then(({ lyric, tlyric, lxlyric }) => {
      if (targetSong.songmid !== musicInfo.songmid) return
      return (
        setting.value.player.isS2t
          ? Promise.all([
            lyric ? langS2T(lyric) : Promise.resolve(''),
            tlyric ? langS2T(tlyric) : Promise.resolve(''),
            lxlyric ? langS2T(lxlyric) : Promise.resolve(''),
          ])
          : Promise.resolve([lyric, tlyric, lxlyric])
      ).then(([lyric, tlyric, lxlyric]) => {
        setMusicInfo({
          lrc: lyric,
          tlrc: tlyric,
          lxlrc: lxlyric,
        })
      })
    }).catch((err) => {
      console.log(err)
      if (targetSong.songmid !== musicInfo.songmid) return
      setAllStatus(t('lyric__load_error'))
    }).finally(() => {
      if (targetSong.songmid !== musicInfo.songmid) return
      window.eventHub.emit(eventPlayerNames.updateLyric, musicInfo)
    })
  }

  usePlayProgress({ setting, playNext })
  useMediaSessionInfo({ playPrev, playNext })
  usePlayEvent({
    playNext,
    setStatus,
    setUrl,
  })
  useLyric({
    setting,
  })
  useVolume({ setting })
  useWatchList({ playNext })

  // 恢复上次播放的状态
  const handleRestorePlay = async(restorePlayInfo) => {
    if (!restorePlayInfo.listId) return
    const list = getList(restorePlayInfo.listId)
    setPlayList(restorePlayInfo.listId)
    setPlayMusicInfo(restorePlayInfo.listId, list[restorePlayInfo.index])

    window.eventHub.emit(eventPlayerNames.setPlayInfo, {
      musicInfo: musicInfoItem.value,
      progress: {
        time: setting.value.player.isSavePlayTime ? (restorePlayInfo.time || 0) : 0,
        maxTime: restorePlayInfo.maxTime || 0,
      },
    })

    setImg({ musicInfo: musicInfoItem.value, listId: playMusicInfo.listId })
    setLrc(musicInfoItem.value)
    if (setting.value.player.togglePlayMethod == 'random') setPlayedList({ ...playMusicInfo })
  }

  const setPlayStatus = () => {
    setPlay(true)
    setTitle(`${musicInfo.name} - ${musicInfo.singer}`)
  }
  const setPauseStatus = () => {
    setPlay(false)
    setTitle()
  }
  const setStopStatus = () => {
    setPlay(false)
    setTitle()
    setStatus('')
    setStatusText('')
    setMusicInfo({
      songmid: null,
      img: null,
      lrc: null,
      tlrc: null,
      lxlrc: null,
      url: null,
      name: '',
      singer: '',
      album: '',
    })
  }

  // 播放音乐
  const playMusic = async() => {
    // console.log('playMusic')
    setStopStatus()
    if (window.restorePlayInfo) {
      handleRestorePlay(window.restorePlayInfo)
      window.restorePlayInfo = null
      return
    }

    if (playInfo.musicInfo) {
      setPlayerStop()
      window.eventHub.emit(eventPlayerNames.pause)
      setStopStatus()
    } else {
      window.eventHub.emit(eventPlayerNames.setStop)
    }

    clearDelayNextTimeout()

    let targetSong = playMusicInfo.musicInfo

    if (setting.value.player.togglePlayMethod == 'random' && !playMusicInfo.isTempPlay) setPlayedList({ ...playMusicInfo })

    if (targetSong.key) { // 如果是已下载的歌曲
      const filePath = path.join(setting.value.download.savePath, targetSong.metadata.fileName)
      // console.log(filePath)

      if (!await checkPath(filePath) || !targetSong.isComplate || /\.ape$/.test(filePath)) {
        return getList(playMusicInfo.listId).length == 1 ? null : playNext()
      }
      window.eventHub.emit(eventPlayerNames.setPlayInfo, {
        musicInfo: musicInfoItem.value,
        progress: {
          time: 0,
          maxTime: 0,
        },
      })
      setResource(filePath)
      // console.log(filePath)
    } else {
      // if (!this.assertApiSupport(targetSong.source)) return this.playNext()
      window.eventHub.emit(eventPlayerNames.setPlayInfo, {
        musicInfo: musicInfoItem.value,
        progress: {
          time: 0,
          maxTime: 0,
        },
      })
      setUrl(musicInfoItem.value)
    }

    setImg({ musicInfo: musicInfoItem.value, listId: playMusicInfo.listId })
    setLrc(musicInfoItem.value)
  }

  const handleSetPlayInfo = ({ musicInfo }) => {
    setMusicInfo({
      songmid: musicInfo.songmid,
      singer: musicInfo.singer,
      name: musicInfo.name,
      album: musicInfo.albumName,
    })
  }

  const handelStop = () => {
    setPlayerStop()
    window.eventHub.emit(eventPlayerNames.stop)
  }

  const handleEnded = () => {
    setAllStatus(t('player__end'))
    playNext()
  }

  // 播放、暂停播放切换
  const handleTogglePlay = async() => {
    if (isPlayerEmpty()) {
      if (playMusicInfo.listId == 'download') {
        const musicInfo = playMusicInfo.musicInfo
        const filePath = path.join(setting.value.download.savePath, musicInfo.metadata.fileName)
        if (!await checkPath(filePath) || !musicInfo.isComplate || /\.ape$/.test(filePath)) {
          if (downloadList.length == 1) {
            window.eventHub.emit(eventPlayerNames.setStop)
          } else {
            playNext()
          }
          return
        }
        setResource(filePath)
      } else {
        // if (!this.assertApiSupport(this.targetSong.source)) return this.playNext()
        setUrl(musicInfoItem.value)
      }
      return
    }
    if (isPlay.value) {
      setPlayerPause()
    } else {
      setPlayerPlay()
    }
  }

  watch(() => setting.value.player.togglePlayMethod, newValue => {
    setLoopPlay(newValue === 'singleLoop')
    if (playedList.length) clearPlayedList()
    if (newValue == 'random' && playMusicInfo.musicInfo && !playMusicInfo.isTempPlay) setPlayedList({ ...playMusicInfo })
  })

  setLoopPlay(setting.value.player.togglePlayMethod === 'singleLoop')


  window.eventHub.on(eventKeyPlayerNames.next.action, playNext)
  window.eventHub.on(eventKeyPlayerNames.prev.action, playPrev)
  window.eventHub.on(eventKeyPlayerNames.toggle_play.action, handleTogglePlay)

  window.eventHub.on(eventPlayerNames.play, setPlayStatus)
  window.eventHub.on(eventPlayerNames.pause, setPauseStatus)
  window.eventHub.on(eventPlayerNames.error, setPauseStatus)
  window.eventHub.on(eventPlayerNames.stop, setStopStatus)

  window.eventHub.on(eventPlayerNames.playMusic, playMusic)
  window.eventHub.on(eventPlayerNames.setTogglePlay, handleTogglePlay)
  window.eventHub.on(eventPlayerNames.setPlayPrev, playPrev)
  window.eventHub.on(eventPlayerNames.setPlayNext, playNext)
  window.eventHub.on(eventPlayerNames.setPlayInfo, handleSetPlayInfo)
  window.eventHub.on(eventPlayerNames.setStop, handelStop)

  window.eventHub.on(eventPlayerNames.player_ended, handleEnded)


  onBeforeUnmount(() => {
    window.eventHub.off(eventKeyPlayerNames.next.action, playNext)
    window.eventHub.off(eventKeyPlayerNames.prev.action, playPrev)
    window.eventHub.off(eventKeyPlayerNames.toggle_play.action, handleTogglePlay)

    window.eventHub.off(eventPlayerNames.play, setPlayStatus)
    window.eventHub.off(eventPlayerNames.pause, setPauseStatus)
    window.eventHub.off(eventPlayerNames.error, setPauseStatus)
    window.eventHub.off(eventPlayerNames.stop, setStopStatus)

    window.eventHub.off(eventPlayerNames.playMusic, playMusic)
    window.eventHub.off(eventPlayerNames.setTogglePlay, handleTogglePlay)
    window.eventHub.off(eventPlayerNames.setPlayPrev, playPrev)
    window.eventHub.off(eventPlayerNames.setPlayNext, playNext)
    window.eventHub.off(eventPlayerNames.setPlayInfo, handleSetPlayInfo)
    window.eventHub.off(eventPlayerNames.setStop, handelStop)

    window.eventHub.off(eventPlayerNames.player_ended, handleEnded)
  })
}
