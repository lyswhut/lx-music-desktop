<template>
  <div :class="[$style.aside, { [$style.fullscreen]: isFullscreen }]" :style="{ width: isAsideExpanded ? '16%' : '' }">
    <div
      :class="[$style.logo, { [$style.expanded]: isAsideExpanded }]"
      title="切换侧边栏"
      @click="toggleAside"
    >
      <template v-if="isAsideExpanded">
        <div :class="$style.logoTitle">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 447.942 447.943" width="28" height="28" space="preserve">
            <use xlink:href="#icon-lx-mark" />
          </svg>
          <span :class="$style.logoName">落雪音乐</span>
        </div>
        <div :class="$style.logoVersion">Lx music v{{ versionInfo.version }}</div>
      </template>
      <template v-else>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 447.942 447.943" width="24" height="24" space="preserve">
          <use xlink:href="#icon-lx-mark" />
        </svg>
      </template>
    </div>
    <NavBar />
    <ControlBtns v-if="appSetting['common.controlBtnPosition'] == 'left'" />
  </div>
</template>

<script setup>
import { isFullscreen, isAsideExpanded, versionInfo } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'

import ControlBtns from './ControlBtns.vue'
import NavBar from './NavBar.vue'

const toggleAside = () => {
  isAsideExpanded.value = !isAsideExpanded.value
}

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.aside {
  // box-shadow: 0 0 5px rgba(0, 0, 0, .3);
  transition: @transition-normal;
  transition-property: width, background-color;
  // background-color: @color-aside-background;
  // background-color: @color-aside-background;
  // border-right: 2px solid var(--color-primary);
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
  padding: 0 13%;
  margin-top: 10px;
  height: 50px;
  color: var(--color-primary);
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: normal;
  -webkit-app-region: no-drag;
  cursor: pointer;

  &.expanded {
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 3px;
    height: 84px;
    margin-top: 0;
    padding: 20px 6% 0;
    line-height: normal;
    text-align: left;
  }
}

.logoTitle {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logoName {
  font-size: 28px;
  font-weight: normal;
  white-space: nowrap;
}

.logoVersion {
  font-size: 11px;
  font-weight: normal;
  opacity: .8;
  width: 100%;
  text-align: center;
}

</style>
