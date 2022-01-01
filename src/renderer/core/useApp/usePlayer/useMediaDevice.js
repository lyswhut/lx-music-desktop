import {
  onBeforeUnmount,
  watch,
  useCommit,
} from '@renderer/utils/vueTools'
import { setMediaDeviceId } from '@renderer/plugins/player'
import { isPlay } from '@renderer/core/share/player'
import { player as eventPlayerNames } from '@renderer/event/names'


export default ({ setting }) => {
  let prevDeviceLabel = null

  const saveMediaDeviceId = useCommit('setMediaDeviceId')

  const setMediaDevice = async(mediaDeviceId) => {
    let label = prevDeviceLabel
    const devices = await navigator.mediaDevices.enumerateDevices()
    let device = devices.find(device => device.deviceId === mediaDeviceId)
    if (device) {
      mediaDeviceId = device.deviceId
      label = device.label
    } else {
      mediaDeviceId = 'default'
      device = devices.find(device => device.deviceId === mediaDeviceId)
      if (device) label = device.label
    }

    prevDeviceLabel = label
    // console.log(device)
    setMediaDeviceId(mediaDeviceId).catch(err => {
      console.log(err)
      saveMediaDeviceId('default')
    })
  }

  const handleDeviceChangeStopPlay = (device, mediaDeviceId) => {
    // console.log(device)
    // console.log(this.setting.player.isMediaDeviceRemovedStopPlay, this.isPlay, device.label, this.prevDeviceLabel)
    if (
      setting.value.player.isMediaDeviceRemovedStopPlay &&
      isPlay.value &&
      device.label != prevDeviceLabel
    ) window.eventHub.emit(eventPlayerNames.setTogglePlay)
  }

  const handleMediaListChange = async() => {
    let mediaDeviceId = setting.value.player.mediaDeviceId
    const devices = await navigator.mediaDevices.enumerateDevices()
    let device = devices.find(device => device.deviceId === mediaDeviceId)
    if (!device) device = devices.find(device => device.deviceId === 'default')
    if (!device) device = { label: null, deviceId: null }

    handleDeviceChangeStopPlay(device, mediaDeviceId)

    setMediaDeviceId(device.deviceId).catch(err => {
      console.log(err)
      saveMediaDeviceId('default')
    })
  }

  watch(() => setting.value.player.mediaDeviceId, setMediaDevice)


  setMediaDevice(setting.value.player.mediaDeviceId)

  navigator.mediaDevices.addEventListener('devicechange', handleMediaListChange)

  onBeforeUnmount(() => {
    navigator.mediaDevices.removeEventListener('devicechange', handleMediaListChange)
  })
}
