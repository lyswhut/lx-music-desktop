<template>
  <div :class="$style.contnet">
    <div class="player__sound_effect_title" :class="$style.header">
      <h3>{{ $t('player__sound_effect_biquad_filter') }}</h3>
      <base-btn min @click="handleReset">{{ $t('player__sound_effect_biquad_filter_reset_btn') }}</base-btn>
    </div>
    <div :class="$style.eqList">
      <div v-for="(v, i) in freqs" :key="v" :class="$style.eqItem">
        <span :class="$style.label">{{ labels[i] }}</span>
        <base-slider-bar :class="$style.slider" :value="appSetting[`player.soundEffect.biquadFilter.hz${v}`]" :min="-15" :max="15" @change="handleUpdate(v, $event)" />
        <span :class="$style.value">{{ appSetting[`player.soundEffect.biquadFilter.hz${v}`] }}db</span>
      </div>
    </div>
    <div :class="$style.saveList">
      <!-- <base-btn min @click="handleSetPreset(item)">{{ $t(`player__sound_effect_biquad_filter_preset_slow`) }}</base-btn> -->
      <base-btn v-for="item in freqsPreset" :key="item.name" min @click="handleSetPreset(item)">{{ $t(`player__sound_effect_biquad_filter_preset_${item.name}`) }}</base-btn>
      <base-btn v-for="item in userPresetList" :key="item.id" min @click="handleSetPreset(item)" @contextmenu="handleRemovePreset(item.id)">{{ item.name }}</base-btn>
      <AddEQPresetBtn v-if="userPresetList.length < 31" />
    </div>
    <!-- <div :class="$style.footer">
      <base-btn min @click="handleReset">{{ $t('player__sound_effect_biquad_filter_reset_btn') }}</base-btn>
    </div> -->
  </div>
</template>

<script setup>
import { onMounted, ref } from '@common/utils/vueTools'
import { freqs, freqsPreset } from '@renderer/plugins/player'
import { appSetting, updateSetting } from '@renderer/store/setting'
import AddEQPresetBtn from './AddEQPresetBtn.vue'
import { getUserEQPresetList, removeUserEQPreset } from '@renderer/store/soundEffect'

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

const handleSetPreset = (item) => {
  updateSetting({
    'player.soundEffect.biquadFilter.hz31': item.hz31,
    'player.soundEffect.biquadFilter.hz62': item.hz62,
    'player.soundEffect.biquadFilter.hz125': item.hz125,
    'player.soundEffect.biquadFilter.hz250': item.hz250,
    'player.soundEffect.biquadFilter.hz500': item.hz500,
    'player.soundEffect.biquadFilter.hz1000': item.hz1000,
    'player.soundEffect.biquadFilter.hz2000': item.hz2000,
    'player.soundEffect.biquadFilter.hz4000': item.hz4000,
    'player.soundEffect.biquadFilter.hz8000': item.hz8000,
    'player.soundEffect.biquadFilter.hz16000': item.hz16000,
  })
}

const userPresetList = ref([])

const handleRemovePreset = id => {
  void removeUserEQPreset(id)
}

onMounted(() => {
  void getUserEQPresetList().then(list => {
    userPresetList.value = list
  })
})

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.contnet {
  display: flex;
  flex-flow: column nowrap;
  gap: 8px;
  min-height: 0;
  flex: none;
}
.header {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
  // padding-top: 5px;
}
.eqList {
  display: flex;
  flex-flow: row wrap;
  // gap: 15px;
  width: 100%;
  justify-content: space-between;
  position: relative;

  &:before {
    .mixin-after;
    position: absolute;
    left: 50%;
    height: 100%;
    border-left: 1px dashed var(--color-primary-light-100-alpha-700);
  }
}
.eqItem {
  display: flex;
  flex-flow: row nowrap;
  width: 50%;
  gap: 8px;
  margin-bottom: 15px;
  box-sizing: border-box;
  &:nth-child(odd) {
    padding-right: 10px;
  }
  &:nth-child(even) {
    padding-left: 10px;
  }
  &:nth-last-child(1), &:nth-last-child(2) {
    margin-bottom: 0;
  }
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

.saveList {
  display: flex;
  flex-flow: row wrap;
  margin-top: 10px;
  gap: 10px;
}

</style>
