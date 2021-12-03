import { onBeforeUnmount } from '@renderer/utils/vueTools'
import {
  onPlaying,
  onPause,
  onEnded,
  onError,
  onLoadeddata,
  onLoadstart,
  onCanplay,
  onEmptied,
  onWaiting,
  getErrorCode,
} from '@renderer/plugins/player'
import { player } from '@renderer/event/names'


export default () => {
  const rOnPlaying = onPlaying(() => {
    // console.log('onPlaying')
    window.eventHub.emit(player.player_playing)
    window.eventHub.emit(player.play)
  })
  const rOnPause = onPause(() => {
    // console.log('onPause')
    window.eventHub.emit(player.player_pause)
    window.eventHub.emit(player.pause)
  })
  const rOnEnded = onEnded(() => {
    // console.log('onEnded')
    window.eventHub.emit(player.player_ended)
    window.eventHub.emit(player.pause)
  })
  const rOnError = onError(() => {
    // console.log('onError')
    window.eventHub.emit(player.player_error, getErrorCode())
    window.eventHub.emit(player.error)
  })
  const rOnLoadeddata = onLoadeddata(() => {
    // console.log('onLoadeddata')
    window.eventHub.emit(player.player_loadeddata)
  })
  const rOnLoadstart = onLoadstart(() => {
    // console.log('onLoadstart')
    window.eventHub.emit(player.player_loadstart)
  })
  const rOnCanplay = onCanplay(() => {
    // console.log('onCanplay')
    window.eventHub.emit(player.player_canplay)
  })
  const rOnEmptied = onEmptied(() => {
    // console.log('onEmptied')
    window.eventHub.emit(player.player_emptied)
    // window.eventHub.emit(player.stop)
  })
  const rOnWaiting = onWaiting(() => {
    // console.log('onWaiting')
    window.eventHub.emit(player.player_waiting)
    window.eventHub.emit(player.pause)
  })


  onBeforeUnmount(() => {
    rOnPlaying()
    rOnPause()
    rOnEnded()
    rOnError()
    rOnLoadeddata()
    rOnLoadstart()
    rOnCanplay()
    rOnEmptied()
    rOnWaiting()
  })
}
