<template>
  <base-btn min :disabled="disabled" :class="[$style.newPreset, {[$style.editing]: isEditing}]" :aria-label="$t('player__sound_effect_biquad_filter_save_btn')" @click="handleEditing($event)">
    <svg-icon name="plus" />
    <base-input ref="input" :class="$style.newPresetInput" :value="newPresetName" :placeholder="$t('player__sound_effect_biquad_filter_save_input')" @keyup.enter="handleSave($event)" @blur="handleSave($event)" />
  </base-btn>
</template>

<script setup>
import { ref, nextTick } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { saveUserConvolutionPreset } from '@renderer/store/soundEffect'

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const isEditing = ref(false)
const input = ref(false)
const newPresetName = ref('')

const handleEditing = () => {
  if (isEditing.value) return
  // if (!this.newPresetName) this.newPresetName = this.listName
  isEditing.value = true
  void nextTick(() => {
    input.value.$el.focus()
  })
}

const handleSave = (event) => {
  let name = event.target.value.trim()
  newPresetName.value = event.target.value = ''
  isEditing.value = false
  if (!name) return
  if (name.length > 20) name = name.substring(0, 20)
  void saveUserConvolutionPreset({
    id: Date.now().toString(),
    name,
    source: appSetting['player.soundEffect.convolution.fileName'],
    mainGain: appSetting['player.soundEffect.convolution.mainGain'],
    sendGain: appSetting['player.soundEffect.convolution.sendGain'],
  })
}

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.newPreset {
  position: relative;
  border: 1px dashed var(--color-primary-font-hover);
  // background-color: var(--color-main-background);
  color: var(--color-primary-font-hover);
  opacity: .7;
  height: 22px;

  &.editing {
    opacity: 1;
    width: 90px;

    svg {
      display: none;
    }
    .newPresetInput {
      display: block;
    }
  }

  :global {
    .svg-icon {
      vertical-align: 0;
    }
  }
}
.newPresetInput {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  // line-height: 16px;
  background: none !important;
  font-size: 12px;
  text-align: center;
  font-family: inherit;
  box-sizing: border-box;
  padding: 0 3px;
  border-radius: 0;
  display: none;
  &::placeholder {
    font-size: 12px;
  }
}

</style>
