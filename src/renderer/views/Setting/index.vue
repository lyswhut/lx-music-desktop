<template>
  <div :class="$style.main">
    <div :class="$style.pageHeader">
      <div :class="$style.pageIcon">
        <svg-icon name="tune-variant" />
      </div>
      <div :class="$style.pageInfo">
        <span :class="$style.pageTitle">{{ $t('setting') }}</span>
        <span :class="$style.pageDesc">{{ $t('setting__desc') }}</span>
      </div>
    </div>
    <div class="scroll" :class="$style.toc">
      <ul :class="$style.tocList" role="toolbar">
        <li v-for="h2 in tocList" :key="h2.id" :class="$style.tocListItem" role="presentation">
          <h2
            :class="[$style.tocH2, {[$style.active]: avtiveComponentName == h2.id }]"
            role="tab" :aria-selected="avtiveComponentName == h2.id"
            :aria-label="h2.title" ignore-tip @click="toggleTab(h2.id)"
          >{{ h2.title }}</h2>
        </li>
      </ul>
    </div>
    <div ref="dom_content_ref" class="scroll" :class="$style.setting">
      <dl>
        <div v-for="h2 in tocList" :id="h2.id" :key="h2.id" :class="$style.section">
          <component :is="h2.id" />
        </div>
      </dl>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, onMounted } from '@common/utils/vueTools'
// import { currentStting } from './setting'
import { useI18n } from '@renderer/plugins/i18n'
import { useRoute } from '@common/utils/vueRouter'

import SettingBasic from './components/SettingBasic.vue'
import SettingPlay from './components/SettingPlay.vue'
import SettingPlayDetail from './components/SettingPlayDetail.vue'
import SettingDesktopLyric from './components/SettingDesktopLyric.vue'
import SettingSearch from './components/SettingSearch.vue'
import SettingList from './components/SettingList.vue'
import SettingDownload from './components/SettingDownload.vue'
import SettingSync from './components/SettingSync/index.vue'
import SettingOpenAPI from './components/SettingOpenAPI.vue'
import SettingHotKey from './components/SettingHotKey.vue'
import SettingNetwork from './components/SettingNetwork.vue'
import SettingOdc from './components/SettingOdc.vue'
import SettingBackup from './components/SettingBackup.vue'
import SettingOther from './components/SettingOther.vue'
import SettingUpdate from './components/SettingUpdate.vue'
import SettingAbout from './components/SettingAbout.vue'

export default {
  name: 'Setting',
  components: {
    SettingBasic,
    SettingPlay,
    SettingPlayDetail,
    SettingDesktopLyric,
    SettingSearch,
    SettingList,
    SettingDownload,
    SettingSync,
    SettingOpenAPI,
    SettingHotKey,
    SettingNetwork,
    SettingOdc,
    SettingBackup,
    SettingOther,
    SettingUpdate,
    SettingAbout,
  },
  setup() {
    const t = useI18n()
    const route = useRoute()

    const dom_content_ref = ref(null)

    const tocList = computed(() => {
      return [
        { id: 'SettingBasic', title: t('setting__basic') },
        { id: 'SettingPlay', title: t('setting__play') },
        { id: 'SettingPlayDetail', title: t('setting__play_detail') },
        { id: 'SettingDesktopLyric', title: t('setting__desktop_lyric') },
        { id: 'SettingSearch', title: t('setting__search') },
        { id: 'SettingList', title: t('setting__list') },
        { id: 'SettingDownload', title: t('setting__download') },
        { id: 'SettingHotKey', title: t('setting__hot_key') },
        { id: 'SettingSync', title: t('setting__sync') },
        { id: 'SettingOpenAPI', title: t('setting__open_api') },
        { id: 'SettingNetwork', title: t('setting__network') },
        { id: 'SettingOdc', title: t('setting__odc') },
        { id: 'SettingBackup', title: t('setting__backup') },
        { id: 'SettingOther', title: t('setting__other') },
        { id: 'SettingUpdate', title: t('setting__update') },
        { id: 'SettingAbout', title: t('setting__about') },
      ]
    })

    const avtiveComponentName = ref(route.query.name && tocList.value.some(t => t.id == route.query.name)
      ? route.query.name
      : tocList.value[0].id)

    // 滚动定位到分区时，与顶部标签行保留的间距（与内容区上内边距一致）
    const SCROLL_TOP_GAP = 14

    const scrollToTab = id => {
      const container = dom_content_ref.value
      const el = container?.querySelector('#' + id)
      if (!el) return
      container.scrollTo({
        top: Math.max(el.offsetTop - SCROLL_TOP_GAP, 0),
        behavior: 'smooth',
      })
    }

    const toggleTab = id => {
      avtiveComponentName.value = id
      scrollToTab(id)
    }

    onMounted(() => {
      if (avtiveComponentName.value != tocList.value[0].id) {
        void nextTick(() => {
          scrollToTab(avtiveComponentName.value)
        })
      }
    })

    return {
      tocList,
      avtiveComponentName,
      dom_content_ref,
      toggleTab,
    }
  },
  // mounted() {
  //   this.initTOC()
  // },
  // methods: {
  //   initTOC() {
  //     const list = this.$refs.dom_setting_list.children
  //     const toc = []
  //     let prevTitle
  //     for (const item of list) {
  //       if (item.tagName == 'DT') {
  //         prevTitle = {
  //           title: item.innerText.replace(/[（(].+?[)）]/, ''),
  //           id: item.getAttribute('id'),
  //           dom: item,
  //           children: [],
  //         }
  //         toc.push(prevTitle)
  //         continue
  //       }
  //       const h3 = item.querySelector('h3')
  //       if (h3) {
  //         prevTitle.children.push({
  //           title: h3.innerText.replace(/[（(].+?[)）]/, ''),
  //           id: h3.getAttribute('id'),
  //           dom: h3,
  //         })
  //       }
  //     }
  //     console.log(toc)
  //     this.toc.list = toc
  //   },
  //   handleListScroll(event) {
  //     // console.log(event.target.scrollTop)
  //   },
  // },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
}

