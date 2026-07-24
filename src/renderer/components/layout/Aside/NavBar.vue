<template>
  <div ref="dom_menu" :class="$style.menu">
    <ul :class="$style.list" role="toolbar">
      <li v-for="item in menusFirst" :key="item.to" :class="$style.navItem" role="presentation">
        <router-link :class="[$style.link, {[$style.active]: $route.meta.name == item.name}]" role="tab" :aria-selected="$route.meta.name == item.name" :to="item.to" :aria-label="item.tips">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" :viewBox="item.iconSize" :class="$style.icon" space="preserve">
            <use :xlink:href="item.icon" />
          </svg>
          <span :class="$style.text">{{ item.label }}</span>
        </router-link>
      </li>
      <li :class="$style.divider" role="separator"></li>
      <li v-for="item in menusSecond" :key="item.to" :class="$style.navItem" role="presentation">
        <router-link :class="[$style.link, {[$style.active]: $route.meta.name == item.name}]" role="tab" :aria-selected="$route.meta.name == item.name" :to="item.to" :aria-label="item.tips">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" :viewBox="item.iconSize" :class="$style.icon" space="preserve">
            <use :xlink:href="item.icon" />
          </svg>
          <span :class="$style.text">{{ item.label }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { appSetting } from '@renderer/store/setting'
import { useI18n } from '@root/lang'
import { ref, computed } from '@common/utils/vueTools'
import { useIconSize } from '@renderer/utils/compositions/useIconSize'

export default {
  name: 'NavBar',
  setup() {
    const t = useI18n()
    const dom_menu = ref<HTMLElement>()
    const iconSize = useIconSize(dom_menu, 0.1)

    const menusFirst = computed(() => {
      const size = iconSize.value
      return [
        {
          to: '/search',
          tips: t('search'),
          label: '搜索',
          icon: '#icon-search-2',
          iconSize: '0 0 425.2 425.2',
          size,
          name: 'Search',
          enable: true,
        },
        {
          to: '/songList/list',
          tips: t('song_list'),
          label: '歌单',
          icon: '#icon-album',
          iconSize: '0 0 425.2 425.2',
          size,
          name: 'SongList',
          enable: true,
        },
        {
          to: '/leaderboard',
          tips: t('leaderboard'),
          label: '排行',
          icon: '#icon-leaderboard',
          iconSize: '0 0 425.22 425.2',
          size,
          name: 'Leaderboard',
          enable: true,
        },
      ].filter(m => m.enable)
    })

    const menusSecond = computed(() => {
      const size = iconSize.value
      return [
        {
          to: '/download',
          tips: t('download'),
          label: '下载管理',
          icon: '#icon-download-2',
          iconSize: '0 0 425.2 425.2',
          size,
          enable: appSetting['download.enable'],
          name: 'Download',
        },
        {
          to: '/list',
          tips: t('my_list'),
          label: '歌曲列表',
          icon: '#icon-love',
          iconSize: '0 0 444.87 391.18',
          size,
          name: 'List',
          enable: true,
        },
      ].filter(m => m.enable)
    })
    return {
      appSetting,
      menusFirst,
      menusSecond,
      dom_menu,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.menu {
  flex: auto;
  padding: 4px 12px 12px 12px;
}
.list {
  -webkit-app-region: no-drag;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.navItem {
  position: relative;
  width: 100%;
  list-style: none;
  margin: 0;
  padding: 0;
}
.divider {
  width: 100%;
  height: 1px;
  background-color: var(--color-primary-light-400-alpha-700);
  margin: 8px 0 6px 0;
  list-style: none;
  padding: 0;
}
.link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 36px;
  padding: 0 16px;
  box-sizing: border-box;
  border-radius: 4px;
  transition: @transition-fast;
  transition-property: background-color, opacity, color;
  color: var(--color-nav-font);
  font-weight: normal;
  cursor: pointer;
  outline: none;
  text-decoration: none;

  &.active {
    background-color: var(--color-primary-light-300-alpha-700);
    color: var(--color-primary);
  }
}

.icon {
  flex: none;
  width: 22px;
  height: 22px;
}

.text {
  flex: auto;
  font-size: 16px;
  font-weight: normal;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>

