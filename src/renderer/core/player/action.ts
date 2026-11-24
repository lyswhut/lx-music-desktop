import { isEmpty, setPause, setPlay, setResource, setStop } from '@renderer/plugins/player'
import { isPlay, playedList, playInfo, playMusicInfo, tempPlayList, musicInfo as _musicInfo } from '@renderer/store/player/state'
import {
  getList,
  getPlaybackList,
  clearPlayedList,
  clearTempPlayeList,
  addTempPlayList,
  setPlayMusicInfo,
  addPlayedList,
  setMusicInfo,
  setAllStatus,
  removeTempPlayList,
  setPlayListId,
  removePlayedList,
} from '@renderer/store/player/action'
import { queueSession, updateQueueSessionMusic } from '@renderer/store/player/queueSession'
import { appSetting } from '@renderer/store/setting'
import { getMusicUrl, getPicPath, getLyricInfo } from '../music/index'
import { writebackToggleMusicInfo } from '../music/toggleWriteback'
import { filterList } from './utils'
import { requestMsg } from '@renderer/utils/message'
import { getRandom } from '@renderer/utils/index'
import { addListMusics, removeListMusics } from '@renderer/store/list/action'
import { loveList } from '@renderer/store/list/state'
import { addDislikeInfo } from '@renderer/core/dislikeList'
// import { checkMusicFileAvailable } from '@renderer/utils/music'

let gettingUrlId = ''
let musicUrlRequestId = 0
let playbackEpoch = 0
const createGettingUrlId = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
  const tInfo = 'progress' in musicInfo ? musicInfo.metadata.musicInfo.meta.toggleMusicInfo : musicInfo.meta.toggleMusicInfo
  return `${musicInfo.id}_${tInfo?.id ?? ''}`
}
const createDelayNextTimeout = (delay: number) => {
  let timeout: NodeJS.Timeout | null
  const clearDelayNextTimeout = () => {
    // console.log(this.timeout)
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  const addDelayNextTimeout = () => {
    clearDelayNextTimeout()
    timeout = setTimeout(() => {
      timeout = null
      if (window.lx.isPlayedStop) return
      console.warn('delay next timeout timeout', delay)
      void playNext(true, 'error')
    }, delay)
  }

  return {
    clearDelayNextTimeout,
    addDelayNextTimeout,
  }
}
const { addDelayNextTimeout, clearDelayNextTimeout } = createDelayNextTimeout(5000)
const { addDelayNextTimeout: addLoadTimeout, clearDelayNextTimeout: clearLoadTimeout } = createDelayNextTimeout(100000)

/**
 * 检查音乐信息是否已更改
 */
const diffCurrentMusicInfo = (curMusicInfo: LX.Music.MusicInfo | LX.Download.ListItem): boolean => {
  // return curMusicInfo !== playMusicInfo.musicInfo || isPlay.value
  return gettingUrlId != createGettingUrlId(curMusicInfo) || curMusicInfo.id != playMusicInfo.musicInfo?.id || isPlay.value
}

const isStaleMusicUrlRequest = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, requestId: number): boolean => {
  return requestId !== musicUrlRequestId || window.lx.isPlayedStop || diffCurrentMusicInfo(musicInfo)
}

const getMusicPlayUrl = async(musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, requestId: number, isRefresh = false, isRetryed = false, onResolvedMusicInfo?: (info: LX.Music.MusicInfoOnline) => void): Promise<string | null> => {
  // this.musicInfo.url = await getMusicPlayUrl(targetSong, type)
  setAllStatus(window.i18n.t('player__getting_url'))
  if (appSetting['player.autoSkipOnError']) addLoadTimeout()

  return getMusicUrl({
    musicInfo,
    isRefresh,
    alternativeMusicInfos: musicInfo === playMusicInfo.musicInfo ? playMusicInfo.alternativeMusicInfos : undefined,
    onResolvedMusicInfo,
    onToggleSource(mInfo) {
      if (isStaleMusicUrlRequest(musicInfo, requestId)) return
      setAllStatus(window.i18n.t('toggle_source_try'))
    },
    onToggleApiSource() {
      if (isStaleMusicUrlRequest(musicInfo, requestId)) return
      setAllStatus(window.i18n.t('toggle_api_source_try'))
    },
  }).then(url => {
    if (isStaleMusicUrlRequest(musicInfo, requestId)) return null

    return url
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  }).catch(err => {
    // console.log('err', err.message)
    if (isStaleMusicUrlRequest(musicInfo, requestId) ||
      err.message == requestMsg.cancelRequest) return null

    // 429 不再等待重试同源：音源轮换已在取流链内完成（ADR-0003）
    if (!isRetryed) return getMusicPlayUrl(musicInfo, requestId, isRefresh, true, onResolvedMusicInfo)

    throw err
  })
}

