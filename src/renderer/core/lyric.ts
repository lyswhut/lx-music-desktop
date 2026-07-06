import Lyric from '@common/utils/lyric-font-player'
import { getAnalyser, getCurrentTime as getPlayerCurrentTime } from '@renderer/plugins/player'
import { lyric, setLines, setOffset, setTempOffset, setText } from '@renderer/store/player/lyric'
import { isPlay, musicInfo, playMusicInfo } from '@renderer/store/player/state'
import { setStatusText } from '@renderer/store/player/action'
import { markRawList } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { loveList } from '@renderer/store/list/state'
import { checkListExistMusic } from '@renderer/store/list/action'
import { onNewDesktopLyricProcess, onThemeChange, sendTaskbarLyricState } from '@renderer/utils/ipc'

const getCurrentTime = () => {
  return getPlayerCurrentTime() * 1000
}

let lrc: Lyric
let desktopLyricPort: Electron.IpcRendererEvent['ports'][0] | null = null
const analyserTools: {
  dataArray: Uint8Array
  bufferLength: number
  analyser: AnalyserNode | null
  sendDataArray: () => void
} = {
  dataArray: new Uint8Array(),
  bufferLength: 0,
  analyser: null,
  sendDataArray() {
    if (this.analyser == null) {
      this.analyser = getAnalyser()
      // console.log(this.analyser)
      if (!this.analyser) return
      this.bufferLength = this.analyser.frequencyBinCount
    }
    const dataArray = new Uint8Array(this.bufferLength)
    this.analyser.getByteFrequencyData(dataArray)
    sendDesktopLyricInfo({
      action: 'send_analyser_data_array',
      data: dataArray,
    }, [dataArray.buffer])
  },
}

export const sendDesktopLyricInfo = (info: LX.DesktopLyric.LyricActions, transferList?: Transferable[]) => {
  if (desktopLyricPort == null) return
  if (transferList) desktopLyricPort.postMessage(info, transferList)
  else desktopLyricPort.postMessage(info)
}

let isCollected = false
let collectStatusCheckInfo: { songId: string, promise: Promise<boolean> } | null = null
const DEFAULT_THEME_COLOR = 'rgb(77, 175, 124)'
let removeThemeChangeListener: null | (() => void) = null

const getTaskbarLyricThemeColor = () => {
  const color = window.getComputedStyle(document.documentElement).getPropertyValue('--color-theme').trim()
  return color || DEFAULT_THEME_COLOR
}

const sendTaskbarLyricStateSnapshot = () => {
  sendTaskbarLyricState(getTaskbarLyricState())
}

const refreshTaskbarLyricCollectStatus = async() => {
  const songId = playMusicInfo.musicInfo?.id
  if (!songId) {
    const changed = isCollected
    isCollected = false
    collectStatusCheckInfo = null
    return changed
  }

  if (collectStatusCheckInfo?.songId == songId) return collectStatusCheckInfo.promise

  let refreshPromise: Promise<boolean>
  refreshPromise = checkListExistMusic(loveList.id, songId)
    .then(status => {
      if (playMusicInfo.musicInfo?.id != songId) return false
      if (isCollected == status) return false
      isCollected = status
      return true
    })
    .finally(() => {
      if (collectStatusCheckInfo?.songId == songId && collectStatusCheckInfo.promise === refreshPromise) collectStatusCheckInfo = null
    })
  collectStatusCheckInfo = {
    songId,
    promise: refreshPromise,
  }
  return refreshPromise
}

const syncTaskbarLyricCollectState = () => {
  void refreshTaskbarLyricCollectStatus().then(changed => {
    if (!changed) return
    sendTaskbarLyricStateSnapshot()
  })
}

