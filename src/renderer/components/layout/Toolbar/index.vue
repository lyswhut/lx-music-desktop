<template>
  <div :class="[$style.toolbar, { [$style.fullscreen]: isFullscreen }]">
    <ControlBtns />
  </div>
</template>

<script setup>
import { isFullscreen } from '@renderer/store'
import ControlBtns from './ControlBtns.vue'
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.toolbar {
  display: flex;
  // 收紧高度：控制按钮 30px，只留少量上下留白，去除按钮下方的空白条
  height: 38px;
  align-items: center;
  justify-content: space-between;
  padding-left: 15px;
  padding-right: 12px;
  -webkit-app-region: drag;
  z-index: 2;

  &.fullscreen {
    -webkit-app-region: no-drag;
  }
}
</style>
