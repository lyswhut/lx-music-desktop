<template>
  <div ref="dom_menu" :class="[$style.menu, { [$style.collapsed]: collapsed }]" class="scroll">
    <ul :class="$style.list" role="toolbar">
      <li v-for="item in menus" :key="item.to" :class="$style.navItem" role="presentation">
        <router-link
          :class="[$style.link, { [$style.active]: $route.meta.name == item.name }]"
          role="tab"
          :aria-selected="$route.meta.name == item.name"
          :to="item.to"
          :aria-label="item.tips"
          :ignore-tip="!collapsed ? '' : null"
        >
          <span :class="$style.iconWrap">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" :viewBox="item.iconSize" width="18" height="18" space="preserve">
              <use :xlink:href="item.icon" />
            </svg>
            <span v-if="item.live" :class="$style.liveDot" />
          </span>
          <span v-if="!collapsed" :class="$style.label">{{ item.tips }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { appSetting } from '@renderer/store/setting'
import { playInfo } from '@renderer/store/player/state'
import { sessionView } from '@renderer/core/recommend/session'
import { useI18n } from '@root/lang'
import { ref, computed } from '@common/utils/vueTools'

export default {
  name: 'NavBar',
  props: {
    collapsed: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const t = useI18n()
    const dom_menu = ref<HTMLElement>()
    const isRadioLive = computed(() => sessionView.value.active || (appSetting['recommend.radio'] && !playInfo.isSelectionQueue))

    const menus = computed(() => {
      return [
        {
          to: '/search',
          tips: t('search'),
          icon: '#icon-search-2',
          iconSize: '0 0 425.2 425.2',
          name: 'Search',
          enable: true,
          live: false,
        },
        {
          to: '/songList/list',
          tips: t('song_list'),
          icon: '#icon-album',
          iconSize: '0 0 425.2 425.2',
          name: 'SongList',
          enable: true,
          live: false,
        },
        {
          to: '/leaderboard',
          tips: t('leaderboard'),
          icon: '#icon-leaderboard',
          iconSize: '0 0 425.22 425.2',
          name: 'Leaderboard',
          enable: true,
          live: false,
        },
        {
          to: '/explore',
          tips: t('explore'),
          icon: '#icon-explore',
          iconSize: '0 0 512 512',
          name: 'Explore',
          enable: true,
          live: isRadioLive.value,
        },
        {
          to: '/list',
          tips: t('my_list'),
          icon: '#icon-love',
          iconSize: '0 0 444.87 391.18',
          name: 'List',
          enable: true,
          live: false,
        },
        {
          to: '/download',
          tips: t('download'),
          icon: '#icon-download-2',
          iconSize: '0 0 425.2 425.2',
          enable: appSetting['download.enable'],
          name: 'Download',
          live: false,
        },
        {
          to: '/setting',
          tips: t('setting'),
          icon: '#icon-setting',
          iconSize: '0 0 493.23 436.47',
          enable: true,
          name: 'Setting',
          live: false,
        },
      ].filter(m => m.enable)
    })
    return {
      appSetting,
      menus,
      dom_menu,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.menu {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 10px;
  box-sizing: border-box;
}

.list {
  -webkit-app-region: no-drag;
  display: flex;
  flex-flow: column nowrap;
  gap: 4px;
}

.navItem {
  position: relative;
  flex: none;
}

.link {
  position: relative;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  border-radius: var(--ui-radius-md);
  transition: background-color @transition-fast, color @transition-fast, opacity @transition-fast;
  color: var(--color-nav-font);
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 13.5px;
  font-weight: 500;
  opacity: 0.78;
  text-decoration: none;

  .collapsed & {
    justify-content: center;
    padding: 0;
  }

  &:before {
    content: '';
    position: absolute;
    left: 2px;
    top: 10px;
    width: 3px;
    height: 20px;
    background-color: var(--color-primary);
    border-radius: 999px;
    opacity: 0;
    transform: scaleY(0.4);
    transition: transform @transition-fast, opacity @transition-fast;
  }

  &.active {
    opacity: 1;
    font-weight: 600;
    background-color: var(--ui-surface-active);

    &:before {
      opacity: 1;
      transform: scaleY(1);
    }

    &:hover {
      background-color: var(--ui-surface-active);
      background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
    }
  }

  &:hover {
    color: var(--color-nav-font);
    opacity: 1;

    &:not(.active) {
      background-color: var(--ui-surface-hover);
      background-color: color-mix(in srgb, var(--color-nav-font) 10%, transparent);
    }
  }

  &:active:not(.active) {
    background-color: var(--ui-surface-active);
    background-color: color-mix(in srgb, var(--color-nav-font) 15%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
}

.iconWrap {
  position: relative;
  flex: none;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@keyframes liveDotPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.84);
  }
}

.liveDot {
  position: absolute;
  top: -1px;
  right: -2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-app-background);
  animation: liveDotPulse 2.2s ease-in-out infinite;
}

:global(.disableAnimation) .liveDot {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .liveDot {
    animation: none;
  }
}

.label {
  flex: 1 1 auto;
  min-width: 0;
  .mixin-ellipsis-1();
}

</style>
