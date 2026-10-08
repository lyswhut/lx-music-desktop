<template>
  <div
    :class="[$style.aside, { [$style.collapsed]: isAsideCollapsed, [$style.fullscreen]: isFullscreen }]"
    :style="{ width: isAsideCollapsed ? '64px' : undefined }"
  >
    <!-- 标题区域 -->
    <div :class="$style.header">
      <ControlBtns v-if="appSetting['common.controlBtnPosition'] == 'left'" />
      <template v-else>
        <div v-if="!isAsideCollapsed" :class="$style.logo">
          <span :class="$style.logoTitle">落雪音乐</span>
          <span :class="$style.logoVersion">Lx music v{{ appVersion }}</span>
        </div>
        <span v-else :class="$style.collapsedLogo">LX</span>
      </template>
    </div>
    <NavBar :collapsed="isAsideCollapsed" />
    <div :class="$style.asideFooter">
      <button
        type="button" :class="$style.toggleBtn" :aria-label="isAsideCollapsed ? '展开侧边栏' : '折叠侧边栏'"
        @click="isAsideCollapsed = !isAsideCollapsed"
      >
        <svg
          version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 24 24" width="16" height="16" :class="{[$style.toggleIcon]: isAsideCollapsed}" space="preserve"
        >
          <use xlink:href="#icon-double-angle-left" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { isFullscreen, isAsideCollapsed } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'

import ControlBtns from './ControlBtns.vue'
import NavBar from './NavBar.vue'

const appVersion = process.versions.app

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.aside {
  transition: @transition-normal;
  transition-property: background-color, width;
  background-color: #f1f9f5;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  box-sizing: border-box;

  &.fullscreen {
    -webkit-app-region: no-drag;
    .logo {
      display: none;
    }
  }
}

.header {
  flex: none;
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  -webkit-app-region: drag;

  .collapsed & {
    justify-content: center;
    padding: 16px 8px 12px;
  }
}

.logo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logoTitle {
  color: var(--color-primary-dark-300);
  font-size: 30px;
  font-weight: normal;
  letter-spacing: 2px;
  line-height: 1.2;
}

.logoVersion {
  color: var(--color-primary-dark-200-alpha-500);
  font-size: 11px;
  letter-spacing: 1px;
  line-height: 1;
}

.collapsedLogo {
  color: var(--color-primary-dark-300);
  font-size: 22px;
  font-weight: normal;
  letter-spacing: 2px;
  line-height: 1.2;
}

.asideFooter {
  flex: none;
  display: flex;
  padding: 8px 12px 12px;
  -webkit-app-region: no-drag;

  .collapsed & {
    justify-content: center;
    padding: 8px;
  }
}

.toggleBtn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--color-primary-dark-300);
  cursor: pointer;
  transition: background-color @transition-fast;

  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
}
.toggleIcon {
  transform: rotate(180deg);
}

</style>
