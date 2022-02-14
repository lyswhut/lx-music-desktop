import { ref, computed } from '@renderer/utils/vueTools'
import { rendererSend, rendererOn, NAMES } from '@common/ipc'
import { isPlay } from '@renderer/core/share/player'
import store from '@renderer/store'
import { player as eventPlayerNames } from '@renderer/event/names'

global.isPlayedStop = false

const time = ref(-1)


const timeoutTools = {
  inited: false,
  isRunning: false,
  timeout: null,
  time: -1,
  id: 'play__stop__timeout',
  exit() {
    const setting = store.getters.setting
    global.isPlayedStop = true
    if (!setting.player.waitPlayEndStop && isPlay.value) {
      window.eventHub.emit(eventPlayerNames.setPause)
    }
  },
  clearTimeout() {
    rendererSend(NAMES.mainWindow.interval_cancel, this.id)
    if (!this.isRunning) return
    this.time = -1
    time.value = -1
    this.isRunning = false
  },
  start(_time) {
    this.clearTimeout()
    this.time = _time
    time.value = _time
    this.isRunning = true
    rendererSend(NAMES.mainWindow.interval, {
      time: 1000,
      id: this.id,
    })
  },
  init() {
    if (this.inited) return
    this.clearTimeout()
    rendererOn(NAMES.mainWindow.interval_callback, (event, id) => {
      if (id !== this.id) return

      if (this.time > 0) {
        this.time--
        time.value--
      } else {
        this.clearTimeout()
        this.exit()
      }
    })
    this.inited = true
  },
}

export const init = () => {
  timeoutTools.init()
}

export const startTimeoutStop = time => {
  if (global.isPlayedStop) global.isPlayedStop = false
  timeoutTools.start(time)
}
export const stopTimeoutStop = () => {
  if (global.isPlayedStop) global.isPlayedStop = false
  timeoutTools.clearTimeout()
}

const formatTime = time => {
  // let d = parseInt(time / 86400)
  // d = d ? d.toString() + ':' : ''
  // time = time % 86400
  let h = parseInt(time / 3600)
  h = h ? h.toString() + ':' : ''
  time = time % 3600
  const m = parseInt(time / 60).toString().padStart(2, '0')
  const s = parseInt(time % 60).toString().padStart(2, '0')
  return `${h}${m}:${s}`
}
export const useTimeout = () => {
  const timeLabel = computed(() => {
    return time.value > 0 ? formatTime(time.value) : ''
  })

  return {
    time,
    timeLabel,
  }
}
