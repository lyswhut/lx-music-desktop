import Lyric from '@common/utils/lyric-font-player'
import { getAnalyser, getCurrentTime as getPlayerCurrentTime, onTimeupdate } from '@renderer/plugins/player'
import { togglePlay as playerTogglePlay, playNext as playerPlayNext, playPrev as playerPlayPrev } from '@renderer/core/player/action'
import { lyric, setLines, setOffset, setTempOffset, setText } from '@renderer/store/player/lyric'
import { isPlay, musicInfo } from '@renderer/store/player/state'
import { playProgress } from '@renderer/store/player/playProgress'
import { setStatusText } from '@renderer/store/player/action'
import { markRawList, watch } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { onNewDesktopLyricProcess } from '@renderer/utils/ipc'
import { throttle } from '@common/utils'

const getCurrentTime = () => {
  return getPlayerCurrentTime() * 1000
}

let rOnTimeupdate: () => void

let lrc: Lyric
const desktopLyricPorts: Set<Electron.IpcRendererEvent['ports'][0]> = new Set()
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

const cloneSafeData = <T>(data: T): T => {
  try {
    return JSON.parse(JSON.stringify(data))
  } catch (err) {
    console.error('[cloneSafeData] Failed to clone:', err)
    return data
  }
}

export const sendDesktopLyricInfo = (info: LX.DesktopLyric.LyricActions, transferList?: Transferable[]) => {
  if (desktopLyricPorts.size === 0) return
  for (const port of desktopLyricPorts) {
    try {
      if (transferList && 'data' in info && info.data instanceof Uint8Array) {
        const newArray = new Uint8Array(info.data.length)
        newArray.set(info.data)
        port.postMessage({ action: info.action, data: newArray }, [newArray.buffer])
      } else {
        port.postMessage({ action: info.action, ...('data' in info ? { data: cloneSafeData(info.data) } : {}) })
      }
    } catch (err) {
      console.error('[sendDesktopLyricInfo] postMessage failed:', err)
    }
  }
}
const handleDesktopLyricMessage = (action: LX.DesktopLyric.WinMainActions | string, data?: any) => {
  switch (action) {
    case 'get_info':
      sendDesktopLyricInfo({
        action: 'set_info',
        data: {
          id: musicInfo.id,
          pic: musicInfo.pic,
          singer: musicInfo.singer,
          name: musicInfo.name,
          album: musicInfo.album,
          lrc: musicInfo.lrc,
          tlrc: musicInfo.tlrc,
          rlrc: musicInfo.rlrc,
          lxlrc: musicInfo.lxlrc,
          isPlay: isPlay.value,
          line: lyric.line,
          played_time: getCurrentTime(),
          progress: playProgress.progress,
          duration: playProgress.maxPlayTime,
        },
      })
      if (lyric.text) {
        sendDesktopLyricInfo({
          action: 'set_lyric_line',
          data: lyric.text,
        })
      }
      break
    case 'get_status':
      sendDesktopLyricInfo({
        action: 'set_status',
        data: {
          isPlay: isPlay.value,
          line: lyric.line,
          played_time: getCurrentTime(),
          progress: playProgress.progress,
          duration: playProgress.maxPlayTime,
        },
      })
      break
    case 'get_analyser_data_array':
      analyserTools.sendDataArray()
      break
    case 'toggle_play':
      if (playerTogglePlay) playerTogglePlay()
      break
    case 'play_next':
      if (playerPlayNext) playerPlayNext()
      break
    case 'play_prev':
      if (playerPlayPrev) playerPlayPrev()
      break
    default:
      break
  }
}
export const init = () => {
  lrc = new Lyric({
    shadowContent: false,
    onPlay(line, text) {
      setText(text, Math.max(line, 0))
      setStatusText(text)
      window.app_event.lyricLinePlay(text, line)
      sendDesktopLyricInfo({
        action: 'set_lyric_line',
        data: text,
      })
      // console.log(line, text)
    },
    onSetLyric(lines, offset) { // listening lyrics seting event
      // console.log(lines) // lines is array of all lyric text
      setLines(markRawList([...lines]))
      setText(lines[0]?.text ?? '', 0)
      setOffset(offset) // 歌词延迟
      setTempOffset(0) // 重置临时延迟
    },
    onUpdateLyric(lines) {
      setLines(markRawList([...lines]))
      setText(lines[0]?.text ?? '', 0)
    },
    rate: appSetting['player.playbackRate'],
    // offset: 80,
  })

  onNewDesktopLyricProcess(({ event }) => {
    console.log('onNewDesktopLyricProcess')
    const [port] = event.ports
    desktopLyricPorts.add(port)

    port.onmessage = ({ data }) => {
      handleDesktopLyricMessage(data.action)
    }

    port.onmessageerror = (event) => {
      console.log('onmessageerror', event)
      desktopLyricPorts.delete(port)
    }

    if (lyric.text) {
      sendDesktopLyricInfo({
        action: 'set_lyric_line',
        data: lyric.text,
      })
    }
  })

  const throttleSendProgress = throttle(() => {
    sendDesktopLyricInfo({
      action: 'set_status',
      data: {
        isPlay: isPlay.value,
        line: lyric.line,
        played_time: getCurrentTime(),
        progress: playProgress.progress,
        duration: playProgress.maxPlayTime,
      },
    })
  }, 200)

  watch(() => playProgress.progress, () => {
    if (desktopLyricPorts.size > 0) {
      throttleSendProgress()
    }
  })

  watch(() => playProgress.maxPlayTime, () => {
    if (desktopLyricPorts.size > 0) {
      sendDesktopLyricInfo({
        action: 'set_status',
        data: {
          isPlay: isPlay.value,
          line: lyric.line,
          played_time: getCurrentTime(),
          progress: playProgress.progress,
          duration: playProgress.maxPlayTime,
        },
      })
    }
  })

  watch(() => lyric.text, (newText) => {
    if (desktopLyricPorts.size > 0 && newText) {
      sendDesktopLyricInfo({
        action: 'set_lyric_line',
        data: newText,
      })
    }
  })

  // 类似播放进度条，通过 audio 的 timeupdate 事件持续刷新歌词
  // 但仅在播放状态下才调用 lrc.play，暂停时不更新歌词（参照迷你播放桌面歌词逻辑）
  rOnTimeupdate = onTimeupdate(() => {
    const time = getCurrentTime()
    if (isPlay.value) lrc.play(time)
    if (desktopLyricPorts.size > 0) {
      sendDesktopLyricInfo({
        action: 'set_status',
        data: {
          isPlay: isPlay.value,
          line: lyric.line,
          played_time: time,
          progress: playProgress.progress,
          duration: playProgress.maxPlayTime,
        },
      })
    }
  })
}

