<template>
  <div ref="dom_menu" :class="[$style.menu, {[$style.collapsed]: collapsed}]">
    <!-- 第一组：搜索、歌单、排行 -->
    <ul :class="$style.list" role="toolbar">
      <li v-for="item in group1Menus" :key="item.to" :class="$style.navItem" role="presentation">
        <router-link :class="[$style.link, {[$style.active]: $route.meta.name == item.name}]" role="tab" :aria-selected="$route.meta.name == item.name" :to="item.to" :aria-label="item.tips" :title="collapsed ? item.tips : undefined">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" :viewBox="item.iconSize" :height="item.size" :width="item.size" space="preserve" :class="$style.icon">
            <use :xlink:href="item.icon" />
          </svg>
          <span :class="$style.label">{{ item.tips }}</span>
        </router-link>
      </li>
    </ul>

    <!-- 分隔线 -->
    <div :class="$style.divider"></div>

    <!-- 第二组：下载、歌曲列表、设置 -->
    <ul :class="$style.list" role="toolbar">
      <li v-for="item in group2Menus" :key="item.to" :class="$style.navItem" role="presentation">
        <router-link :class="[$style.link, {[$style.active]: $route.meta.name == item.name}]" role="tab" :aria-selected="$route.meta.name == item.name" :to="item.to" :aria-label="item.tips" :title="collapsed ? item.tips : undefined">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" :viewBox="item.iconSize" :height="item.size" :width="item.size" space="preserve" :class="$style.icon">
            <use :xlink:href="item.icon" />
          </svg>
          <span :class="$style.label">{{ item.tips }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { appSetting } from '@renderer/store/setting'
import { useI18n } from '@root/lang'
import { ref, computed } from '@common/utils/vueTools'

export default {
  name: 'NavBar',
  props: {
    collapsed: Boolean,
  },
  setup() {
    const t = useI18n()
    const dom_menu = ref<HTMLElement>()

    const allMenus = computed(() => {
      const size = 18
      return [
        {
          to: '/search',
          tips: t('search'),
          icon: '#icon-search-2',
          iconSize: '0 0 425.2 425.2',
          size,
          name: 'Search',
          enable: true,
        },
        {
          to: '/songList/list',
          tips: t('song_list'),
          icon: '#icon-album',
          iconSize: '0 0 425.2 425.2',
          size,
          name: 'SongList',
          enable: true,
        },
        {
          to: '/leaderboard',
          tips: t('leaderboard'),
          icon: '#icon-leaderboard',
          iconSize: '0 0 425.22 425.2',
          size,
          name: 'Leaderboard',
          enable: true,
        },
        {
          to: '/list',
          tips: t('my_list'),
          icon: '#icon-love',
          iconSize: '0 0 444.87 391.18',
          size,
          name: 'List',
          enable: true,
        },
        {
          to: '/download',
          tips: t('download'),
          icon: '#icon-download-2',
          iconSize: '0 0 425.2 425.2',
          size,
          enable: appSetting['download.enable'],
          name: 'Download',
        },
      ].filter(m => m.enable)
    })

    // 第一组：搜索、歌单、排行
    const group1Menus = computed(() => {
      return allMenus.value.filter(m => ['Search', 'SongList', 'Leaderboard'].includes(m.name))
    })

    // 第二组：下载、歌曲列表
    const group2Menus = computed(() => {
      return allMenus.value.filter(m => ['Download', 'List'].includes(m.name))
    })

    return {
      appSetting,
      allMenus,
      group1Menus,
      group2Menus,
      dom_menu,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.menu {
  flex: auto;
  display: flex;
  flex-direction: column;
  padding: 8px 12px 16px;
  overflow-y: auto;
  -webkit-app-region: no-drag;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.divider {
  height: 1px;
  margin: 8px 8px;
  background-color: var(--color-primary-dark-200-alpha-200);
}

.navItem {
  margin-bottom: 4px;
}

.link {
  display: flex;
  align-items: center;
  gap: 12px;
  // 左右留出间距，缩小选中/悬停背景的宽度
  margin: 0 8px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color @transition-fast;
  text-decoration: none;
  color: var(--color-primary-dark-300);

  &:hover {
    background-color: transparent;
  }

  &.active {
    background-color: var(--color-primary-light-400);
    color: var(--color-primary-dark-300);
  }
}

.icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  svg {
    fill: currentColor;
  }
}

.label {
  flex: auto;
  font-size: 16px;
  line-height: 1.3;
  .mixin-ellipsis-1();
}

.collapsed {
  padding: 8px 0 16px;

  .link {
    justify-content: center;
    gap: 0;
    padding: 10px 0;
  }

  .label {
    display: none;
  }

  .divider {
    display: none;
  }
}

</style>