.pageHeader {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 12px;
  padding: 0 15px 10px;
}
.pageIcon {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background-color: var(--color-primary-light-300-alpha-700);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  svg {
    width: 36px;
    height: 36px;
    fill: currentColor;
  }
}
.pageInfo {
  display: flex;
  flex-flow: column nowrap;
  gap: 4px;
}
.pageTitle {
  font-size: 28px;
  font-weight: normal;
  color: var(--color-primary);
}
.pageDesc {
  font-size: 13px;
  color: var(--color-font-label);
}

.toc {
  flex: 0 0 auto;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid var(--color-primary-light-400-alpha-300);
  // 偏移与负扩散相抵，阴影只出现在下方，上方不投影
  box-shadow: 0 5px 10px -5px rgba(0, 0, 0, 0.15);
}
.tocList {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  padding: 0 6px;
}
.tocListItem {
  flex: 0 0 auto;
}
.tocH2 {
  line-height: 1.5;
  font-size: 13px;
  color: var(--color-font);
  padding: 8px;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: @transition-fast;
  transition-property: background-color, color, border-color;

  &:not(.active) {
    cursor: pointer;
    &:hover {
      background-color: var(--color-button-background-hover);
    }
  }
  &.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }
}

.setting {
  flex: 1 1 auto;
  min-height: 0;
  // 与上方标签行拉开距离
  padding: 14px 15px 15px;
  font-size: 14px;
  box-sizing: border-box;
  overflow-y: auto;
  position: relative;
  width: 100%;

  .section {
    &:first-child {
      :global(dt) {
        margin-top: 0;
      }
    }
  }

  :global {
    dt {
      border-left: 5px solid var(--color-primary-alpha-700);
      padding: 3px 7px;
      margin: 15px 0;

      + dd h3 {
        margin-top: 0;
      }
    }

    dd {
      // margin-left: 15px;
      // font-size: 13px;
      > div {
        padding: 0 15px;
      }

    }

    // 无标题的纯复选框设置块同样渲染为卡片，与下方带标题的卡片保持一致的浅色圆角底
    dd.cardBlock {
      border-radius: 8px;
      background-color: var(--color-primary-light-300-alpha-700);
      padding: 12px 0;
      margin-bottom: 16px;
    }

    // 带标题的设置分区统一渲染为卡片（标题色带 + 浅色底），与 SettingBasic 中 .sectionCard 样式一致
    dd:has(> h3) {
      border-radius: 8px;
      background-color: var(--color-primary-light-300-alpha-700);
      padding-bottom: 12px;
      margin-bottom: 16px;

      > h3 {
        margin: 0 0 12px;
        padding: 8px 16px;
        font-size: 13px;
        background-color: var(--color-primary-light-200-alpha-600);
        border-radius: 8px 8px 0 0;
      }

      > div {
        padding: 0 16px;
      }

      > div + div {
        margin-top: 8px;
      }

      > div:empty {
        display: none;
      }

      // 卡片内的复选框/下拉选项组统一改为竖向一列，与"窗口尺寸"卡片一致
      > div > .gap-left {
        display: block;

        + .gap-left {
          margin-left: 0;
          margin-top: 10px;
        }
      }
    }
    // 仅作用于 dd 的直接子标题，避免影响 .sectionCard 内部的标题色带
    dd > h3 {
      font-size: 12px;
      margin: 25px 0 15px;
    }
    .p {
      padding: 3px 0;
      line-height: 1.3;
      .btn {
        + .btn {
          margin-left: 10px;
        }
      }
    }

    .help-btn {
      padding: 0;
      margin: 0 0.4em;
      border: none;
      background: none;
      color: var(--color-button-font);
      cursor: pointer;
      transition: opacity 0.2s ease;
      &:hover {
        opacity: 0.7;
      }
    }
    .help-icon {
      margin: 0 0.4em;
    }
  }
}

// .btn-content {
//   display: inline-block;
//   transition: @transition-theme;
//   transition-property: opacity, transform;
//   opacity: 1;
//   transform: scale(1);

//   &.hide {
//     opacity: 0;
//     transform: scale(0);
//   }
// }


// :global(dt):target, :global(h3):target {
//   animation: highlight 1s ease;
// }

// @keyframes highlight {
//   from { background: yellow; }
//   to { background: transparent; }
// }

</style>
