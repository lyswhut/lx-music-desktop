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
      <div :class="$style.timeLabel"><span :class="$style.status" style="margin-right: 15px">{{ status }}</span><span>{{ nowPlayTimeStr }}</span><span style="margin: 0 5px;">/</span><span>{{ maxPlayTimeStr }}</span></div>
    </div>
    <div :class="$style.playControl">
      <div :class="$style.playBtn" :aria-label="$t('player__prev')" @click="playPrev()">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <use xlink:href="#icon-line-prev" />
        </svg>
      </div>
      <div :class="[$style.playBtn, $style.playMain]" :aria-label="isPlay ? $t('player__pause') : $t('player__play')" @click="togglePlay">
        <svg v-if="isPlay" viewBox="0 0 24 24" aria-hidden="true">
          <use xlink:href="#icon-line-pause-fill" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <use xlink:href="#icon-line-play-fill" />
        </svg>
      </div>
      <div :class="$style.playBtn" :aria-label="$t('player__next')" @click="playNext()">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <use xlink:href="#icon-line-next" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { playNext, playPrev, togglePlay } from '@renderer/core/player'
import { status, isPlay } from '@renderer/store/player/state'
import usePlayProgress from '@renderer/utils/compositions/usePlayProgress'

import ControlBtns from './components/ControlBtns.vue'

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
  flex: 0 0 88px;
  overflow: hidden;
  display: flex;
  align-items: center;
  border-top: 1px solid var(--color-primary-alpha-900);
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
  height: 18px;
  display: flex;
  span {
    font-size: 13px;
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
  padding: 0 25px;
  color: var(--color-button-font);
}
.playBtn {
  cursor: pointer;
  flex: none;
  color: var(--color-font);
  transition: opacity 0.2s ease;
  opacity: 1;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  +.playBtn {
    margin-left: 16px;
  }
  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
  }
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
}

.playMain {
  width: 31px;
  height: 31px;
  padding: 0;
  border-radius: 50%;
  background: var(--color-font);
  color: var(--color-app-background);
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
    stroke: none;
  }
  &:hover {
    opacity: 0.92;
  }
}

</style>
