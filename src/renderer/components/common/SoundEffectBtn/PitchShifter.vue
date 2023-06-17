<template>
  <div :class="$style.contnet">
    <div class="player__sound_effect_title" :class="$style.header">
      <h3>
        {{ $t('player__sound_effect_pitch_shifter') }}
        <svg-icon class="help-icon" name="information-slab-circle-outline" :aria-label="$t('player__sound_effect_pitch_shifter_tip')" />
      </h3>
      <base-btn min @click="handleSetPreset(1)">{{ $t('player__sound_effect_pitch_shifter_reset_btn') }}</base-btn>
    </div>
    <div :class="$style.eqList">
      <div :class="$style.eqItem">
        <span :class="$style.label">{{ playbackRate.toFixed(2) }}x</span>
        <base-slider-bar :class="$style.slider" :value="playbackRate * 100" :min="50" :max="150" @change="handleUpdatePlaybackRate" />
      </div>
    </div>
    <!-- <div :class="$style.saveList">
      <base-btn v-for="num in semitones" :key="num" min @click="handleSetSemitones(num)">{{ $t(`player__sound_effect_pitch_shifter_preset_semitones`, { num: num > 0 ? `+${num}` : num }) }}</base-btn>
      <base-btn v-for="item in userPresetList" :key="item.id" min @click="handleSetPreset(item.playbackRate)" @contextmenu="handleRemovePreset(item.id)">{{ item.name }}</base-btn>
      <AddPitchShifterPresetBtn v-if="userPresetList.length < 31" />
    </div> -->
  </div>
</template>

<script setup>
import { computed } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'
// import AddPitchShifterPresetBtn from './AddPitchShifterPresetBtn.vue'
// import { getUserPitchShifterPresetList, removeUserPitchShifterPreset } from '@renderer/store/soundEffect'
// import { semitones } from '@renderer/plugins/player'

// const setting = reactive({
//   enabled: false,
//   soundR: 5,
//   speed: 25,
// })


const playbackRate = computed(() => appSetting['player.soundEffect.pitchShifter.playbackRate'])

const handleSetPreset = (value) => {
  updateSetting({ 'player.soundEffect.pitchShifter.playbackRate': value })
}

// const handleSetSemitones = (value) => {
//   // https://zpl.fi/pitch-shifting-in-web-audio-api/
//   handleSetPreset(2 ** (value / 12))
// }

const handleUpdatePlaybackRate = (value) => {
  value = parseFloat((Math.round(value) / 100).toFixed(2))
  handleSetPreset(value)
}


// const userPresetList = ref([])

// const handleRemovePreset = id => {
//   removeUserPitchShifterPreset(id)
// }

// onMounted(() => {
//   getUserPitchShifterPresetList().then(list => {
//     userPresetList.value = list
//   })
// })


</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.contnet {
  padding-top: 15px;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  gap: 8px;
  min-height: 0;
  flex: none;
  &:before {
    .mixin-after;
    position: absolute;
    top: 0;
    height: 1px;
    width: 100%;
    border-top: 1px dashed var(--color-primary-light-100-alpha-700);
  }
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
  // width: 50px;
  font-size: 12px;
}
.value {
  flex: none;
  width: 40px;
  font-size: 12px;
  text-align: center;

  &.active {
    color: var(--color-primary-font);
  }
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

.checkbox {
  margin-right: 10px;
  font-size: 13px;
}

.saveList {
  display: flex;
  flex-flow: row wrap;
  margin-top: 10px;
  gap: 10px;
}

</style>