export const cleanup = () => {
  if (rOnTimeupdate) rOnTimeupdate()
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
  sendDesktopLyricInfo({
    action: 'set_status',
    data: {
      isPlay: true,
      line: lyric.line,
      played_time: currentTime,
      progress: playProgress.progress,
      duration: playProgress.maxPlayTime,
    },
  })
}

export const pause = () => {
  const currentTime = getCurrentTime()
  lrc.pause()
  sendDesktopLyricInfo({ action: 'set_pause' })
  sendDesktopLyricInfo({
    action: 'set_status',
    data: {
      isPlay: false,
      line: lyric.line,
      played_time: currentTime,
      progress: playProgress.progress,
      duration: playProgress.maxPlayTime,
    },
  })
}

export const stop = () => {
  lrc.setLyric('')
  sendDesktopLyricInfo({ action: 'set_stop' })
  // setLines([])
  setText('', 0)
}

export const sendInfo = () => {
  sendDesktopLyricInfo({
    action: 'set_info',
    data: {
      id: musicInfo.id,
      pic: musicInfo.pic,
      singer: musicInfo.singer,
      name: musicInfo.name,
      album: musicInfo.album,
      lrc: musicInfo.lrc,
      tlrc: musicInfo.tlrc,
      rlrc: musicInfo.rlrc,
      lxlrc: musicInfo.lxlrc,
      isPlay: isPlay.value,
      line: lyric.line,
      played_time: getCurrentTime(),
      progress: playProgress.progress,
      duration: playProgress.maxPlayTime,
    },
  })
}