export const setMusicUrl = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, isRefresh?: boolean) => {
  // if (appSetting['player.autoSkipOnError']) addLoadTimeout()
  if (!diffCurrentMusicInfo(musicInfo)) return
  gettingUrlId = createGettingUrlId(musicInfo)
  const requestId = ++musicUrlRequestId
  let resolvedMusicInfo: LX.Music.MusicInfoOnline | undefined
  void getMusicPlayUrl(musicInfo, requestId, isRefresh, false, info => { resolvedMusicInfo = info }).then((url) => {
    if (!url || isStaleMusicUrlRequest(musicInfo, requestId)) return
    setResource(url)
    // Record the actual source without replacing the saved song or manual version.
    if (resolvedMusicInfo) {
      void writebackToggleMusicInfo(musicInfo, resolvedMusicInfo).catch(err => { console.log(err) })
    } else {
      playMusicInfo.resolvedMusicInfo = undefined
      playMusicInfo.versionNotice = undefined
    }
  }).catch((err: any) => {
    if (isStaleMusicUrlRequest(musicInfo, requestId)) return
    console.log(err)
    setAllStatus(err.message)
    window.app_event.error()
    if (appSetting['player.autoSkipOnError']) addDelayNextTimeout()
  }).finally(() => {
    // 同曲换源会改变歌曲身份；清理权只属于发起本次取流的请求。
    if (requestId === musicUrlRequestId) {
      gettingUrlId = ''
      clearLoadTimeout()
    }
  })
}

const isCurrentMusic = (info: LX.Music.MusicInfo | LX.Download.ListItem): boolean => playMusicInfo.musicInfo === info

// 恢复上次播放的状态
const handleRestorePlay = async(restorePlayInfo: LX.Player.SavedPlayInfo) => {
  const musicInfo = playMusicInfo.musicInfo
  if (!musicInfo) return

  setImmediate(() => {
    if (musicInfo.id != playMusicInfo.musicInfo?.id) return
    window.app_event.setProgress(appSetting['player.isSavePlayTime'] ? restorePlayInfo.time : 0, restorePlayInfo.maxTime)
    window.app_event.pause()
  })


  void getPicPath({ musicInfo, listId: playMusicInfo.listId }).then((url: string) => {
    if (!isCurrentMusic(musicInfo) || url == _musicInfo.pic) return
    setMusicInfo({ pic: url })
    window.app_event.picUpdated()
  }).catch(_ => _)

  void getLyricInfo({ musicInfo }).then((lyricInfo) => {
    if (!isCurrentMusic(musicInfo)) return
    setMusicInfo({
      lrc: lyricInfo.lyric,
      tlrc: lyricInfo.tlyric,
      lxlrc: lyricInfo.lxlyric,
      rlrc: lyricInfo.rlyric,
      rawlrc: lyricInfo.rawlrcInfo.lyric,
    })
    window.app_event.lyricUpdated()
  }).catch((err) => {
    console.log(err)
    if (!isCurrentMusic(musicInfo)) return
    setAllStatus(window.i18n.t('lyric__load_error'))
  })

  if (appSetting['player.togglePlayMethod'] == 'random' && !playMusicInfo.isTempPlay) addPlayedList({ ...playMusicInfo as LX.Player.PlayMusicInfo })
}


