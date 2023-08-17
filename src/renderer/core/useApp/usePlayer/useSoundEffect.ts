import { watch } from '@common/utils/vueTools'
import {
  freqs,
  getAudioContext,
  getBiquadFilter,
  setConvolver,
  setPannerSoundR,
  setPannerSpeed,
  startPanner,
  stopPanner,
  setConvolverMainGain,
  setConvolverSendGain,
  setPitchShifter,
} from '@renderer/plugins/player'

import { appSetting } from '@renderer/store/setting'

const cache = new Map<string, AudioBuffer>()
const loadBuffer = async(name: string) => new Promise<AudioBuffer>((resolve, reject) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('@renderer/assets/medias/filters/' + name) as string
  if (cache.has(path)) {
    resolve(cache.get(path) as AudioBuffer)
    return
  }
  // Load buffer asynchronously
  let request = new XMLHttpRequest()
  request.open('GET', path, true)
  request.responseType = 'arraybuffer'

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    void getAudioContext().decodeAudioData(request.response, (buffer) => {
      if (!buffer) {
        reject(new Error('error decoding file data: ' + path))
        return
      }
      cache.set(path, buffer)
      resolve(buffer)
    },
    function(error) {
      reject(error)
      console.error('decodeAudioData error', error)
    })
  }

  request.onerror = function() {
    reject(new Error('XHR error'))
  }

  request.send()
})

export default () => {
  // console.log(appSetting['player.soundEffect.panner.enable'])
  if (appSetting['player.soundEffect.panner.enable']) startPanner()
  setPannerSoundR(appSetting['player.soundEffect.panner.soundR'] / 10)
  setPannerSpeed(2 * (appSetting['player.soundEffect.panner.speed'] / 10))
  if (freqs.some(v => appSetting[`player.soundEffect.biquadFilter.hz${v}`] != 0)) {
    const bfs = getBiquadFilter()
    for (const item of freqs) {
      bfs.get(`hz${item}`)!.gain.value = appSetting[`player.soundEffect.biquadFilter.hz${item}`]
    }
  }
  if (appSetting['player.soundEffect.convolution.fileName']) {
    void loadBuffer(appSetting['player.soundEffect.convolution.fileName']).then((buffer) => {
      setConvolver(buffer, appSetting['player.soundEffect.convolution.mainGain'] / 10, appSetting['player.soundEffect.convolution.sendGain'] / 10)
    })
  }
  if (appSetting['player.soundEffect.pitchShifter.playbackRate'] != 1) {
    setPitchShifter(appSetting['player.soundEffect.pitchShifter.playbackRate'])
  }


  watch(() => appSetting['player.soundEffect.panner.enable'], (enable) => {
    if (enable) {
      startPanner()
    } else {
      stopPanner()
    }
  })
  watch(() => appSetting['player.soundEffect.panner.soundR'], (soundR) => {
    setPannerSoundR(soundR / 10)
  })
  watch(() => appSetting['player.soundEffect.panner.speed'], (speed) => {
    setPannerSpeed(2 * (speed / 10))
  })
  watch(() => appSetting['player.soundEffect.convolution.fileName'], (fileName) => {
    setTimeout(() => {
      if (fileName) {
        void loadBuffer(fileName).then((buffer) => {
          setConvolver(buffer, appSetting['player.soundEffect.convolution.mainGain'] / 10, appSetting['player.soundEffect.convolution.sendGain'] / 10)
        })
      } else {
        setConvolver(null, 0, 0)
      }
    })
  })
  watch(() => appSetting['player.soundEffect.convolution.mainGain'], (mainGain) => {
    if (!appSetting['player.soundEffect.convolution.fileName']) return
    setConvolverMainGain(mainGain / 10)
  })
  watch(() => appSetting['player.soundEffect.convolution.sendGain'], (sendGain) => {
    if (!appSetting['player.soundEffect.convolution.fileName']) return
    setConvolverSendGain(sendGain / 10)
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz31'], (hz31) => {
    const bfs = getBiquadFilter()
    bfs.get('hz31')!.gain.value = hz31
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz62'], (hz62) => {
    const bfs = getBiquadFilter()
    bfs.get('hz62')!.gain.value = hz62
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz125'], (hz125) => {
    const bfs = getBiquadFilter()
    bfs.get('hz125')!.gain.value = hz125
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz250'], (hz250) => {
    const bfs = getBiquadFilter()
    bfs.get('hz250')!.gain.value = hz250
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz500'], (hz500) => {
    const bfs = getBiquadFilter()
    bfs.get('hz500')!.gain.value = hz500
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz1000'], (hz1000) => {
    const bfs = getBiquadFilter()
    bfs.get('hz1000')!.gain.value = hz1000
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz2000'], (hz2000) => {
    const bfs = getBiquadFilter()
    bfs.get('hz2000')!.gain.value = hz2000
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz4000'], (hz4000) => {
    const bfs = getBiquadFilter()
    bfs.get('hz4000')!.gain.value = hz4000
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz8000'], (hz8000) => {
    const bfs = getBiquadFilter()
    bfs.get('hz8000')!.gain.value = hz8000
  })
  watch(() => appSetting['player.soundEffect.biquadFilter.hz16000'], (hz16000) => {
    const bfs = getBiquadFilter()
    bfs.get('hz16000')!.gain.value = hz16000
  })

  watch(() => appSetting['player.soundEffect.pitchShifter.playbackRate'], (playbackRate) => {
    setPitchShifter(playbackRate)
  })


  // window.key_event.on(HOTKEY_PLAYER.volume_up.action, hotkeyVolumeUp)
  // window.key_event.on(HOTKEY_PLAYER.volume_down.action, hotkeyVolumeDown)
  // window.app_event.on('setPlaybackRate', handleSetPlaybackRate)

  // onBeforeUnmount(() => {
  //   // window.key_event.off(HOTKEY_PLAYER.volume_up.action, hotkeyVolumeUp)
  //   // window.key_event.off(HOTKEY_PLAYER.volume_down.action, hotkeyVolumeDown)
  //   window.app_event.off('setPlaybackRate', handleSetPlaybackRate)
  // })
}
