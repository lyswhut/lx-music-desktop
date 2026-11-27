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
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-prevMusic" />
        </svg>
      </div>
      <div :class="[$style.playBtn, $style.playToggleBtn]" :aria-label="isPlay ? $t('player__pause') : $t('player__play')" @click="togglePlay">
        <svg v-if="isPlay" :class="$style.pauseGlyph" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
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
  flex: 0 0 auto;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  width: 100%;
  max-width: var(--playDetail-panel-width, 300px);
  margin-top: 20px;
}
.footerLeft {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
}

.progressContainer {
  width: 100%;
  position: relative;
  padding: 2px 0;
}

.progressContent {
  position: relative;
  height: 12px;
  padding: 4px 0;
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
  justify-content: center;
  span {
    font-size: 13px;
  }
}
.status {
  flex: auto;
}

.playControl {
  flex: none;
  width: 100%;
  height: 52px;
  display: flex;
  justify-content: center;
  align-items: center;
  // 与上方封面竖直居中对齐
  padding: 5px 0;
  gap: 12px;
  color: var(--color-button-font);
}
.playBtn {
  height: 32px;
  width: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  flex: none;
  color: var(--color-button-font);
  transition: opacity 0.2s ease, transform 0.2s ease;
  opacity: 1;

  svg {
    fill: currentColor;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:hover {
    opacity: 0.85;
    transform: scale(1.05);
  }
  &:active {
    opacity: 0.7;
    transform: scale(0.95);
  }
}
// 播放/暂停做成实心圆徽标，图标反白挖空；上一首/下一首保持裸图标
.playToggleBtn {
  height: 42px;
  width: 42px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;

  // 播放三角的画面只占画布 58%，暂停竖条占满，两者要分开给尺寸才能一样粗
  svg {
    height: 51%;
  }
  .pauseGlyph {
    height: 40%;
  }
}

</style>