// 处理音乐播放
const handlePlay = () => {
  playbackEpoch++
  window.lx.isPlayedStop &&= false

  resetRandomNextMusicInfo()
  if (window.lx.restorePlayInfo) {
    void handleRestorePlay(window.lx.restorePlayInfo)
    window.lx.restorePlayInfo = null
    return
  }
  const musicInfo = playMusicInfo.musicInfo

  if (!musicInfo) return

  setStop()
  window.app_event.pause()

  clearDelayNextTimeout()
  clearLoadTimeout()


  if (appSetting['player.togglePlayMethod'] == 'random' && !playMusicInfo.isTempPlay) addPlayedList({ ...(playMusicInfo as LX.Player.PlayMusicInfo) })

  setMusicUrl(musicInfo)

  void getPicPath({ musicInfo, listId: playMusicInfo.listId }).then((url: string) => {
    if (!isCurrentMusic(musicInfo) || url == _musicInfo.pic) return
    setMusicInfo({ pic: url })
    window.app_event.picUpdated()
  }).catch(_ => _)

  void getLyricInfo({ musicInfo }).then((lyricInfo) => {
    if (!isCurrentMusic(musicInfo)) return
    setMusicInfo({
      lrc: lyricInfo.lyric,
      tlrc: lyricInfo.tlyric,
      lxlrc: lyricInfo.lxlyric,
      rlrc: lyricInfo.rlyric,
      rawlrc: lyricInfo.rawlrcInfo.lyric,
    })
    window.app_event.lyricUpdated()
  }).catch((err) => {
    console.log(err)
    if (!isCurrentMusic(musicInfo)) return
    setAllStatus(window.i18n.t('lyric__load_error'))
  })
}

/**
 * 播放列表内歌曲
 * @param listId 列表id
 * @param id 歌曲id
 */
export const playListById = (listId: string, id: string) => {
  const prevListId = playInfo.playerListId
  setPlayListId(listId)
  // pause()
  const musicInfo = getList(listId).find(m => m.id == id)
  if (!musicInfo) return
  playInfo.isSelectionQueue = false
  setPlayMusicInfo(listId, musicInfo)
  if (appSetting['player.isAutoCleanPlayedList'] || prevListId != listId) clearPlayedList()
  clearTempPlayeList()
  handlePlay()
}

/**
 * 播放列表内歌曲
 * @param listId 列表id
 * @param index 播放的歌曲位置
 */
export const playList = (listId: string, index: number) => {
  const prevListId = playInfo.playerListId
  setPlayListId(listId)
  // pause()
  playInfo.isSelectionQueue = false
  setPlayMusicInfo(listId, getList(listId)[index])
  if (appSetting['player.isAutoCleanPlayedList'] || prevListId != listId) clearPlayedList()
  clearTempPlayeList()
  handlePlay()
}

const handleToggleStop = () => {
  stop()
  const epoch = playbackEpoch
  setTimeout(() => {
    if (epoch === playbackEpoch) setPlayMusicInfo(null, null)
  })
}

let traversalEpoch = 0
export const capturePlaybackOwner = () => {
  const playback = playbackEpoch
  const music = playMusicInfo.musicInfo
  return () => playback === playbackEpoch && music === playMusicInfo.musicInfo
}
export const capturePlaybackContext = () => {
  const ownsPlayback = capturePlaybackOwner()
  const epoch = traversalEpoch
  const revision = queueSession.revision
  const listId = playInfo.playerListId
  const index = playInfo.playerPlayIndex
  const mode = appSetting['player.togglePlayMethod']
  return () => ownsPlayback() && epoch === traversalEpoch && revision === queueSession.revision &&
    listId === playInfo.playerListId && index === playInfo.playerPlayIndex && mode === appSetting['player.togglePlayMethod']
}
let randomNextRequest: { valid: () => boolean, promise: Promise<LX.Player.PlayMusicInfo | null> } | null = null
const randomNextMusicInfo = {
  info: null as LX.Player.PlayMusicInfo | null,
  valid: null as (() => boolean) | null,
  // index: -1,
}
export const getCachedRandomNextMusicInfo = () => appSetting['player.togglePlayMethod'] === 'random' && randomNextMusicInfo.valid?.() ? randomNextMusicInfo.info : null

