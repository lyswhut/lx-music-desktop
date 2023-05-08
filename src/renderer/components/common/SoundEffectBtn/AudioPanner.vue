<template>
  <div :class="$style.contnet">
    <div class="player__sound_effect_title" :class="$style.header">
      <h3>{{ $t('player__sound_effect_panner') }}</h3>
      <base-checkbox
        id="player__sound_effect_panner_enabled"
        :class="$style.checkbox"
        :label="$t('player__sound_effect_panner_enabled')"
        :model-value="appSetting['player.soundEffect.panner.enable']"
        @update:model-value="updateEnabled"
      />
    </div>
    <div :class="$style.eqList">
      <div :class="$style.eqItem">
        <span :class="$style.label">{{ $t('player__sound_effect_panner_sound_speed') }}</span>
        <base-slider-bar :class="$style.slider" :value="appSetting['player.soundEffect.panner.speed']" :min="1" :max="50" @change="handleUpdateSpeed" />
        <span :class="[$style.value, { [$style.active]: appSetting['player.soundEffect.panner.speed'] != 25 }]">{{ appSetting['player.soundEffect.panner.speed'] }}</span>
      </div>
      <div :class="$style.eqItem">
        <span :class="$style.label">{{ $t('player__sound_effect_panner_sound_r') }}</span>
        <base-slider-bar :class="$style.slider" :value="appSetting['player.soundEffect.panner.soundR']" :min="1" :max="30" @change="handleUpdateSoundR" />
        <span :class="[$style.value, { [$style.active]: appSetting['player.soundEffect.panner.soundR'] != 5 }]">{{ appSetting['player.soundEffect.panner.soundR'] }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// import { reactive } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'

// const setting = reactive({
//   enabled: false,
//   soundR: 5,
//   speed: 25,
// })

const updateEnabled = (enabled) => {
  // console.log(enabled)
  updateSetting({ 'player.soundEffect.panner.enable': enabled })
}

const handleUpdateSoundR = (value) => {
  updateSetting({ 'player.soundEffect.panner.soundR': Math.round(value) })
}
const handleUpdateSpeed = (value) => {
  updateSetting({ 'player.soundEffect.panner.speed': Math.round(value) })
}


</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.contnet {
  padding-top: 15px;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  gap: 8px;
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

</style>
