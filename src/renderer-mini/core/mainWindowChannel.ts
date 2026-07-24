import { onProvideMainWindowChannel, sendConnectMainWindowEvent } from '../utils/ipc'
import { setMusicInfo, setIsPlay, setCurrentLyric, setProgress, setDuration } from '../store/action'

let mainWindowPort: MessagePort | null = null

// 向主渲染窗口发送动作请求
export const sendPlayerAction = (action: LX.DesktopLyric.WinMainActions) => {
  if (mainWindowPort == null) return
  mainWindowPort.postMessage({ action })
}

// 处理主渲染窗口发回的消息
const handleMessage = (event: MessageEvent) => {
  const data = event.data
  switch (data.action) {
    case 'set_info':
      setMusicInfo({
        id: data.data.id,
        pic: data.data.pic,
        singer: data.data.singer,
        name: data.data.name,
        album: data.data.album,
      })
      if (data.data.isPlay != null) setIsPlay(data.data.isPlay)
      if (data.data.progress != null) setProgress(data.data.progress)
      if (data.data.duration != null) setDuration(data.data.duration)
      break
    case 'set_status':
      if (data.data.isPlay != null) setIsPlay(data.data.isPlay)
      if (data.data.progress != null) setProgress(data.data.progress)
      if (data.data.duration != null) setDuration(data.data.duration)
      break
    case 'set_progress':
      if (data.data.progress != null) setProgress(data.data.progress)
      break
    case 'set_lyric_line':
      if (data.data != null) setCurrentLyric(data.data)
      break
    default:
      break
  }
}

export const init = () => {
  onProvideMainWindowChannel(({ event }) => {
    const [port] = event.ports
    mainWindowPort = port

    port.onmessage = handleMessage

    getInfo()
    getStatus()
  })

  setTimeout(() => {
    sendConnectMainWindowEvent()
  }, 100)
}

export const getInfo = () => {
  sendPlayerAction('get_info')
}

export const getStatus = () => {
  sendPlayerAction('get_status')
}

export const togglePlay = () => {
  sendPlayerAction('toggle_play')
}

export const playPrev = () => {
  sendPlayerAction('play_prev')
}

export const playNext = () => {
  sendPlayerAction('play_next')
}