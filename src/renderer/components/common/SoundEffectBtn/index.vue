<template>
  <button :class="$style.btn" :aria-label="$t('player__sound_effect')" @click="visible = true">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="90%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-tune-variant" />
    </svg>
  </button>
  <material-modal :show="visible" bg-close="bg-close" :teleport="teleport" @close="visible = false">
    <!-- <main :class="$style.main"> -->
    <!-- <h2 :class="$style.title">{{ $t('theme_edit_modal__title') }}</h2> -->
    <div :class="$style.content">
      <div :class="['scroll', $style.row]">
        <AudioConvolution />
        <PitchShifter />
        <AudioPanner />
      </div>
      <div :class="['scroll', $style.row]">
        <BiquadFilter />
      </div>
    </div>
    <!-- </main> -->
  </material-modal>
</template>

<script setup>
import { ref } from '@common/utils/vueTools'
// import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
// import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
// import { musicInfo, playMusicInfo } from '@renderer/store/player/state'
// import { saveVolumeIsMute } from '@renderer/store/setting'
// import { volume, isMute } from '@renderer/store/player/volume'
// import fs from 'node:fs'
import BiquadFilter from './BiquadFilter.vue'
import AudioPanner from './AudioPanner.vue'
import AudioConvolution from './AudioConvolution.vue'
import PitchShifter from './PitchShifter.vue'

defineProps({
  teleport: {
    type: String,
    default: '#root',
  },
})

const visible = ref(false)


</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
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

.main {
  min-width: 300px;
  // max-height: 100%;
  // overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  min-height: 0;
}
// .title {
//   flex: none;
//   font-size: 16px;
//   color: var(--color-font);
//   line-height: 1.3;
//   text-align: center;
//   padding: 10px;
// }
.content {
  display: flex;
  flex-flow: row nowrap;
  padding: 0 5px;
  margin: 15px 0;
  gap: 10px;
  position: relative;
  min-height: 0;

  &:before {
    .mixin-after;
    position: absolute;
    left: 50%;
    height: 100%;
    border-left: 1px dashed var(--color-primary-light-100-alpha-700);
  }
  // width: 400px;

  :global {
    // .player__sound_effect_contnet {
    //   display: flex;
    // }
    .player__sound_effect_title {
      // margin-bottom: 10px;
      font-size: 14px;
      padding-bottom: 8px;
    }
  }
}

.row {
  width: 50%;
  display: flex;
  gap: 15px;
  flex-flow: column nowrap;
  padding: 0 10px;
}

</style>