export const resetRandomNextMusicInfo = () => {
  traversalEpoch++
  randomNextMusicInfo.info = null
  randomNextMusicInfo.valid = null
  randomNextRequest = null
}

export const getNextPlayMusicInfo = async(options: { advanceFromRemovedSource?: boolean } = {}): Promise<LX.Player.PlayMusicInfo | null> => {
  if (tempPlayList.length) return Promise.resolve(tempPlayList[0])
  const random = appSetting['player.togglePlayMethod'] === 'random'
  if (random && randomNextMusicInfo.info && randomNextMusicInfo.valid?.()) return Promise.resolve(randomNextMusicInfo.info)
  if (random && randomNextRequest?.valid()) return randomNextRequest.promise
  const valid = capturePlaybackContext()
  const promise = resolveNextPlayMusicInfo(valid, options.advanceFromRemovedSource === true)
  if (random) {
    const request = { valid, promise }
    randomNextRequest = request
    void promise.then(() => {
      if (randomNextRequest === request) randomNextRequest = null
    }, () => {
      if (randomNextRequest === request) randomNextRequest = null
    })
  }
  return promise
}

const resolveNextPlayMusicInfo = async(valid: () => boolean, advanceFromRemovedSource: boolean): Promise<LX.Player.PlayMusicInfo | null> => {
  if (tempPlayList.length) { // 如果稍后播放列表存在歌曲则直接播放改列表的歌曲
    const playMusicInfo = tempPlayList[0]
    return playMusicInfo
  }

  if (playMusicInfo.musicInfo == null) return null


  // console.log(playInfo.playerListId)
  const currentListId = playInfo.playerListId
  if (!currentListId) return null
  const currentList = getPlaybackList(currentListId)

  if (appSetting['player.togglePlayMethod'] === 'random' && playedList.length) { // 移除已播放列表内不存在原列表的歌曲
    let currentId: string
    if (playMusicInfo.isTempPlay) {
      const musicInfo = currentList[playInfo.playerPlayIndex]
      if (musicInfo) currentId = musicInfo.id
    } else {
      currentId = playMusicInfo.musicInfo.id
    }
    // 从已播放列表移除播放列表已删除的歌曲
    let index
    for (index = playedList.findIndex(m => m.musicInfo.id === currentId) + 1; index < playedList.length; index++) {
      const playMusicInfo = playedList[index]
      const currentId = playMusicInfo.musicInfo.id
      if (playMusicInfo.listId == currentListId && !currentList.some(m => m.id === currentId)) {
        removePlayedList(index)
        continue
      }
      break
    }

    if (index < playedList.length) return playedList[index]
  }
  // const isCheckFile = findNum > 2 // 针对下载列表，如果超过两次都碰到无效歌曲，则过滤整个列表内的无效歌曲
  let { filteredList, playerIndex, shouldResetPlayedList } = await filterList({ // 过滤已播放歌曲
    listId: currentListId,
    list: currentList,
    playedList: appSetting['player.togglePlayMethod'] === 'random' ? playedList : [],
    playerMusicInfo: currentList[playInfo.playerPlayIndex],
    isNext: true,
  })

  if (!valid()) return null
  if (tempPlayList.length) return tempPlayList[0]
  if (shouldResetPlayedList) clearPlayedList()
  if (!filteredList.length) return null
  // let currentIndex: number = filteredList.indexOf(currentList[playInfo.playerPlayIndex])
  let nextIndex = playerIndex

  let togglePlayMethod = appSetting['player.togglePlayMethod']
  switch (togglePlayMethod) {
    case 'listLoop':
      nextIndex = playerIndex === filteredList.length - 1 ? 0 : playerIndex + 1
      break
    case 'random':
      nextIndex = getRandom(0, filteredList.length)
      break
    case 'list':
      nextIndex = playerIndex === filteredList.length - 1 ? -1 : playerIndex + 1
      break
    case 'singleLoop':
      nextIndex = advanceFromRemovedSource ? playerIndex + 1 : Math.max(0, playerIndex)
      break
    default:
      return null
  }
  if (nextIndex < 0) return null

  const musicInfo = filteredList[nextIndex]
  if (!musicInfo) return null
  const nextPlayMusicInfo = {
    musicInfo,
    listId: currentListId,
    isTempPlay: false,
  }

  if (togglePlayMethod == 'random') {
    randomNextMusicInfo.info = nextPlayMusicInfo
    randomNextMusicInfo.valid = valid
    // randomNextMusicInfo.index = nextIndex
  }
  return nextPlayMusicInfo
}

