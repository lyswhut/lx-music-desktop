<template>
  <div :class="[$style.aside, { [$style.fullscreen]: isFullscreen, [$style.collapsed]: collapsed }]">
    <div :class="$style.top">
      <ControlBtns v-if="appSetting['common.controlBtnPosition'] == 'left'" />
      <div v-else :class="$style.logo">
        <span :class="$style.logoMark">LX</span>
        <span v-if="!collapsed" :class="$style.logoName">Music</span>
      </div>
    </div>
    <NavBar :collapsed="collapsed" />
    <div :class="$style.footer">
      <button
        type="button"
        :class="$style.collapseBtn"
        :aria-label="collapsed ? $t('sidebar__expand') : $t('sidebar__collapse')"
        :ignore-tip="!collapsed ? '' : null"
        @click="toggleCollapse"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ [$style.flipped]: collapsed }">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span v-if="!collapsed" :class="$style.collapseLabel">{{ $t('sidebar__collapse') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from '@common/utils/vueTools'
import { isFullscreen } from '@renderer/store'
import { appSetting, updateSetting } from '@renderer/store/setting'

import ControlBtns from './ControlBtns.vue'
import NavBar from './NavBar.vue'

const collapsed = computed(() => Boolean(appSetting['common.sidebarCollapsed']))
const toggleCollapse = () => {
  updateSetting({ 'common.sidebarCollapsed': !collapsed.value })
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.aside {
  transition: background-color @transition-normal;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  padding: 6px 0 10px;

  &.fullscreen {
    -webkit-app-region: no-drag;
    .logo {
      display: none;
    }
  }
}

.top {
  flex: none;
  height: 44px;
  display: flex;
  align-items: center;
}

.logo {
  box-sizing: border-box;
  width: 100%;
  padding: 0 16px;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-nav-font);
  flex: none;

  .collapsed & {
    justify-content: center;
    padding: 0;
  }
}

.logoMark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background-color: var(--ui-surface-active);
  color: var(--color-nav-font);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex: none;
}

.logoName {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  opacity: 0.92;
  .mixin-ellipsis-1();
}

.footer {
  flex: none;
  padding: 8px 10px 0;
  -webkit-app-region: no-drag;
}

.collapseBtn {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: none;
  border-radius: var(--ui-radius-md);
  background: transparent;
  color: var(--color-nav-font);
  opacity: 0.72;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
  font-size: 12px;
  transition: background-color @transition-fast, opacity @transition-fast;

  .collapsed & {
    justify-content: center;
    padding: 0;
  }

  &:hover {
    opacity: 1;
    background-color: var(--ui-surface-hover);
    background-color: color-mix(in srgb, var(--color-nav-font) 10%, transparent);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }

  svg {
    flex: none;
    transition: transform @transition-fast;
  }
}

.flipped {
  transform: rotate(180deg);
}

.collapseLabel {
  .mixin-ellipsis-1();
}

</style>
