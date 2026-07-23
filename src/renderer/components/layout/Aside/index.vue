<template>
  <div :class="[$style.aside, { [$style.fullscreen]: isFullscreen }]">
    <ControlBtns v-if="appSetting['common.controlBtnPosition'] == 'left'" />
    <div v-else :class="$style.logo">
      <div :class="$style.logoTitle">落雪音乐</div>
      <div :class="$style.logoVersion">Lx music v{{ versionInfo.version }}</div>
    </div>
    <NavBar />
  </div>
</template>

<script setup>
import { isFullscreen, versionInfo } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'

import ControlBtns from './ControlBtns.vue'
import NavBar from './NavBar.vue'

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.aside {
  transition: @transition-normal;
  transition-property: background-color;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  display: flex;
  flex-flow: column nowrap;

  &.fullscreen {
    -webkit-app-region: no-drag;
    .logo {
      display: none;
    }
  }
}

.logo {
  box-sizing: border-box;
  padding: 20px 20px 24px 24px;
  height: auto;
  color: var(--color-nav-font);
  opacity: .95;
  flex: none;
  line-height: 1.2;
  font-weight: normal;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.logoTitle {
  font-size: 1.75rem;
  font-weight: normal;
  letter-spacing: 1px;
  color: var(--color-primary);
}

.logoVersion {
  font-size: 0.75rem;
  opacity: 0.6;
  font-weight: normal;
  letter-spacing: 0.5px;
}

</style>
