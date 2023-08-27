<template>
  <div :class="$style.contnet">
    <h3 class="player__sound_effect_title">{{ $t('player__sound_effect_convolution') }}</h3>
    <div :class="$style.convolution">
      <div :class="$style.convolutionList">
        <base-checkbox
          v-for="item in convolutions"
          :id="`player__convolution_${item.name}`"
          :key="item.name"
          :class="$style.checkbox"
          :model-value="appSetting['player.soundEffect.convolution.fileName']"
          :label="$t(`player__sound_effect_convolution_file_${item.name}`)"
          :value="item.source"
          @update:model-value="updateConvolution($event)"
        />
      </div>
      <div :class="[$style.sliderList, { [$style.disabled]: disabledConvolution }]">
        <div :class="$style.sliderItem">
          <span :class="$style.label">{{ $t('player__sound_effect_convolution_main_gain') }}</span>
          <base-slider-bar :class="$style.slider" :value="appSetting['player.soundEffect.convolution.mainGain']" :min="0" :max="50" :disabled="disabledConvolution" @change="handleUpdateMainGain" />
          <span :class="[$style.value]">{{ appSetting['player.soundEffect.convolution.mainGain'] * 10 }}%</span>
        </div>
        <div :class="$style.sliderItem">
          <span :class="$style.label">{{ $t('player__sound_effect_convolution_send_gain') }}</span>
          <base-slider-bar :class="$style.slider" :value="appSetting['player.soundEffect.convolution.sendGain']" :min="0" :max="50" :disabled="disabledConvolution" @change="handleUpdateSendGain" />
          <span :class="[$style.value]">{{ appSetting['player.soundEffect.convolution.sendGain'] * 10 }}%</span>
        </div>
      </div>
    </div>
    <div :class="$style.saveList">
      <base-btn v-for="item in userPresetList" :key="item.id" min @click="handleSetPreset(item)" @contextmenu="handleRemovePreset(item.id)">{{ item.name }}</base-btn>
      <AddConvolutionPresetBtn v-if="userPresetList.length < 31" :disabled="disabledConvolution" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { convolutions } from '@renderer/plugins/player'
import AddConvolutionPresetBtn from './AddConvolutionPresetBtn.vue'
import { getUserConvolutionPresetList, removeUserConvolutionPreset } from '@renderer/store/soundEffect'

const updateConvolution = val => {
  const target = convolutions.find(c => c.source == val)
  const setting = {
    'player.soundEffect.convolution.fileName': val,
  }
  if (target) {
    setting['player.soundEffect.convolution.mainGain'] = target.mainGain * 10
    setting['player.soundEffect.convolution.sendGain'] = target.sendGain * 10
  }
  updateSetting(setting)
}

const handleUpdateMainGain = (value) => {
  updateSetting({ 'player.soundEffect.convolution.mainGain': Math.round(value) })
}
const handleUpdateSendGain = (value) => {
  updateSetting({ 'player.soundEffect.convolution.sendGain': Math.round(value) })
}

const handleSetPreset = (item) => {
  updateSetting({
    'player.soundEffect.convolution.fileName': item.source,
    'player.soundEffect.convolution.mainGain': item.mainGain,
    'player.soundEffect.convolution.sendGain': item.sendGain,
  })
}
const userPresetList = ref([])
const handleRemovePreset = id => {
  void removeUserConvolutionPreset(id)
}

const disabledConvolution = computed(() => {
  return !appSetting['player.soundEffect.convolution.fileName']
})

onMounted(() => {
  void getUserConvolutionPresetList().then(list => {
    userPresetList.value = list
  })
})


</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.contnet {
  display: flex;
  flex-flow: column nowrap;
  gap: 3px;
  min-height: 0;
  flex: none;
}
.convolution {
  display: flex;
  flex-flow: column wrap;
  gap: 15px;
  width: 100%;
}
.convolutionList {
  display: flex;
  flex-flow: row wrap;
  gap: 8px;
  width: 100%;
}
.checkbox {
  margin-right: 10px;
  font-size: 12px;
}

.sliderList {
  display: flex;
  flex-flow: column nowrap;
  gap: 15px;
  width: 100%;
  transition: opacity @transition-normal;
  &.disabled  {
    opacity: .4;
  }
}
.sliderItem {
  display: flex;
  flex-flow: row nowrap;
  gap: 8px;
}
.slider {
  flex: auto;
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
.saveList {
  display: flex;
  flex-flow: row wrap;
  margin-top: 10px;
  gap: 10px;
}

</style>
