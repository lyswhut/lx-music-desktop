<template>
  <material-popup-btn :class="$style.btnContent">
    <button :class="$style.btn" :aria-label="$t('player__sound_effect')">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="90%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-tune-variant" />
      </svg>
    </button>
    <template #content>
      <div :class="$style.content">
        <AudioConvolution />
        <AudioPanner />
        <BiquadFilter />
      </div>
    </template>
  </material-popup-btn>
</template>

<script setup>
// import { reactive, ref } from '@common/utils/vueTools'
// import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
// import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
// import { musicInfo, playMusicInfo } from '@renderer/store/player/state'
// import { saveVolumeIsMute } from '@renderer/store/setting'
// import { volume, isMute } from '@renderer/store/player/volume'
// import fs from 'node:fs'
import BiquadFilter from './BiquadFilter'
import AudioPanner from './AudioPanner'
import AudioConvolution from './AudioConvolution'


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
  width: 400px;

  :global {
    // .player__sound_effect_contnet {
    //   display: flex;
    // }
    .player__sound_effect_title {
      // margin-bottom: 10px;
      font-size: 14px;
      padding-bottom: 5px;
    }
  }
}


</style>
