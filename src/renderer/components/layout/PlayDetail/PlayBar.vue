<template>
  <div :class="$style.footer">
    <div :class="$style.footerLeft">
      <control-btns />
      <div :class="$style.progressContainer">
        <div :class="$style.progressContent">
          <common-progress-bar
            :class-name="$style.progress"
            :progress="progress"
            :handle-transition-end="handleTransitionEnd"
            :is-active-transition="isActiveTransition"
          />
        </div>
      </div>
      <PlaybackQueue />
      <div :class="$style.timeLabel"><span :class="$style.status" style="margin-right: 15px">{{ playMusicInfo.versionNotice || status }}</span><span>{{ nowPlayTimeStr }}</span><span style="margin: 0 5px;">/</span><span>{{ maxPlayTimeStr }}</span></div>
    </div>
    <div :class="$style.playControl">
      <div :class="$style.playBtn" :aria-label="$t('player__prev')" @click="playPrev()">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-prevMusic" />
        </svg>
      </div>
      <div :class="[$style.playBtn, $style.playPrimary]" :aria-label="isPlay ? $t('player__pause') : $t('player__play')" @click="togglePlay">
        <svg v-if="isPlay" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-pause" />
        </svg>
        <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-play" />
        </svg>
      </div>
      <div :class="$style.playBtn" :aria-label="$t('player__next')" @click="playNext()">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-nextMusic" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { playNext, playPrev, togglePlay } from '@renderer/core/player'
import { status, isPlay, playMusicInfo } from '@renderer/store/player/state'
import usePlayProgress from '@renderer/utils/compositions/usePlayProgress'

import ControlBtns from './components/ControlBtns.vue'
import PlaybackQueue from '../PlayBar/PlaybackQueue.vue'

const {
  nowPlayTimeStr,
  maxPlayTimeStr,
  progress,
  isActiveTransition,
  handleTransitionEnd,
} = usePlayProgress()

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.footer {
  flex: 0 0 100px;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.footerLeft {
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  padding: 13px 13px 13px 30px;
  overflow: hidden;
}

.progressContainer {
  width: 100%;
  position: relative;
  padding: 3px 0;
}

.progressContent {
  position: relative;
  height: 16px;
  padding: 5px 0;
  width: 100%;
}
.progress {
  height: 100%;
}

.barTransition {
  transition-property: transform;
  transition-timing-function: ease-out;
  transition-duration: 0.2s;
}
.timeLabel {
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
  color: var(--color-font-label);
  span {
    font-size: 12px;
  }
}
.status {
  flex: auto;
}

.playControl {
  flex: none;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 28px;
  gap: 10px;
  color: var(--color-button-font);
}
.playBtn {
  width: 38px;
  height: 38px;
  padding: 9px;
  border-radius: 50%;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
  color: var(--color-font);
  transition: background-color @transition-fast, transform 0.12s ease, opacity @transition-fast;
  opacity: 0.85;

  svg {
    fill: currentColor;
  }
  &:hover {
    opacity: 1;
    background-color: var(--ui-surface-hover);
  }
  &:active {
    transform: scale(0.94);
  }
}
.playPrimary {
  width: 48px;
  height: 48px;
  padding: 12px;
  opacity: 1;
  background-color: var(--color-primary);
  color: var(--ui-on-primary, #fff);
  box-shadow: inset 0 0 0 1px var(--ui-border-strong), var(--ui-primary-shadow);
  &:hover {
    background-color: var(--ui-primary-hover-bg, var(--color-primary-dark-100));
    transform: scale(1.04);
  }
  &:active {
    transform: scale(0.95);
  }
}

</style>