const getTaskbarLyricState = (): LX.TaskbarLyric.State => {
  return {
    enabled: appSetting['taskbarLyric.enable'],
    isPlaying: isPlay.value,
    isCollected,
    songId: musicInfo.id,
    title: musicInfo.name,
    artist: musicInfo.singer,
    lyricLine: lyric.text,
    albumCoverUrl: musicInfo.pic,
    offsetX: appSetting['taskbarLyric.offsetX'],
    showCover: appSetting['taskbarLyric.showCover'],
    showSongInfo: appSetting['taskbarLyric.showSongInfo'],
    showCurrentLine: appSetting['taskbarLyric.showCurrentLine'],
    swapTitleAndArtist: appSetting['taskbarLyric.swapTitleAndArtist'],
    themeColor: getTaskbarLyricThemeColor(),
    backgroundColorMode: appSetting['taskbarLyric.style.backgroundColorMode'],
    backgroundColor: appSetting['taskbarLyric.style.backgroundColor'],
    backgroundOpacity: appSetting['taskbarLyric.style.backgroundOpacity'],
    songInfoFontColorMode: appSetting['taskbarLyric.style.songInfoFontColorMode'],
    songInfoFontColor: appSetting['taskbarLyric.style.songInfoFontColor'],
    lyricFontColorMode: appSetting['taskbarLyric.style.lyricFontColorMode'],
    lyricFontColor: appSetting['taskbarLyric.style.lyricFontColor'],
    songInfoFontSize: appSetting['taskbarLyric.style.songInfoFontSize'],
    lyricFontSize: appSetting['taskbarLyric.style.lyricFontSize'],
  }
}

const syncTaskbarLyricState = () => {
  sendTaskbarLyricStateSnapshot()
  syncTaskbarLyricCollectState()
}

const handleDesktopLyricMessage = (action: LX.DesktopLyric.WinMainActions) => {
  switch (action) {
    case 'get_info':
      sendDesktopLyricInfo({
        action: 'set_info',
        data: {
          id: musicInfo.id,
          singer: musicInfo.singer,
          name: musicInfo.name,
          album: musicInfo.album,
          lrc: musicInfo.lrc,
          tlrc: musicInfo.tlrc,
          rlrc: musicInfo.rlrc,
          lxlrc: musicInfo.lxlrc,
          // pic: musicInfo.pic,
          isPlay: isPlay.value,
          line: lyric.line,
          played_time: getCurrentTime(),
        },
      })
      break
    case 'get_status':
      sendDesktopLyricInfo({
        action: 'set_status',
        data: {
          isPlay: isPlay.value,
          line: lyric.line,
          played_time: getCurrentTime(),
        },
      })
      break
    case 'get_analyser_data_array':
      analyserTools.sendDataArray()
      break
    default:
      break
  }
}

export const init = () => {
  const handleLoveListUpdate = (ids: string[]) => {
    if (!ids.includes(loveList.id)) return
    syncTaskbarLyricCollectState()
  }

  lrc = new Lyric({
    shadowContent: false,
    onPlay(line, text) {
      setText(text, Math.max(line, 0))
      setStatusText(text)
      window.app_event.lyricLinePlay(text, line)
      syncTaskbarLyricState()
      // console.log(line, text)
    },
    onSetLyric(lines, offset) { // listening lyrics seting event
      // console.log(lines) // lines is array of all lyric text
      setLines(markRawList([...lines]))
      setText(lines[0] ?? '', 0)
      setOffset(offset) // Apply parsed lyric offset
      setTempOffset(0) // Reset temporary offset
      syncTaskbarLyricState()
    },
    onUpdateLyric(lines) {
      setLines(markRawList([...lines]))
      setText(lines[0] ?? '', 0)
      syncTaskbarLyricState()
    },
    rate: appSetting['player.playbackRate'],
    // offset: 80,
  })

  onNewDesktopLyricProcess(({ event }) => {
    const [port] = event.ports
    desktopLyricPort = port

    port.onmessage = ({ data }) => {
      handleDesktopLyricMessage(data.action)
      // The event data can be any serializable object (and the event could even
      // carry other MessagePorts with it!)
      // const result = doWork(event.data)
      // port.postMessage(result)
    }

    port.onmessageerror = (event) => {
      console.log('onmessageerror', event)
    }
  })

  removeThemeChangeListener?.()
  removeThemeChangeListener = onThemeChange(() => {
    sendTaskbarLyricStateSnapshot()
  })

  window.app_event.on('myListUpdate', handleLoveListUpdate)
}

