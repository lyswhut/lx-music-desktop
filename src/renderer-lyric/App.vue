<template>
  <div id="container" :class="[{ lock: setting['desktopLyric.isLock'] }, { hide: isHoverHide && isMouseEnter }]">
    <div id="main" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" @mousemove="handleMouseMoveMain">
      <transition enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut">
        <div v-show="!setting['desktopLyric.isLock']" class="control-bar">
          <layout-control-bar />
        </div>
      </transition>
      <layout-lyric-vertical v-if="setting['desktopLyric.direction'] == 'vertical'" />
      <layout-lyric-horizontal v-else />
      <transition enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut">
        <common-audio-visualizer v-if="setting['desktopLyric.audioVisualization']" />
      </transition>
    </div>
    <div class="resize resize-left" @mousedown.self="handleMouseDown('left', $event)" @touchstart.self="handleTouchDown('left', $event)" />
    <div class="resize resize-top" @mousedown.self="handleMouseDown('top', $event)" @touchstart.self="handleTouchDown('top', $event)" />
    <div class="resize resize-right" @mousedown.self="handleMouseDown('right', $event)" @touchstart.self="handleTouchDown('right', $event)" />
    <div class="resize resize-bottom" @mousedown.self="handleMouseDown('bottom', $event)" @touchstart.self="handleTouchDown('bottom', $event)" />
    <div class="resize resize-top-left" @mousedown.self="handleMouseDown('top-left', $event)" @touchstart.self="handleTouchDown('top-left', $event)" />
    <div class="resize resize-top-right" @mousedown.self="handleMouseDown('top-right', $event)" @touchstart.self="handleTouchDown('top-right', $event)" />
    <div class="resize resize-bottom-left" @mousedown.self="handleMouseDown('bottom-left', $event)" @touchstart.self="handleTouchDown('bottom-left', $event)" />
    <div class="resize resize-bottom-right" @mousedown.self="handleMouseDown('bottom-right', $event)" @touchstart.self="handleTouchDown('bottom-right', $event)" />
    <layout-icons />
  </div>
</template>

<script setup>
import useWindowSize from '@lyric/useApp/useWindowSize'
import useHoverHide from '@lyric/useApp/useHoverHide'
import { onMounted } from '@common/utils/vueTools'
import { setting } from '@lyric/store/state'
import { sendConnectMainWindowEvent } from '@lyric/utils/ipc'
import useLyric from '@lyric/useApp/useLyric'
import useTheme from '@lyric/useApp/useTheme'
import { init as initLyricPlayer } from '@lyric/core/lyric'


const { handleMouseDown, handleTouchDown } = useWindowSize()
const { handleMouseMoveMain, isHoverHide, isMouseEnter } = useHoverHide()
useLyric()
useTheme()


onMounted(() => {
  initLyricPlayer()
  sendConnectMainWindowEvent()
})

</script>

<style lang="less">
@import './assets/styles/index.less';
@import './assets/styles/layout.less';

body {
  user-select: none;
  height: 100vh;
  box-sizing: border-box;
  color: #fff;
  opacity: .8;
}

body {
  user-select: none;
  height: 100vh;
  box-sizing: border-box;
}
#root {
  height: 100%;
}

#container {
  box-sizing: border-box;
  height: 100%;
  transition: opacity .3s ease;
  opacity: 1;
  &.lock {
    #main {
      background-color: transparent;
    }
  }
  &.hide {
    opacity: .05;
  }
}

@resize-width: 6px;
.resize {
  z-index: 2;
}
.resize-left {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: @resize-width;
  cursor: ew-resize;
  // background-color: rgba(0, 0, 0, 1);
}
.resize-right {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: @resize-width;
  cursor: ew-resize;
}
.resize-top {
  position: absolute;
  left: 0;
  top: 0;
  height: 4px;
  width: 100%;
  cursor: ns-resize;
}
.resize-bottom {
  position: absolute;
  left: 0;
  bottom: 0;
  height: @resize-width;
  width: 100%;
  cursor: ns-resize;
}
.resize-top-left {
  position: absolute;
  left: 0;
  top: 0;
  width: @resize-width;
  height: @resize-width;
  cursor: nwse-resize;
  // background-color: rgba(0, 0, 0, 1);
}
.resize-top-right {
  position: absolute;
  right: 0;
  top: 0;
  width: @resize-width;
  height: @resize-width;
  cursor: nesw-resize;
  // background-color: rgba(0, 0, 0, 1);
}
.resize-bottom-left {
  position: absolute;
  left: 0;
  bottom: 0;
  width: @resize-width;
  height: @resize-width;
  cursor: nesw-resize;
  // background-color: rgba(0, 0, 0, 1);
}
.resize-bottom-right {
  position: absolute;
  right: 0;
  bottom: 0;
  width: @resize-width;
  height: @resize-width;
  cursor: nwse-resize;
  // background-color: rgba(0, 0, 0, 1);
}

#main {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  transition: background-color @transition-theme;
  min-height: 0;
  border-radius: @radius-border;
  overflow: hidden;
  background-color: rgba(0, 0, 0, .2);

  &:hover {
    .control-bar {
      opacity: 1;
    }
  }
}

.control-bar {
  position: absolute;
  border-top-left-radius: @radius-border;
  border-top-right-radius: @radius-border;
  overflow: hidden;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  transition: opacity @transition-theme;
  z-index: 1;
}
</style>
