<template lang="pug">
div(:class="$style.footer")
  div(:class="$style.footerLeft")
    control-btns
    div(:class="$style.progressContainer")
      div(:class="$style.progressContent")
        common-progress-bar(:class-name="$style.progress" :progress="progress" :handleTransitionEnd="handleTransitionEnd" :isActiveTransition="isActiveTransition")
    div(:class="$style.timeLabel")
      span(style="margin-left: 15px") {{status}}
      div
        span {{nowPlayTimeStr}}
        span(style="margin: 0 5px;") /
        span {{maxPlayTimeStr}}
  div(:class="$style.playControl")
    div(:class="$style.playBtn" @click="playPrev" style="transform: rotate(180deg);" :tips="$t('player__prev')")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 220.847 220.847' space='preserve')
        use(xlink:href='#icon-nextMusic')
    div(:class="$style.playBtn" @click="togglePlay" :tips="isPlay ? $t('player__pause') : $t('player__play')")
      svg(v-if="isPlay" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 277.338 277.338' space='preserve')
        use(xlink:href='#icon-pause')
      svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 170 170' space='preserve')
        use(xlink:href='#icon-play')
    div(:class="$style.playBtn" @click="playNext" :tips="$t('player__next')")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 220.847 220.847' space='preserve')
        use(xlink:href='#icon-nextMusic')
</template>

<script>
import { status, isPlay } from '@renderer/core/share/player'
import usePlayProgress from '@renderer/utils/compositions/usePlayProgress'
import { player as eventPlayerNames } from '@renderer/event/names'

import ControlBtns from './components/ControlBtns'
export default {
  components: {
    ControlBtns,
  },
  setup() {
    const {
      nowPlayTimeStr,
      maxPlayTimeStr,
      progress,
      isActiveTransition,
      handleTransitionEnd,
    } = usePlayProgress()

    return {
      nowPlayTimeStr,
      maxPlayTimeStr,
      status,
      progress,
      isActiveTransition,
      handleTransitionEnd,
      isPlay,
      togglePlay() {
        window.eventHub.emit(eventPlayerNames.setTogglePlay)
      },
      playNext() {
        window.eventHub.emit(eventPlayerNames.setPlayNext)
      },
      playPrev() {
        window.eventHub.emit(eventPlayerNames.setPlayPrev)
      },
    }
  },
}
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
  padding: 13px;
  overflow: hidden;
}

.progress-container {
  width: 100%;
  position: relative;
  padding: 3px 0;
}

.progress-content {
  position: relative;
  height: 15px;
  padding: 5px 0;
  width: 100%;
}
.progress {
  height: 100%;
}

.bar-transition {
  transition-property: transform;
  transition-timing-function: ease-out;
  transition-duration: 0.2s;
}
.time-label {
  width: 100%;
  height: 18px;
  display: flex;
  justify-content: space-between;
  span {
    font-size: 13px;
  }
}

.play-control {
  flex: none;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 25px;
  color: @color-btn;
}
.play-btn {
  height: 40%;
  padding: 5px;
  cursor: pointer;
  flex: none;
  // transition: @transition-theme;
  // transition-property: color;
  color: @color-player-detail-play-btn;
  transition: opacity 0.2s ease;
  opacity: 1;
  cursor: pointer;

  +.play-btn {
    margin-left: 10px;
  }
  svg {
    fill: currentColor;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .play-btn {
      color: ~'@{color-@{value}-player-detail-play-btn}';
    }
  }
})
</style>