export const setLyricOffset = (offset: number) => {
  const tempOffset = offset - lyric.offset
  setTempOffset(tempOffset)
  lrc.setOffset(tempOffset)
  sendDesktopLyricInfo({
    action: 'set_offset',
    data: tempOffset,
  })

  if (isPlay.value) {
    setTimeout(() => {
      const time = getCurrentTime()
      sendDesktopLyricInfo({
        action: 'set_play',
        data: time,
      })
      lrc.play(time)
    })
  }
}

export const setPlaybackRate = (rate: number) => {
  lrc.setPlaybackRate(rate)

  if (isPlay.value) {
    setTimeout(() => {
      const time = getCurrentTime()
      lrc.play(time)
    })
  }
}

export const setLyric = () => {
  if (!musicInfo.id) return
  if (musicInfo.lrc) {
    const extendedLyrics = []
    if (appSetting['player.isShowLyricRoma'] && musicInfo.rlrc) extendedLyrics.push(musicInfo.rlrc)
    if (appSetting['player.isShowLyricTranslation'] && musicInfo.tlrc) extendedLyrics.push(musicInfo.tlrc)
    if (appSetting['player.isSwapLyricTranslationAndRoma']) extendedLyrics.reverse()

    lrc.setLyric(
      appSetting['player.isPlayLxlrc'] && musicInfo.lxlrc ? musicInfo.lxlrc : musicInfo.lrc,
      extendedLyrics,
    )
    sendDesktopLyricInfo({
      action: 'set_lyric',
      data: {
        lrc: musicInfo.lrc,
        tlrc: musicInfo.tlrc,
        rlrc: musicInfo.rlrc,
        lxlrc: musicInfo.lxlrc,
      },
    })
  }

  if (isPlay.value) {
    setTimeout(() => {
      const time = getCurrentTime()
      sendDesktopLyricInfo({ action: 'set_play', data: time })
      lrc.play(time)
    })
  }

  syncTaskbarLyricState()
}

export const setDisabledAutoPause = (disabledAutoPause: boolean) => {
  lrc.setDisabledAutoPause(disabledAutoPause)
}

let sources = new Map<string, boolean>()
let prevDisabled = false
export const setDisableAutoPauseBySource = (disabled: boolean, source: string) => {
  sources.set(source, disabled)
  const currentDisabled = Array.from(sources.values()).some(e => e)
  if (prevDisabled == currentDisabled) return
  prevDisabled = currentDisabled
  setDisabledAutoPause(currentDisabled)
}


export const play = () => {
  // if (!musicInfo.lrc) return
  const currentTime = getCurrentTime()
  lrc.play(currentTime)
  sendDesktopLyricInfo({ action: 'set_play', data: currentTime })
  syncTaskbarLyricState()
}

export const pause = () => {
  lrc.pause()
  sendDesktopLyricInfo({ action: 'set_pause' })
  syncTaskbarLyricState()
}

export const stop = () => {
  lrc.setLyric('')
  sendDesktopLyricInfo({ action: 'set_stop' })
  // setLines([])
  setText('', 0)
  syncTaskbarLyricState()
}

export const sendInfo = () => {
  sendDesktopLyricInfo({
    action: 'set_info',
    data: {
      id: musicInfo.id,
      singer: musicInfo.singer,
      name: musicInfo.name,
      album: musicInfo.album,
      lrc: musicInfo.lrc,
      tlrc: musicInfo.tlrc,
      rlrc: musicInfo.rlrc,
      lxlrc: musicInfo.lxlrc,
      // pic: musicInfo.pic,
      isPlay: isPlay.value,
      line: lyric.line,
      played_time: getCurrentTime(),
    },
  })
  syncTaskbarLyricState()
}
