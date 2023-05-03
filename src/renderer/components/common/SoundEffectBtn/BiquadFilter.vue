<template>
  <div :class="$style.contnet">
    <div :class="$style.header">
      <h3 class="player__sound_effect_title">{{ $t('player__sound_effect_biquad_filter') }}</h3>
      <base-btn min @click="handleReset">{{ $t('player__sound_effect_biquad_filter_reset_btn') }}</base-btn>
    </div>
    <div :class="$style.eqList">
      <div v-for="(v, i) in freqs" :key="v" :class="$style.eqItem">
        <span :class="$style.label">{{ labels[i] }}</span>
        <base-slider-bar :class="$style.slider" :value="appSetting[`player.soundEffect.biquadFilter.hz${v}`]" :min="-20" :max="20" @change="handleUpdate(v, $event)" />
        <span :class="$style.value">{{ appSetting[`player.soundEffect.biquadFilter.hz${v}`] }}db</span>
      </div>
    </div>
    <!-- <div :class="$style.footer">
      <base-btn min @click="handleReset">{{ $t('player__sound_effect_biquad_filter_reset_btn') }}</base-btn>
    </div> -->
  </div>
</template>

<script setup>
// import { reactive } from '@common/utils/vueTools'
import { freqs } from '@renderer/plugins/player'
import { appSetting, updateSetting } from '@renderer/store/setting'

const labels = freqs.map(num => num < 1000 ? num : `${num / 1000}k`)

const handleUpdate = (key, value) => {
  value = Math.round(value)
  // values[index] = value
  updateSetting({ [`player.soundEffect.biquadFilter.hz${key}`]: value })
  // console.log(index, event.target.value, bfs)
}

const handleReset = () => {
  const setting = {}
  for (const key of freqs) {
    setting[`player.soundEffect.biquadFilter.hz${key}`] = 0
  }
  updateSetting(setting)
}

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.contnet {
  display: flex;
  flex-flow: column nowrap;
  gap: 8px;
}
.header {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
  padding-top: 5px;
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
  font-size: 12px;
  text-align: center;
}
.value {
  flex: none;
  width: 40px;
  font-size: 12px;
  text-align: center;
}
.footer {
  display: flex;
  flex-flow: row nowrap;
  // justify-content: space-between;
  justify-content: center;
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
