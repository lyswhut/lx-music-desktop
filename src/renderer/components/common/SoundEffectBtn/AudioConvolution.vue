<template>
  <div :class="$style.contnet">
    <h3 class="player__sound_effect_title">{{ $t('player__sound_effect_convolution') }}</h3>
    <div :class="$style.convolutionList">
      <base-checkbox
        v-for="item in convolutions"
        :id="`player__convolution_${item.name}`"
        :key="item.name"
        :class="$style.checkbox"
        :model-value="appSetting['player.soundEffect.convolution.fileName']"
        :label="$t(`player__sound_effect_convolution_${item.name}`)"
        :value="item.source"
        @update:model-value="updateConvolution($event)"
      />
    </div>
  </div>
</template>

<script setup>
// import { ref } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { convolutions } from '@renderer/plugins/player'

const updateConvolution = val => {
  console.log(val)
  updateSetting({ 'player.soundEffect.convolution.fileName': val })
}

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.contnet {
  display: flex;
  flex-flow: column nowrap;
  gap: 3px;
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
</style>
