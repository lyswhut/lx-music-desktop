<template>
  <material-popup-btn :class="$style.btnContent">
    <button :class="$style.btn" :aria-label="'音效设置'">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-volume-high-outline" />
      </svg>
    </button>
    <template #content>
      <div :class="$style.content">
        <div :class="$style.row">
          <h3 :class="$style.title">{{ $t('player__sound_effect_biquad_filter') }}</h3>
          <div :class="$style.eqList">
            <div v-for="(v, i) in labels" :key="i" :class="$style.eqItem">
              <span :class="$style.label">{{ v }}</span>
              <base-slider-bar :class="$style.slider" :value="values[i]" :min="-30" :max="30" @change="handleUpdate(i, $event)" />
              <span :class="$style.value">{{ values[i] }}db</span>
            </div>
          </div>
          <div :class="$style.footer">
            <!-- <span>{{ playbackRate.toFixed(2) }}x</span> -->
            <base-btn min @click="handleReset">{{ $t('player__sound_effect_biquad_filter_reset_btn') }}</base-btn>
          </div>
        </div>
        <div :class="$style.row">
          <h3 :class="$style.title">{{ $t('player__sound_effect_convolution') }}</h3>
          <div :class="$style.convolutionList">
            <base-checkbox
              v-for="item in convolutions"
              :id="`player__convolution_${item.name}`"
              :key="item.name"
              :model-value="convolution"
              :label="$t(`player__sound_effect_convolution_${item.name}`)"
              :value="item.source"
              @update:model-value="updateConvolution($event)"
            />
          </div>
        </div>
      </div>
    </template>
  </material-popup-btn>
</template>

<script setup>
import { reactive, ref } from '@common/utils/vueTools'
// import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
// import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
// import { musicInfo, playMusicInfo } from '@renderer/store/player/state'
// import { saveVolumeIsMute } from '@renderer/store/setting'
// import { volume, isMute } from '@renderer/store/player/volume'
// import fs from 'node:fs'
import { freqs, getBiquadFilter, convolutions, setConvolver, getAudioContext } from '@renderer/plugins/player'

const values = reactive(Array(freqs.length).fill(0))
const labels = freqs.map(num => num < 1000 ? num : `${num / 1000}k`)
// const handleUpdateVolume = (val) => {
//   window.app_event.setVolume(val)
// }


const handleUpdate = (index, value) => {
  // const { } =
  value = Math.round(value)
  const bfs = getBiquadFilter()
  values[index] = value
  bfs[index].gain.value = value
  console.log(bfs[index].gain.value)
  // console.log(index, event.target.value, bfs)
}

const handleReset = () => {
  const bfs = getBiquadFilter()
  for (let i = 0; i < values.length; i++) {
    values[i] = 0
    bfs[i].gain.value = 0
  }
}

const convolution = ref('')

const cache = {}
const loadBuffer = (url) => new Promise((resolve, reject) => {
  if (cache[url]) {
    resolve(cache[url])
    return
  }
  // Load buffer asynchronously
  let request = new XMLHttpRequest()
  request.open('GET', url, true)
  request.responseType = 'arraybuffer'

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    getAudioContext().decodeAudioData(request.response, function(buffer) {
      if (!buffer) {
        alert('error decoding file data: ' + url)
        return
      }
      cache[url] = buffer
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

const updateConvolution = async val => {
  convolution.value = val
  if (val) {
    const path = require('@static/medias/filters/' + val)
    const buffer = await loadBuffer(path)
    const target = convolutions.find(c => c.source == val)
    setConvolver(buffer, target.sendGain, target.mainGain)
  } else {
    setConvolver(null, 0, 0)
  }
}

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.btnContent {
  flex: none;
  height: 100%;
}

.btn {
  position: relative;
  // color: var(--color-button-font);
  justify-content: center;
  align-items: center;
  transition: color @transition-normal;
  cursor: pointer;
  background-color: transparent;
  border: none;
  width: 24px;
  display: flex;
  flex-flow: column nowrap;
  padding: 0;

  svg {
    transition: opacity @transition-fast;
    opacity: .6;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:hover {
    svg {
      opacity: .9;
    }
  }
  &:active {
    svg {
      opacity: 1;
    }
  }
}

.content {
  display: flex;
  flex-flow: column nowrap;
  padding: 5px 3px;
  gap: 15px;
  width: 300px;
}
.eqList {
  display: flex;
  flex-flow: column nowrap;
  gap: 15px;
  width: 100%;
}
.eqItem {
  display: flex;
  flex-flow: row nowrap;
  gap: 8px;
}
.label {
  flex: none;
  width: 40px;
  font-size: 14px;
  text-align: center;
}
.value {
  flex: none;
  width: 40px;
  font-size: 14px;
  text-align: center;
}
.footer {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  // font-size: 13px;
  span {
    line-height: 1;
  }
}

.slider {
  flex: auto;
}

</style>
