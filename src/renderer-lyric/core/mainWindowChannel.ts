import { onProvideMainWindowChannel } from '@lyric/utils/ipc'
import { onBeforeUnmount } from '@common/utils/vueTools'
import { setMusicInfo, setIsPlay } from '../store/action'
import { pause, play, setLyric, setLyricOffset, setPlaybackRate, stop } from './lyric'
import { lyrics } from '@lyric/store/lyric'

let mainWindowPort: Electron.IpcRendererEvent['ports'][0] | null = null
export const sendDesktopLyricInfo = (info: LX.DesktopLyric.WinMainActions) => {
  if (mainWindowPort == null) return
  mainWindowPort.postMessage({ action: info })
}

const listeners: Array<(event: LX.DesktopLyric.LyricActions) => void> = []

const handleDesktopLyricMessage = (event: LX.DesktopLyric.LyricActions) => {
  switch (event.action) {
    case 'set_info':
      setMusicInfo({
        id: event.data.id,
        singer: event.data.singer,
        name: event.data.name,
        album: event.data.album,
      })
      lyrics.lyric = event.data.lrc ?? ''
      lyrics.tlyric = event.data.tlrc
      lyrics.rlyric = event.data.rlrc
      lyrics.lxlyric = event.data.lxlrc
      setLyric()
      if (event.data.isPlay) {
        setImmediate(() => {
          getStatus()
        })
      }
      break
    case 'set_lyric':
      lyrics.lyric = event.data.lrc ?? ''
      lyrics.tlyric = event.data.tlrc
      lyrics.rlyric = event.data.rlrc
      lyrics.lxlyric = event.data.lxlrc
      setLyric()
      break
    case 'set_status':
      setIsPlay(event.data.isPlay)
      if (event.data.isPlay) play(event.data.played_time)
      else pause()
      break
    case 'set_offset':
      setLyricOffset(event.data)
      break
    case 'set_playbackRate':
      setPlaybackRate(event.data)
      break
    case 'set_pause':
      setIsPlay(false)
      pause()
      break
    case 'set_play':
      setIsPlay(true)
      play(event.data)
      break
    case 'set_stop':
      setIsPlay(false)
      stop()
      break
    default:
      for (const listener of listeners) {
        listener(event)
      }
      break
  }
}

export const init = () => {
  onProvideMainWindowChannel(({ event }) => {
    const [port] = event.ports
    mainWindowPort = port

    // ... register a handler to receive results ...
    port.onmessage = ({ data }) => {
      handleDesktopLyricMessage(data)
      // console.log('received result:', data)
    }
    // ... and start sending it work!

    port.onmessageerror = (event) => {
      console.log('onmessageerror', event)
    }

    getInfo()
  })
}

export const useEvent = (listener: (event: LX.DesktopLyric.LyricActions) => void) => {
  listeners.push(listener)

  onBeforeUnmount(() => {
    listeners.splice(listeners.indexOf(listener), 1)
  })
}

export const getInfo = () => {
  sendDesktopLyricInfo('get_info')
}

export const getAnalyserDataArray = () => {
  sendDesktopLyricInfo('get_analyser_data_array')
}

export const getStatus = () => {
  sendDesktopLyricInfo('get_status')
}