export const playQueueMusic = (playMusicInfo: LX.Player.PlayMusicInfo, reason: LX.Player.MusicChangeReason = 'user') => {
  // pause()
  setPlayMusicInfo(playMusicInfo.listId, playMusicInfo.musicInfo, playMusicInfo.isTempPlay, playMusicInfo.alternativeMusicInfos, reason)
  handlePlay()
}

/**
 * 立即播放指定歌曲（单曲即播，不清空稍后播放队列）。
 * 与 playList/playListById 不同：它们会无条件 clearTempPlayeList()，
 * 本函数保留稍后播放队列与当前列表，供探索路径点击跳播等场景使用。
 * 注意必须走 handlePlay 的启动序列（setStop + setMusicUrl）：
 * 仅 setPlayMusicInfo + play() 不会更换音频资源（play() 只会在音频为空时取 URL，
 * 否则只是续播上一个加载的音频），用户会看着新标题继续听旧歌。
 */
export const playMusicInfoNow = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, listId: string | null = null, alternativeMusicInfos?: LX.Music.MusicInfoOnline[]) => {
  setPlayMusicInfo(listId, musicInfo, true, alternativeMusicInfos)
  handlePlay()
}
/** Restart a manually selected version without discarding the user's pending queue. */
export const restartSelectedVersion = (listId: string, musicInfo: LX.Music.MusicInfo, preview?: { musicInfo: LX.Music.MusicInfo, isTempPlay: boolean }) => {
  updateQueueSessionMusic(listId, musicInfo)
  let updatedOccurrence = false
  for (const entry of [...tempPlayList, ...playedList]) {
    if (entry.listId !== listId || entry.musicInfo.id !== musicInfo.id) continue
    entry.musicInfo = musicInfo
    updatedOccurrence = true
  }
  if (updatedOccurrence || playInfo.playerListId === listId) {
    queueSession.revision++
    resetRandomNextMusicInfo()
  }
  const isOriginal = playMusicInfo.listId === listId && playMusicInfo.musicInfo?.id === musicInfo.id
  const isPreview = preview && playMusicInfo.musicInfo === preview.musicInfo && playMusicInfo.isTempPlay
  if (!isOriginal && !isPreview) return
  setPlayMusicInfo(listId, musicInfo, isOriginal ? playMusicInfo.isTempPlay : preview!.isTempPlay, isOriginal ? playMusicInfo.alternativeMusicInfos : undefined, 'version')
  handlePlay()
}

/** An explicit selection replaces the pending queue and plays in visible list order. */
export const playMusicSelection = (list: Array<LX.Music.MusicInfo | LX.Download.ListItem>, listId: string | null) => {
  if (!list.length) return
  clearTempPlayeList()
  clearPlayedList()
  playInfo.isSelectionQueue = true
  setPlayListId(null)
  setPlayMusicInfo(listId, list[0], true, undefined, 'selection')
  addTempPlayList(list.slice(1).map(musicInfo => ({ listId, musicInfo })))
  handlePlay()
}

/**
 * 下一曲
 * @param isAutoToggle 是否自动切换
 * @returns
 */
