<template>
  <nav ref="dom_menu" :class="$style.menu" aria-label="主导航" ignore-tip>
    <div v-for="group in groups" :key="group.id" :class="$style.group">
      <div :class="[$style.groupTitle, 'chrome-group-title']">{{ group.title }}</div>
      <ul :class="$style.list" role="toolbar">
        <li v-for="item in group.items" :key="item.queryId || item.name" :class="$style.navItem" role="presentation">
          <router-link
            :class="[$style.link, 'chrome-nav-row', { active: isActive(item) }]"
            role="tab"
            :aria-selected="isActive(item)"
            :to="item.to"
            :aria-label="item.tips"
            ignore-tip
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <use :xlink:href="item.icon" />
            </svg>
            <span :class="$style.label">{{ item.tips }}</span>
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script lang="ts">
import { appSetting } from '@renderer/store/setting'
import { useI18n } from '@root/lang'
import { computed } from '@common/utils/vueTools'
import { useRoute } from '@common/utils/vueRouter'
import { LIST_IDS } from '@common/constants'

export default {
  name: 'NavBar',
  setup() {
    const t = useI18n()
    const route = useRoute()

    const groups = computed(() => {
      return [
        {
          id: 'discover',
          title: t('nav__discover'),
          items: [
            {
              to: '/search',
              tips: t('search'),
              icon: '#icon-line-search',
              name: 'Search',
            },
            {
              to: '/songList/list',
              tips: t('songlist__title'),
              icon: '#icon-line-compass',
              name: 'SongList',
            },
            {
              to: '/leaderboard',
              tips: t('leaderboard'),
              icon: '#icon-line-chart',
              name: 'Leaderboard',
            },
          ],
        },
        {
          id: 'library',
          title: t('nav__library'),
          items: [
            {
              to: { path: '/list', query: { id: LIST_IDS.LOVE } },
              tips: t('list__name_love'),
              icon: '#icon-line-heart',
              name: 'List',
              queryId: LIST_IDS.LOVE,
            },
            {
              to: { path: '/list', query: { id: LIST_IDS.DEFAULT } },
              tips: t('list__name_default'),
              icon: '#icon-line-music',
              name: 'List',
              queryId: LIST_IDS.DEFAULT,
            },
            ...(appSetting['download.enable']
              ? [{
                  to: '/download',
                  tips: t('download__title'),
                  icon: '#icon-line-download',
                  name: 'Download',
                }]
              : []),
          ],
        },
      ]
    })

    const isActive = (item: { name: string, queryId?: string }) => {
      if (item.queryId) return route.name == 'List' && route.query.id == item.queryId
      return route.meta.name == item.name
    }

    return {
      appSetting,
      groups,
      isActive,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.menu {
  flex: none;
  display: flex;
  flex-flow: column nowrap;
  min-height: 0;
  padding-bottom: 4px;
  -webkit-app-region: no-drag;
}

.group {
  flex: none;
}

.groupTitle {
  -webkit-app-region: no-drag;
  .mixin-ellipsis-1();
}

.list {
  -webkit-app-region: no-drag;
  &:last-child {
    margin-bottom: 0;
  }
}

.navItem {
  position: relative;
}

.link {
  transition: background-color @transition-fast, color @transition-fast;
  cursor: pointer;
  outline: none;
}

.label {
  min-width: 0;
  .mixin-ellipsis-1();
}
</style>
