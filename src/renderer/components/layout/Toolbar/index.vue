<template>
  <div :class="[$style.toolbar, { [$style.fullscreen]: isFullscreen }, appSetting['common.controlBtnPosition'] == 'left' ? $style.controlBtnLeft : $style.controlBtnRight]">
    <SearchInput />
    <div v-if="appSetting['common.controlBtnPosition'] == 'left'" :class="$style.logo">L X</div>
    <ControlBtns v-else />
  </div>
</template>

<script setup>
import { isFullscreen } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import ControlBtns from './ControlBtns.vue'
import SearchInput from './SearchInput.vue'

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.toolbar {
  display: flex;
  height: @height-toolbar;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--ui-border-subtle);
  -webkit-app-region: drag;
  z-index: 2;

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
    justify-content: space-between;
    padding-right: 0;
  }
}

.logo {
  box-sizing: border-box;
  padding: 0 6px;
  height: @height-toolbar;
  color: var(--color-primary);
  opacity: 0.85;
  flex: none;
  text-align: center;
  line-height: @height-toolbar;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

</style>
