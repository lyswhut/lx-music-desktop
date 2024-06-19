import Lyric from '@common/utils/lyric-font-player'
import { getAnalyser, getCurrentTime as getPlayerCurrentTime } from '@renderer/plugins/player'
import { lyric, setLines, setOffset, setTempOffset, setText } from '@renderer/store/player/lyric'
import { isPlay, musicInfo } from '@renderer/store/player/state'
import { setStatusText } from '@renderer/store/player/action'
import { markRawList } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { onNewDesktopLyricProcess } from '@renderer/utils/ipc'

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
  lrc = new Lyric({
    shadowContent: false,
    onPlay(line, text) {
      setText(text, Math.max(line, 0))
      setStatusText(text)
      window.app_event.lyricLinePlay(text, line)
      // console.log(line, text)
    },
    onSetLyric(lines, offset) { // listening lyrics seting event
      // console.log(lines) // lines is array of all lyric text
      setLines(markRawList([...lines]))
      setText(lines[0] ?? '', 0)
      setOffset(offset) // 歌词延迟
      setTempOffset(0) // 重置临时延迟
    },
    onUpdateLyric(lines) {
      setLines(markRawList([...lines]))
      setText(lines[0] ?? '', 0)
    },
    rate: appSetting['player.playbackRate'],
    // offset: 80,
  })

  onNewDesktopLyricProcess(({ event }) => {
    console.log('onNewDesktopLyricProcess')
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
    if (appSetting['player.isShowLyricTranslation'] && musicInfo.tlrc) extendedLyrics.push(musicInfo.tlrc)
    if (appSetting['player.isShowLyricRoma'] && musicInfo.rlrc) extendedLyrics.push(musicInfo.rlrc)
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
}

export const pause = () => {
  lrc.pause()
  sendDesktopLyricInfo({ action: 'set_pause' })
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
}
