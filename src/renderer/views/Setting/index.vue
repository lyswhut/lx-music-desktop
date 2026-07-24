<template>
  <div :class="$style.main">
    <div :class="$style.header">
      <svg :class="$style.headerIcon" viewBox="0 0 498 498" aria-hidden="true" aria-label="设置">
        <g fill="currentColor">
          <path d="M248.61,314.89a94.65,94.65,0,1,1,94.65-94.65A94.76,94.76,0,0,1,248.61,314.89Zm0-149.53a54.88,54.88,0,1,0,54.88,54.88A54.94,54.94,0,0,0,248.61,165.36Z" />
          <path d="M492.33,201.89l-106-183.54A36.8,36.8,0,0,0,354.58,0H142.65a36.81,36.81,0,0,0-31.79,18.35L4.9,201.89a36.81,36.81,0,0,0,0,36.7l106,183.54a36.81,36.81,0,0,0,31.78,18.35H354.58a36.8,36.8,0,0,0,31.78-18.35l106-183.54A36.81,36.81,0,0,0,492.33,201.89ZM146.73,396.7,44.85,220.24,146.73,43.77H350.5L452.38,220.24,350.5,396.7Z" />
        </g>
      </svg>
      <div :class="$style.headerText">
        <div :class="$style.headerTitle">设置</div>
        <div :class="$style.headerDesc">管理应用设置</div>
      </div>
    </div>
    <div :class="$style.toc">
      <ul :class="$style.tocList" role="toolbar">
        <li v-for="h2 in tocList" :key="h2.id" :class="$style.tocListItem" role="presentation">
          <h2
            :class="[$style.tocH2, {[$style.active]: avtiveComponentName == h2.id }]"
            role="tab" :aria-selected="avtiveComponentName == h2.id"
            :aria-label="h2.title" ignore-tip @click="scrollToComponent(h2.id)"
          >
            {{ h2.title }}
          </h2>
        </li>
      </ul>
    </div>
    <div ref="dom_content_ref" class="scroll" :class="$style.setting" @scroll="handleScroll">
      <section v-for="h2 in tocList" :id="'section-' + h2.id" :key="h2.id" :class="$style.section">
        <dl>
          <component :is="h2.id" />
        </dl>
      </section>
    </div>
    <div v-if="showScrollTopBtn" :class="$style.scrollTopBtn" aria-label="返回顶部" title="返回顶部" @click="scrollToTop">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from '@common/utils/vueTools'
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
    const isScrollToComponent = ref(false)
    const showScrollTopBtn = ref(false)

    const tocList = computed(() => {
      return [
        { id: 'SettingBasic', title: t('setting__basic') },
        { id: 'SettingPlay', title: t('setting__play') },
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

    const scrollToComponent = id => {
      isScrollToComponent.value = true
      const section = document.getElementById('section-' + id)
      const container = dom_content_ref.value
      if (section && container) {
        const offsetTop = section.offsetTop
        container.scrollTo({
          top: offsetTop,
          behavior: 'smooth',
        })
        avtiveComponentName.value = id
        setTimeout(() => {
          isScrollToComponent.value = false
        }, 600)
      }
    }

    const scrollToTop = () => {
      const container = dom_content_ref.value
      if (!container) return
      // 优先滚动容器自身
      container.scrollTo({ top: 0, behavior: 'smooth' })
      // 如果 container.scrollTop 原本就是 0，说明它不是真正滚动容器
      // 兜底：向上查找有 overflow 的祖先并滚动
      if (container.scrollTop === 0) {
        let el = container.parentElement
        while (el && el !== document.body) {
          const style = getComputedStyle(el)
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            el.scrollTo({ top: 0, behavior: 'smooth' })
            break
          }
          el = el.parentElement
        }
      }
    }

    const checkScrollTop = () => {
      const container = dom_content_ref.value
      if (!container) return false
      // 优先检测容器自身的 scrollTop
      if (container.scrollTop > 100) return true
      // 兜底：如果 container 自身不是滚动容器，向上查找有 overflow 的祖先
      let el = container.parentElement
      while (el && el !== document.body) {
        const style = getComputedStyle(el)
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          if (el.scrollTop > 100) return true
        }
        el = el.parentElement
      }
      return false
    }

    const handleScroll = () => {
      const container = dom_content_ref.value
      if (!container) return
      showScrollTopBtn.value = checkScrollTop()
      if (isScrollToComponent.value) return
      const containerTop = container.getBoundingClientRect().top
      let currentId = tocList.value[0].id
      for (const item of tocList.value) {
        const section = document.getElementById('section-' + item.id)
        if (!section) continue
        const rect = section.getBoundingClientRect()
        if (rect.top - containerTop <= 50) {
          currentId = item.id
        } else {
          break
        }
      }
      if (avtiveComponentName.value !== currentId) {
        avtiveComponentName.value = currentId
      }
    }

    onMounted(() => {
      // 兜底：监听 window 滚动（有些页面滚动发生在外层容器）
      window.addEventListener('scroll', handleScroll, { passive: true })
      // 初始执行一次，确保状态正确
      handleScroll()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      tocList,
      avtiveComponentName,
      dom_content_ref,
      scrollToComponent,
      scrollToTop,
      handleScroll,
      showScrollTopBtn,
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
  padding-top: 0;
  margin-top: -16px;
}

.header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
}
.headerIcon {
  width: 40px;
  height: 40px;
  padding: 22px;
  color: var(--color-primary);
  background-color: var(--color-primary-light-400-alpha-700);
  border-radius: 12px;
  flex: 0 0 auto;
}
.headerText {
  display: flex;
  flex-flow: column nowrap;
  margin-top: -8px;
}
.headerTitle {
  font-size: 28px;
  font-weight: normal;
  color: var(--color-font);
  line-height: 1.2;
}
.headerDesc {
  font-size: 12px;
  color: var(--color-font-desc);
  opacity: 0.7;
  margin-top: 20px;
}

.toc {
  flex: 0 0 auto;
  padding: 10px 15px;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: var(--color-list-header-border-bottom);
}
.tocList {
  display: flex;
  flex-flow: row nowrap;
  gap: 2px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.tocListItem {
  display: inline-block;
}
.tocH2 {
  line-height: 1;
  white-space: nowrap;
  font-size: 13px;
  color: var(--color-font);
  padding: 4px 10px;
  margin: 0;
  transition: @transition-fast;
  transition-property: background-color, color, border-color;
  border-bottom: 2px solid transparent;

  &:not(.active) {
    cursor: pointer;
  }
  &.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }
}
// .tocH3 {
//   font-size: 13px;
//   opacity: .8;
// }

// .tocList {
//   .tocList {
//     // padding-left: 15px;
//   }
// }
// .tocSubListItem {
//   padding-top: 10px;
// }

.setting {
  flex: 1 1 auto;
  padding: 10px 15px 15px;
  font-size: 14px;
  box-sizing: border-box;
  overflow-y: auto;
  height: 100%;
  position: relative;
  width: 100%;
}

.section {
  padding-bottom: 20px;

  :global {
    dt {
      border-left: 5px solid var(--color-primary-alpha-700);
      padding: 3px 7px;
      margin: 10px 0 5px;

      + dd h3 {
        margin-top: 0;
      }
    }

    dd {
      margin: 0;
      padding: 0;
      display: block;
    }
    h3 {
      font-size: 12px;
      margin: 15px 0 10px;
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

.scrollTopBtn {
  position: fixed !important;
  right: 24px !important;
  bottom: 80px !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  background-color: #42b883 !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  box-shadow: 0 4px 16px rgba(66, 184, 131, 0.4) !important;
  z-index: 99999 !important;
  transition: background-color 0.2s ease !important;

  &:hover {
    background-color: #36a070 !important;
  }

  svg {
    width: 24px;
    height: 24px;
  }
}
</style>