export const playNext = async(isAutoToggle = false, reason: LX.Player.MusicChangeReason = isAutoToggle ? 'ended' : 'user'): Promise<void> => {
  const ownsPlayback = capturePlaybackOwner()
  while (ownsPlayback()) {
    console.log('skip next', isAutoToggle)
    if (tempPlayList.length) { // 如果稍后播放列表存在歌曲则直接播放改列表的歌曲
      const playMusicInfo = tempPlayList[0]
      removeTempPlayList(0)
      playQueueMusic(playMusicInfo, reason)
      console.log('play temp list')
      return
    }

    if (playMusicInfo.musicInfo == null) {
      handleToggleStop()
      console.log('musicInfo empty')
      return
    }

    // console.log(playInfo.playerListId)
    const currentListId = playInfo.playerListId
    if (!currentListId) {
      handleToggleStop()
      console.log('currentListId empty')
      return
    }
    const currentList = getPlaybackList(currentListId)

    if (appSetting['player.togglePlayMethod'] === 'random' && playedList.length) { // 移除已播放列表内不存在原列表的歌曲
      let currentId: string
      if (playMusicInfo.isTempPlay) {
        const musicInfo = currentList[playInfo.playerPlayIndex]
        if (musicInfo) currentId = musicInfo.id
      } else {
        currentId = playMusicInfo.musicInfo.id
      }
      // 从已播放列表移除播放列表已删除的歌曲
      let index
      for (index = playedList.findIndex(m => m.musicInfo.id === currentId) + 1; index < playedList.length; index++) {
        const playMusicInfo = playedList[index]
        const currentId = playMusicInfo.musicInfo.id
        if (playMusicInfo.listId == currentListId && !currentList.some(m => m.id === currentId)) {
          removePlayedList(index)
          continue
        }
        break
      }

      if (index < playedList.length) {
        playQueueMusic(playedList[index], reason)
        console.log('play played list')
        return
      }
    }
    if (appSetting['player.togglePlayMethod'] === 'random') {
      const valid = capturePlaybackContext()
      const next = await getNextPlayMusicInfo()
      if (!valid()) continue
      if (tempPlayList.length) continue
      if (next) playQueueMusic(next, reason)
      else handleToggleStop()
      return
    }
    // const isCheckFile = findNum > 2 // 针对下载列表，如果超过两次都碰到无效歌曲，则过滤整个列表内的无效歌曲
    const valid = capturePlaybackContext()
    let { filteredList, playerIndex, shouldResetPlayedList } = await filterList({ // 过滤已播放歌曲
      listId: currentListId,
      list: currentList,
      playedList: [],
      playerMusicInfo: currentList[playInfo.playerPlayIndex],
      isNext: true,
    })

    if (!valid()) continue
    if (tempPlayList.length) continue
    if (shouldResetPlayedList) clearPlayedList()
    if (!filteredList.length) {
      handleToggleStop()
      console.log('filtered list empty')
      return
    }
    // let currentIndex: number = filteredList.indexOf(currentList[playInfo.playerPlayIndex])
    let nextIndex = playerIndex

    let togglePlayMethod = appSetting['player.togglePlayMethod']
    if (!isAutoToggle) {
      switch (togglePlayMethod) {
        case 'list':
        case 'singleLoop':
        case 'none':
          togglePlayMethod = 'listLoop'
      }
    }
    switch (togglePlayMethod) {
      case 'listLoop':
        nextIndex = playerIndex === filteredList.length - 1 ? 0 : playerIndex + 1
        break
      case 'list':
        nextIndex = playerIndex === filteredList.length - 1 ? -1 : playerIndex + 1
        break
      case 'singleLoop':
        nextIndex = Math.max(0, playerIndex)
        break
      default:
        nextIndex = -1
        console.log('stop toggle play', togglePlayMethod, isAutoToggle)
        return
    }
    if (nextIndex < 0) {
      console.log('next index empty')
      return
    }

    playQueueMusic({
      musicInfo: filteredList[nextIndex],
      listId: currentListId,
      isTempPlay: false,
    }, reason)
    return
  }
}

/**
 * 上一曲
 */
