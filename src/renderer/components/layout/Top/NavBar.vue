<template>
    <div ref="dom_menu">
        <ul :class="$style.list" role="toolbar">
            <li v-for="item in menus" :key="item.to" :class="$style.navItem" role="presentation">
                <router-link
:class="[$style.link, { [$style.active]: $route.meta.name == item.name }]" role="tab"
                    :aria-selected="$route.meta.name == item.name" :to="item.to" :aria-label="item.tips"
                    >{{ item.title }}</router-link>
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
    const iconSize = useIconSize(dom_menu, 0.32)

    const menus = computed(() => {
      const size = iconSize.value
      return [
        {
          to: '/list',
          tips: t('my_list'),
          size,
          name: 'List',
          enable: true,
          title: '音乐库',
        },
        {
          to: '/search',
          tips: t('search'),
          size,
          name: 'Search',
          enable: true,
          title: '搜索',
        },
        {
          to: '/songList/list',
          tips: t('song_list'),
          size,
          name: 'SongList',
          enable: true,
          title: '歌单广场',
        },
        {
          to: '/leaderboard',
          tips: t('leaderboard'),
          size,
          name: 'Leaderboard',
          enable: true,
          title: '排行榜',
        },
        {
          to: '/setting',
          tips: t('setting'),
          size,
          enable: true,
          name: 'Setting',
          title: '设置',
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
.list {
    flex: 1;
    display: flex;
    justify-content: center;
    text-transform: uppercase;
    user-select: none;

    a {
        -webkit-app-region: no-drag;
        font-size: 18px;
        font-weight: 700;
        text-decoration: none;
        border-radius: 6px;
        padding: 6px 10px;
        color: var(--color-1000);
        transition: 0.2s;
        -webkit-user-drag: none;

        margin-right: 12px;
        margin-left: 12px;

        &:hover {
            background: var(--color-primary-dark-500-alpha-900);
        }

        &:active {
            transform: scale(0.92);
            transition: 0.2s;
        }
    }

    a.active {
        color: var(--color-primary);
    }
}
</style>
