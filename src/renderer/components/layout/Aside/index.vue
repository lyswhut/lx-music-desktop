<template>
  <div :class="[$style.aside, { [$style.fullscreen]: isFullscreen, [$style.narrow]: isNarrow }]">
    <div :class="$style.titlebar">
      <ControlBtns v-if="showMacTraffic || appSetting['common.controlBtnPosition'] == 'left'" />
    </div>
    <div :class="$style.brand">
      <span :class="$style.brandMark">
        <svg :class="$style.brandMarkSvg" viewBox="0 0 36 36" aria-hidden="true">
          <path d="M8 10v17h9M18 10l11 17M29 10 18 27" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span :class="$style.brandCopy">
        <span :class="$style.brandName">LX Music</span>
        <span :class="$style.brandSub">MUSIC, SIMPLY.</span>
      </span>
    </div>
    <NavBar />
    <div :class="$style.navscroll">
      <div :class="$style.playlists">
        <MyList embedded hide-pinned :list-id="sidebarListId" />
      </div>
    </div>
    <div class="chrome-side-bottom">
      <router-link
        :class="['chrome-nav-row', { active: route.meta.name == 'Setting' }]"
        to="/setting"
        :aria-label="$t('setting')"
        ignore-tip
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <use xlink:href="#icon-line-gear" />
        </svg>
        <span :class="$style.settingLabel">{{ $t('setting') }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from '@common/utils/vueTools'
import { useRoute } from '@common/utils/vueRouter'
import { isFullscreen } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import ControlBtns from './ControlBtns.vue'
import NavBar from './NavBar.vue'
import MyList from '@renderer/views/List/MyList/index.vue'

const route = useRoute()
const isNarrow = ref(false)
const showMacTraffic = window.os == 'mac' || document.documentElement.classList.contains('mac')
const sidebarListId = computed(() => {
  return route.name == 'List' && typeof route.query.id == 'string' ? route.query.id : ''
})

let media
const syncNarrow = () => {
  isNarrow.value = !!media?.matches
}

onMounted(() => {
  media = window.matchMedia('(max-width: 960px)')
  syncNarrow()
  media.addEventListener('change', syncNarrow)
})
onBeforeUnmount(() => {
  media?.removeEventListener('change', syncNarrow)
})

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
  min-height: 0;
  padding: 0 12px;
  color: var(--color-font);
  background: var(--color-glass, transparent);
  backdrop-filter: blur(36px) saturate(1.3);
  border-right: 1px solid var(--color-line, var(--color-primary-alpha-900));

  &.fullscreen {
    -webkit-app-region: no-drag;
  }
}

.titlebar {
  flex: none;
  height: 55px;
  display: flex;
  align-items: center;
}

.brand {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px 29px;
  color: var(--color-font);
}

.brandMark {
  box-sizing: border-box;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, #42b982, #148252);
  border: 1px solid #ffffff50;
  box-shadow: 0 3px 8px #24663820;
  color: #fff;
}

.brandMarkSvg {
  width: 25px;
  height: 25px;
}

.brandCopy {
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
}

.brandName {
  font-weight: 750;
  font-size: 18px;
  letter-spacing: -0.65px;
  line-height: 1.15;
}

.brandSub {
  display: block;
  margin-top: 1px;
  font-size: 9px;
  letter-spacing: 1.5px;
  color: var(--color-secondary, var(--color-font-label));
}

.navscroll {
  flex: auto;
  min-height: 0;
  display: flex;
  flex-flow: column nowrap;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
}

.playlists {
  flex: none;
  min-height: 0;
  display: flex;
  flex-flow: column nowrap;
  -webkit-app-region: no-drag;
}

.settingLabel {
  min-width: 0;
  .mixin-ellipsis-1();
}

:global(.chrome-side-bottom) {
  -webkit-app-region: no-drag;
}

.narrow {
  .brand {
    gap: 8px;
    padding: 5px 4px 16px;
  }
  .brandName {
    font-size: 16px;
  }
}
</style>
