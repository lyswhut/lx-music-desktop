<template>
  <div :class="[$style.toolbar, { [$style.fullscreen]: isFullscreen }, appSetting['common.controlBtnPosition'] == 'left' ? $style.controlBtnLeft : $style.controlBtnRight]">
    <div :class="$style.lead">
      <div :class="$style.arrows">
        <button type="button" :class="[$style.arrow, 'chrome-ib']" :disabled="!canBack" :aria-label="$t('back')" ignore-tip @click="goBack">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-line-back" />
          </svg>
        </button>
        <button type="button" :class="[$style.arrow, 'chrome-ib']" :disabled="!canForward" :aria-label="$t('toolbar__forward')" ignore-tip @click="goForward">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-line-forward" />
          </svg>
        </button>
      </div>
      <span v-if="pageTitle" :class="$style.title">{{ pageTitle }}</span>
    </div>
    <SearchInput />
    <ControlBtns v-if="!isMac && appSetting['common.controlBtnPosition'] != 'left'" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from '@common/utils/vueTools'
import { useRoute, useRouter } from '@common/utils/vueRouter'
import { useI18n } from '@renderer/plugins/i18n'
import { isFullscreen } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import ControlBtns from './ControlBtns.vue'
import SearchInput from './SearchInput.vue'

const route = useRoute()
const router = useRouter()
const t = useI18n()
const isMac = window.os == 'mac' || document.documentElement.classList.contains('mac')
const canBack = ref(false)
const canForward = ref(false)

const syncHistory = () => {
  const state = window.history.state
  canBack.value = Boolean(state?.back)
  canForward.value = Boolean(state?.forward)
}

watch(() => route.fullPath, syncHistory, { immediate: true })

const goBack = () => {
  if (!canBack.value) return
  router.back()
}
const goForward = () => {
  if (!canForward.value) return
  router.forward()
}

const pageTitle = computed(() => {
  if (String(route.path).includes('songList/detail') || String(route.name) == 'SongListDetail') {
    return t('lists__source_detail').replace(/页$/, '')
  }
  if (route.meta.name == 'Search' || String(route.path).startsWith('/search')) return ''
  switch (route.meta.name) {
    case 'SongList':
      return t('songlist__title')
    case 'Leaderboard':
      return t('leaderboard')
    case 'List':
      return t('nav__library')
    case 'Download':
      return t('download__title')
    case 'Setting':
      return t('setting')
    default:
      return 'LX Music'
  }
})

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.toolbar {
  display: flex;
  box-sizing: border-box;
  height: @height-toolbar;
  align-items: center;
  gap: 13px;
  justify-content: space-between;
  padding: 0 25px;
  -webkit-app-region: drag;
  z-index: 2;
  border-bottom: 1px solid var(--color-line);
  background: var(--color-glass-strong, var(--color-glass, var(--color-main-background)));
  backdrop-filter: blur(20px);

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

.lead {
  flex: none;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.arrows {
  flex: none;
  display: flex;
  gap: 3px;
  -webkit-app-region: no-drag;
}

.arrow {
  svg {
    width: 19px;
    height: 19px;
  }
}

.title {
  font-size: 12px;
  font-weight: 580;
  .mixin-ellipsis-1();
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
}

@media (max-width: 920px) {
  .toolbar {
    gap: 6px;
    padding: 0 12px;
  }
  .title {
    font-size: 12px;
  }
}
</style>
