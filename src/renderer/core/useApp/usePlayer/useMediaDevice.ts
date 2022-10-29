import {
  onBeforeUnmount,
  watch,
} from '@common/utils/vueTools'
import { pause } from '@renderer/core/player/action'
import { setMediaDeviceId } from '@renderer/plugins/player'
import { isPlay } from '@renderer/store/player/state'
import { appSetting, saveMediaDeviceId } from '@renderer/store/setting'

const getDevices = async() => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter(({ kind }) => kind == 'audiooutput')
}

export default () => {
  let prevDeviceLabel: string | null = null

  const setMediaDevice = async(mediaDeviceId: string) => {
    let label = prevDeviceLabel
    const devices = await getDevices()
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
    setMediaDeviceId(mediaDeviceId).catch((err: any) => {
      console.log(err)
      saveMediaDeviceId('default')
    })
  }

  const handleDeviceChangeStopPlay = (device: MediaDeviceInfo, mediaDeviceId: string) => {
    // console.log(device)
    // console.log(this.appSetting.player['isMediaDeviceRemovedStopPlay,'] this.isPlay, device.label, this.prevDeviceLabel)
    if (
      appSetting['player.isMediaDeviceRemovedStopPlay'] &&
      isPlay.value &&
      device.label != prevDeviceLabel
    ) {
      window.lx.isPlayedStop = true
      pause()
    }
  }

  const handleMediaListChange = async() => {
    let mediaDeviceId = appSetting['player.mediaDeviceId']
    const devices = await getDevices()
    let device = devices.find(device => device.deviceId === mediaDeviceId)
    if (!device) device = devices.find(device => device.deviceId === 'default')
    // @ts-expect-error
    if (!device) device = { label: '', deviceId: '' }

    // @ts-expect-error
    handleDeviceChangeStopPlay(device, mediaDeviceId)

    setMediaDeviceId(device!.deviceId).catch((err: any) => {
      console.log(err)
      saveMediaDeviceId('default')
    })
  }

  watch(() => appSetting['player.mediaDeviceId'], setMediaDevice)


  void setMediaDevice(appSetting['player.mediaDeviceId'])

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  navigator.mediaDevices.addEventListener('devicechange', handleMediaListChange)

  onBeforeUnmount(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    navigator.mediaDevices.removeEventListener('devicechange', handleMediaListChange)
  })
}