export const playPrev = async(isAutoToggle = false): Promise<void> => {
  const ownsPlayback = capturePlaybackOwner()
  while (ownsPlayback()) {
    if (playMusicInfo.musicInfo == null) {
      handleToggleStop()
      return
    }

    const currentListId = playInfo.playerListId
    if (!currentListId) {
      handleToggleStop()
      return
    }
    const currentList = getPlaybackList(currentListId)

    if (appSetting['player.togglePlayMethod'] === 'random' && playedList.length) {
      let currentId: string
      if (playMusicInfo.isTempPlay) {
        const musicInfo = currentList[playInfo.playerPlayIndex]
        if (musicInfo) currentId = musicInfo.id
      } else {
        currentId = playMusicInfo.musicInfo.id
      }
      // 从已播放列表移除播放列表已删除的歌曲
      let index
      for (index = playedList.findIndex(m => m.musicInfo.id === currentId) - 1; index > -1; index--) {
        const playMusicInfo = playedList[index]
        const currentId = playMusicInfo.musicInfo.id
        if (playMusicInfo.listId == currentListId && !currentList.some(m => m.id === currentId)) {
          removePlayedList(index)
          continue
        }
        break
      }

      if (index > -1) {
        playQueueMusic(playedList[index])
        return
      }
    }

    // const isCheckFile = findNum > 2
    const valid = capturePlaybackContext()
    let { filteredList, playerIndex, shouldResetPlayedList } = await filterList({ // 过滤已播放歌曲
      listId: currentListId,
      list: currentList,
      playedList: appSetting['player.togglePlayMethod'] === 'random' ? playedList : [],
      playerMusicInfo: currentList[playInfo.playerPlayIndex],
      isNext: false,
    })
    if (!valid()) continue
    if (shouldResetPlayedList) clearPlayedList()
    if (!filteredList.length) {
      handleToggleStop()
      return
    }

    // let currentIndex = filteredList.indexOf(currentList[playInfo.playerPlayIndex])
    if (playerIndex == -1 && filteredList.length) playerIndex = 0
    let nextIndex = playerIndex
    if (!playMusicInfo.isTempPlay) {
      let togglePlayMethod = appSetting['player.togglePlayMethod']
      if (!isAutoToggle) {
        switch (togglePlayMethod) {
          case 'list':
          case 'singleLoop':
          case 'none':
            togglePlayMethod = 'listLoop'
        }
      }
      switch (togglePlayMethod) {
        case 'random':
          nextIndex = getRandom(0, filteredList.length)
          break
        case 'listLoop':
        case 'list':
          nextIndex = playerIndex === 0 ? filteredList.length - 1 : playerIndex - 1
          break
        case 'singleLoop':
          break
        default:
          nextIndex = -1
          return
      }
      if (nextIndex < 0) return
    }

    playQueueMusic({
      musicInfo: filteredList[nextIndex],
      listId: currentListId,
      isTempPlay: false,
    })
    return
  }
}

/**
 * 恢复播放
 */
export const play = () => {
  playbackEpoch++
  window.lx.isPlayedStop &&= false
  if (playMusicInfo.musicInfo == null) return
  if (isEmpty()) {
    if (createGettingUrlId(playMusicInfo.musicInfo) != gettingUrlId) setMusicUrl(playMusicInfo.musicInfo)
    return
  }
  setPlay()
}

/**
 * 暂停播放
 */
export const pause = () => {
  setPause()
}

/**
 * 停止播放
 */
export const stop = () => {
  // Stop owns cancellation even while the current song remains visible awaiting a successor.
  musicUrlRequestId++
  gettingUrlId = ''
  clearLoadTimeout()
  clearDelayNextTimeout()
  resetRandomNextMusicInfo()
  const epoch = ++playbackEpoch
  setStop()
  setTimeout(() => {
    if (epoch === playbackEpoch) window.app_event.stop()
  })
}

/**
 * 播放、暂停播放切换
 */
export const togglePlay = () => {
  window.lx.isPlayedStop &&= false
  if (isPlay.value) {
    pause()
  } else {
    play()
  }
}

/**
 * 收藏当前播放的歌曲
 */
export const collectMusic = () => {
  if (!playMusicInfo.musicInfo) return
  void addListMusics(loveList.id, ['progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo])
}

/**
 * 取消收藏当前播放的歌曲
 */
export const uncollectMusic = () => {
  if (!playMusicInfo.musicInfo) return
  void removeListMusics({ listId: loveList.id, ids: ['progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo.id : playMusicInfo.musicInfo.id] })
}

/**
 * 不喜欢当前播放的歌曲
 */
export const dislikeMusic = async() => {
  if (!playMusicInfo.musicInfo) return
  const minfo = 'progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo
  await addDislikeInfo([{ name: minfo.name, singer: minfo.singer }])
  await playNext(true, 'user')
}
