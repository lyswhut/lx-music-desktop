import { onBeforeUnmount, watch, useCommit } from '@renderer/utils/vueTools'
import { setVolume as setPlayerVolume, setMute as setPlayerMute } from '@renderer/plugins/player'

import { debounce } from '@renderer/utils'
import { player as eventKeyPlayerNames } from '@common/hotKey'
// import { player as eventPlayerNames } from '@renderer/event/names'
import { volume, isMute, setMute, setVolume } from '@renderer/core/share/volume'

export default ({ setting }) => {
  const saveVolume = useCommit('setVolume')

  const handleSaveVolume = debounce(saveVolume, 300)

  const handleToggleVolumeMute = (_isMute) => {
    let muteStatus = _isMute ?? !isMute.value
    saveVolume(muteStatus)
    setMute(muteStatus)
  }

  const handleSetVolume = num => {
    const _volume = num < 0 ? 0 : num > 1 ? 1 : num
    setVolume(_volume)
  }

  const handleSetVolumeUp = (step = 0.02) => {
    handleSetVolume(volume.value + step)
  }
  const handleSetVolumeDown = (step = 0.02) => {
    handleSetVolume(volume.value - step)
  }

  watch(volume, _volume => {
    handleSaveVolume(_volume)
    setPlayerVolume(_volume)
  })
  watch(isMute, mute => {
    handleSaveVolume(mute)
    setPlayerMute(mute)
  })
  watch(() => setting.value.player.volume, _volume => {
    setVolume(_volume)
  })
  watch(() => setting.value.player.isMute, muteStatus => {
    setMute(muteStatus)
  })

  setVolume(setting.value.player.volume)
  setMute(setting.value.player.isMute)

  window.eventHub.on(eventKeyPlayerNames.volume_up.action, handleSetVolumeUp)
  window.eventHub.on(eventKeyPlayerNames.volume_down.action, handleSetVolumeDown)
  window.eventHub.on(eventKeyPlayerNames.volume_mute.action, handleToggleVolumeMute)
  // window.eventHub.on(eventPlayerNames.setVolume, handleSetVolume)
  // window.eventHub.on(eventPlayerNames.toggleMute, handleToggleVolumeMute)

  onBeforeUnmount(() => {
    window.eventHub.off(eventKeyPlayerNames.volume_up.action, handleSetVolumeUp)
    window.eventHub.off(eventKeyPlayerNames.volume_down.action, handleSetVolumeDown)
    window.eventHub.off(eventKeyPlayerNames.volume_mute.action, handleToggleVolumeMute)
    // window.eventHub.off(eventPlayerNames.setVolume, handleSetVolume)
    // window.eventHub.off(eventPlayerNames.toggleMute, handleToggleVolumeMute)
  })
}
