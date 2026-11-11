<template>
  <div :class="[$style.menu, { [$style.expanded]: isAsideExpanded }]">
    <ul :class="$style.list" role="toolbar">
      <template v-for="(item, index) in menus" :key="item.to">
        <li v-if="isAsideExpanded && index === 3" :class="$style.divider" aria-hidden="true" />
        <li :class="[$style.navItem, { [$style.expanded]: isAsideExpanded }]" role="presentation">
          <router-link :class="[$style.link, {[$style.active]: $route.meta.name == item.name, [$style.expanded]: isAsideExpanded}]" role="tab" :aria-selected="$route.meta.name == item.name" :to="item.to" :aria-label="item.tips">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" :viewBox="item.iconSize" :height="item.size" :width="item.size" space="preserve">
              <use :xlink:href="item.icon" />
            </svg>
            <span v-if="isAsideExpanded" :class="$style.label">{{ item.tips }}</span>
          </router-link>
        </li>
      </template>
    </ul>
  </div>
</template>

<script lang="ts">
import { appSetting } from '@renderer/store/setting'
import { isAsideExpanded } from '@renderer/store'
import { useI18n } from '@root/lang'
import { computed } from '@common/utils/vueTools'

export default {
  name: 'NavBar',
  setup() {
    const t = useI18n()
    // 固定图标尺寸：展开/折叠切换时仅隐藏文字，图标大小保持不变，避免缩放动画。
    const size = computed(() => '24px')

    const menus = computed(() => {
      const itemSize = size.value
      return [
        {
          to: '/search',
          tips: t('search'),
          icon: '#icon-search-2',
          iconSize: '0 0 425.2 425.2',
          size: itemSize,
          name: 'Search',
          enable: true,
        },
        {
          to: '/songList/list',
          tips: t('song_list'),
          icon: '#icon-album',
          iconSize: '0 0 425.2 425.2',
          size: itemSize,
          name: 'SongList',
          enable: true,
        },
        {
          to: '/leaderboard',
          tips: t('leaderboard'),
          icon: '#icon-leaderboard',
          iconSize: '0 0 425.22 425.2',
          size: itemSize,
          name: 'Leaderboard',
          enable: true,
        },
        {
          to: '/list',
          tips: t('my_list'),
          icon: '#icon-love',
          iconSize: '0 0 444.87 391.18',
          size: itemSize,
          name: 'List',
          enable: true,
        },
        {
          to: '/download',
          tips: t('download'),
          icon: '#icon-download-2',
          iconSize: '0 0 425.2 425.2',
          size: itemSize,
          enable: appSetting['download.enable'],
          name: 'Download',
        },
        {
          to: '/localMusic',
          tips: t('local_music'),
          icon: '#icon-folder',
          iconSize: '0 0 100 100',
          size: itemSize,
          name: 'LocalMusic',
          enable: true,
        },
      ].filter(m => m.enable)
    })
    return {
      appSetting,
      menus,
      isAsideExpanded,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.menu {
  flex: auto;
  // &.controlBtnLeft {
  //   display: flex;
  //   flex-flow: column nowrap;
  //   justify-content: center;
  //   padding-bottom: @control-btn-height;
  // }
  // padding: 5px;

  &.expanded {
    padding: 0 7px;
  }
}
.list {
  -webkit-app-region: no-drag;
  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  gap: 3px;
  // margin-bottom: 15px;
  &:last-child {
    margin-bottom: 0;
  }
  // background-color: pink;
  // dt {
  //   padding-left: 5px;
  //   font-size: 11px;
  //   transition: @transition-normal;
  //   transition-property: color;
  //   color: @color-theme-font-label;
  //   .mixin-ellipsis-1();
  // }
}
.navItem {
  position: relative;
  height: 46px;
}
.divider {
  height: 1px;
  margin: 6px 10px;
  background-color: var(--color-primary-dark-100-alpha-700);
}
.label {
  font-size: 16px;
  .mixin-ellipsis-1();
}
.link {
  position: absolute;
  inset: 2px 8px;
  box-sizing: border-box;
  transition: @transition-fast;
  transition-property: background-color, opacity;
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  text-align: center;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;

  .mixin-ellipsis-1();

  &.active {
    background-color: var(--color-primary-light-300-alpha-700);
  }

  &:active:not(.active) {
    opacity: .6;
    background-color: var(--color-primary-light-300-alpha-600);
  }

  &.expanded {
    inset: 4px 12px;
    flex-flow: row nowrap;
    justify-content: flex-start;
    gap: 14px;
    padding: 0 14px;
  }
}

// .icon {
//   // margin-bottom: 5px;
//   &> svg {
//     width: 32%;
//   }
// }

</style>
