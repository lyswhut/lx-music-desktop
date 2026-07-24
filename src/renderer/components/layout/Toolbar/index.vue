<template>
  <div :class="[$style.toolbar, { [$style.fullscreen]: isFullscreen }]">
    <ControlBtns v-if="appSetting['common.controlBtnPosition'] == 'left'" />
    <ControlBtns v-else :class="$style.rightBtns" />
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
  display: flex;
  height: @height-toolbar;
  align-items: center;
  justify-content: space-between;
  padding-left: 15px;
  -webkit-app-region: drag;
  z-index: 2;

  &.fullscreen {
    -webkit-app-region: no-drag;
  }
}

.rightBtns {
  margin-left: auto;
}

</style>
