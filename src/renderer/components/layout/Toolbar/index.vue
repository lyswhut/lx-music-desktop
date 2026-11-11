<template>
  <div :class="[$style.toolbar, { [$style.fullscreen]: isFullscreen }, appSetting['common.controlBtnPosition'] == 'left' ? $style.controlBtnLeft : $style.controlBtnRight]">
    <div v-if="appSetting['common.controlBtnPosition'] == 'left'" :class="$style.logo">L X</div>
    <ControlBtns v-else />
  </div>
</template>

<script setup>
import { isFullscreen } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import ControlBtns from './ControlBtns.vue'

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  height: @height-toolbar;
  align-items: center;
  justify-content: space-between;
  padding-left: 15px;
  padding-right: 8px;
  -webkit-app-region: drag;
  z-index: 10;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  &.fullscreen {
    -webkit-app-region: no-drag;
    .logo {
      display: none;
    }
  }

  &.controlBtnLeft {
    .control {
      display: none;
    }
  }
  &.controlBtnRight {
    justify-content: flex-end;
  }
}

.logo {
  box-sizing: border-box;
  padding: 0 @height-toolbar * .4;
  height: @height-toolbar;
  color: var(--color-primary);
  flex: none;
  text-align: center;
  line-height: @height-toolbar;
  font-weight: bold;
  // -webkit-app-region: no-drag;
}

</style>
