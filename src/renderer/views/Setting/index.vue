<template>
  <div :class="$style.container">
    <div :class="$style.pageHeader">
      <div :class="$style.pageIcon">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 493.23 436.47" width="34" height="30" space="preserve">
          <use xlink:href="#icon-setting" />
        </svg>
      </div>
      <div :class="$style.pageInfo">
        <h1 :class="$style.pageTitle">{{ $t('setting') }}</h1>
        <p :class="$style.pageDesc">{{ $t('setting__desc') }}</p>
      </div>
    </div>
    <div ref="dom_tab_ref" :class="$style.tabBar">
      <ul :class="$style.tabList" role="toolbar">
        <li v-for="h2 in tocList" :key="h2.id" :class="$style.tabListItem" role="presentation">
          <h2
            :data-tab="h2.id"
            :class="[$style.tab, {[$style.active]: activeId == h2.id }]"
            role="tab" :aria-selected="activeId == h2.id"
            :aria-label="h2.title" ignore-tip @click="scrollToSection(h2.id)"
          >
            {{ h2.title }}
          </h2>
        </li>
      </ul>
    </div>
    <div :class="$style.main">
    <div ref="dom_content_ref" class="scroll" :class="$style.setting" @scroll="handleScroll">
      <dl>
        <div v-for="h2 in tocList" :key="h2.id" :class="$style.section" :data-section="h2.id">
          <component :is="h2.id" />
        </div>
      </dl>
    </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from '@common/utils/vueTools'
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
    const dom_tab_ref = ref(null)

    const tocList = computed(() => {
      return [
        { id: 'SettingBasic', title: t('setting__tab_basic') },
        { id: 'SettingPlay', title: t('setting__tab_play') },
        { id: 'SettingPlayDetail', title: t('setting__tab_play_detail') },
        { id: 'SettingDesktopLyric', title: t('setting__tab_desktop_lyric') },
        { id: 'SettingSearch', title: t('setting__tab_search') },
        { id: 'SettingList', title: t('setting__tab_list') },
        { id: 'SettingDownload', title: t('setting__tab_download') },
        { id: 'SettingHotKey', title: t('setting__tab_hot_key') },
        { id: 'SettingSync', title: t('setting__sync') },
        { id: 'SettingOpenAPI', title: t('setting__open_api') },
        { id: 'SettingNetwork', title: t('setting__tab_network') },
        { id: 'SettingOdc', title: t('setting__tab_odc') },
        { id: 'SettingBackup', title: t('setting__backup') },
        { id: 'SettingOther', title: t('setting__other') },
        { id: 'SettingUpdate', title: t('setting__tab_update') },
        { id: 'SettingAbout', title: t('setting__tab_about') },
      ]
    })

    const activeId = ref(route.query.name && tocList.value.some(item => item.id == route.query.name)
      ? route.query.name
      : tocList.value[0].id)

    let observer = null
    const visibleMap = new Map()

    const getSection = id => dom_content_ref.value?.querySelector(`[data-section="${id}"]`)

    const setActive = id => {
      if (activeId.value != id) activeId.value = id
    }

    // 标签自动滚动到可见位置
    const ensureTabVisible = id => {
      const bar = dom_tab_ref.value
      const el = bar?.querySelector(`[data-tab="${id}"]`)
      if (!bar || !el) return
      const left = el.offsetLeft
      const right = left + el.offsetWidth
      if (left < bar.scrollLeft + 4) {
        bar.scrollTo({ left: Math.max(0, left - 4), behavior: 'smooth' })
      } else if (right > bar.scrollLeft + bar.clientWidth - 4) {
        bar.scrollTo({ left: right - bar.clientWidth + 4, behavior: 'smooth' })
      }
    }

    watch(activeId, id => { ensureTabVisible(id) })

    // 点击标签 -> 平滑滚动到对应分区
    const scrollToSection = (id, smooth = true) => {
      const content = dom_content_ref.value
      const section = getSection(id)
      if (!content || !section) return
      activeId.value = id
      const top = section.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop
      content.scrollTo({ top: Math.max(0, top - 6), behavior: smooth ? 'smooth' : 'auto' })
    }

    // 处理顶部/底部边界，保证首尾标签能正确激活
    const handleScroll = () => {
      const content = dom_content_ref.value
      if (!content) return
      if (content.scrollTop + content.clientHeight >= content.scrollHeight - 4) {
        setActive(tocList.value[tocList.value.length - 1].id)
      } else if (content.scrollTop <= 0) {
        setActive(tocList.value[0].id)
      }
    }

    onMounted(() => {
      const content = dom_content_ref.value
      if (!content) return
      // 观察分区是否进入内容区上部的判定带（25%~35%）
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          visibleMap.set(entry.target.dataset.section, entry.isIntersecting)
        }
        for (const item of tocList.value) {
          if (visibleMap.get(item.id)) {
            setActive(item.id)
            break
          }
        }
      }, { root: content, rootMargin: '-25% 0px -65% 0px', threshold: 0 })

      tocList.value.forEach(item => {
        const section = getSection(item.id)
        if (section) {
          observer.observe(section)
          visibleMap.set(item.id, false)
        }
      })

      // 根据路由 query 定位初始分区
      if (route.query.name && route.query.name != tocList.value[0].id) {
        void nextTick(() => { scrollToSection(route.query.name, false) })
      }
    })

    onBeforeUnmount(() => {
      observer?.disconnect()
      observer = null
    })

    return {
      tocList,
      activeId,
      dom_content_ref,
      dom_tab_ref,
      scrollToSection,
      handleScroll,
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

.container {
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}

.pageHeader {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: 30px 15px 14px;
}
.pageIcon {
  flex: none;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background-color: var(--color-primary-light-300-alpha-700);
  color: var(--color-primary);
  margin-right: 16px;
}
.pageInfo {
  display: flex;
  flex-flow: column nowrap;
}
.pageTitle {
  margin: 0;
  font-size: 24px;
  font-weight: normal;
  color: var(--color-font);
  line-height: 1.3;
}
.pageDesc {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--color-font-label);
}

.tabBar {
  flex: none;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: var(--color-list-header-border-bottom);
}
.tabList {
  display: flex;
  flex-flow: row nowrap;
  margin: 0;
  padding: 0 6px;
}
.tabListItem {
  flex: none;
  list-style: none;
}
.tab {
  margin: 0 0 -1px;
  padding: 8px 9px;
  font-size: 13px;
  font-weight: normal;
  line-height: 1.4;
  white-space: nowrap;
  color: var(--color-font);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: @transition-fast;
  transition-property: color, border-color;

  &:hover {
    color: var(--color-primary);
  }
  &.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    cursor: default;
  }
}

.main {
  flex: auto;
  min-height: 0;
  display: flex;
  flex-flow: row nowrap;
}

.setting {
  padding: 15px;
  font-size: 14px;
  box-sizing: border-box;
  overflow-y: auto;
  // 显式禁用横向滚动：本页仅纵向滚动，
  // 避免 overflow-y:auto 时 visible 被规范强制计算为 auto 而出现横向滚动条
  overflow-x: hidden;
  height: 100%;
  position: relative;
  width: 100%;

  :global {
    [data-section] + [data-section] {
      margin-top: 15px;
    }

    [data-section='SettingBasic'] {
      display: flex;
      flex-flow: row wrap;
      gap: 15px;

      dt {
        flex: 0 0 100%;
        margin: 0;
      }

      dd {
        margin: 0;
        flex: 1 1 auto;
        display: flex;
        flex-flow: column nowrap;

        > div {
          flex: 1 1 auto;
          display: flex;
          flex-flow: column nowrap;
        }
      }

      [data-line-break] {
        flex: 0 0 100%;
        height: 0;
        margin: 0;
        padding: 0;
      }

      [data-line-break] ~ dd {
        flex: 1 1 0;
        min-width: 0;
      }
    }

    [data-section='SettingPlay'] {
      display: flex;
      flex-flow: row wrap;
      gap: 15px;

      dt {
        flex: 0 0 100%;
        margin: 0;
      }

      // 三个卡片等宽排在同一行
      dd {
        margin: 0;
        flex: 1 1 0;
        min-width: 0;

        // 纵向 flex 链，让内部卡片撑满 dd 高度（同行等高）
        display: flex;
        flex-flow: column nowrap;

        > div {
          flex: 1 1 auto;
          display: flex;
          flex-flow: column nowrap;

          > div {
            flex: 1 1 auto;
          }
        }
      }

      // 播放设置卡片独占一行，音质/音频输出卡片换到第二行
      dt + dd {
        flex: 1 1 100%;
      }
    }

    // 其余分区：卡片化（标题条 + 内容区），与“基本/播放”保持一致
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']) {
      dt {
        margin: 0 0 15px;
      }

      dd {
        margin: 0;
        padding: 12px 15px;
        border-radius: 4px;
        background-color: var(--color-primary-light-300-alpha-800);

        > div {
          padding: 0;
        }

        h3 {
          margin: -12px -15px 12px;
          padding: 8px 15px;
          border-radius: 4px 4px 0 0;
          background-color: var(--color-primary-light-300-alpha-800);
          color: var(--color-primary-dark-300);
          font-size: 14px;
          line-height: 1.4;
        }
      }
    }

    // 后面的分区：与前 4 个分区保持一致的 flex 卡片流（dt 整行，卡片自动换行、同行等宽）
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey']) {
      display: flex;
      flex-flow: row wrap;
      gap: 15px;

      dt {
        flex: 0 0 100%;
        margin: 0;
      }

      dd {
        flex: 1 1 240px;
        min-width: 0;
        margin: 0;
      }
    }

    // 快捷键：卡片内部按全宽三列布局（item width:30%），保持纵向堆叠
    // 选择器附加 :not 权重链，确保 margin-top 覆盖通用 dd 规则的 margin: 0
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay'])[data-section='SettingHotKey'] dd + dd {
      margin-top: 30px;
    }

    // 这些分区：首个大卡独占整行（与播放、桌面歌词一致）
    // 选择器保留与通用 dd 规则同级的权重（:not 链），确保覆盖
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey']):is(
      [data-section='SettingSearch'],
      [data-section='SettingOpenAPI'], [data-section='SettingOdc'],
      [data-section='SettingUpdate'], [data-section='SettingAbout']
    ) dt + dd {
      flex: 1 1 100%;
    }

    // 下载：前 4 个卡片等宽排在同一行（dd 位于子元素第 2~5 位）
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingDownload'] dd:nth-child(-n+5) {
      flex: 1 1 0;
      min-width: 0;
    }

    // 任务数/自动换源卡片内容较少，宽度按内容自适应，剩余空间由前两卡分摊
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingDownload'] dd:nth-child(4),
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingDownload'] dd:nth-child(5) {
      flex: 0 1 auto;
    }

    // 下载：换行后的 4 个卡片（命名/嵌入/歌词/编码）等宽排在同一行
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingDownload'] [data-line-break] ~ dd {
      flex: 1 1 0;
      min-width: 0;
    }

    // 命名/编码卡片内容较少，宽度按内容自适应
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingDownload'] [data-line-break] ~ dd:nth-child(7),
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingDownload'] [data-line-break] ~ dd:nth-child(10) {
      flex: 0 1 auto;
    }

    // 嵌入/歌词下载卡片按内容宽度分摊剩余空间，让选项文字尽量单行显示
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingDownload'] [data-line-break] ~ dd:nth-child(8),
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingDownload'] [data-line-break] ~ dd:nth-child(9) {
      flex: 1 1 auto;
    }

    // 列表：两个卡片排在同一行——首卡占据剩余空间，次卡按内容自适应
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingList'] {
      dt + dd {
        flex: 1 1 0;
        min-width: 0;
      }

      dt + dd + dd {
        flex: 0 1 auto;
      }
    }

    // 备份与恢复：首卡加宽占主要空间，“所有数据”“其他备份格式”卡片按内容自适应收窄
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingBackup'] dt + dd {
      flex: 5 1 0;
      min-width: 0;
    }

    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingBackup'] dt + dd + dd,
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingBackup'] dt + dd + dd + dd {
      flex: 0 1 auto;
    }

    // 其他：第一行四张卡片（圆角阴影/托盘/资源缓存/其他缓存）等宽显示在同一行
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingOther'] dd:nth-of-type(1),
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingOther'] dd:nth-of-type(2),
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingOther'] dd:nth-of-type(3),
    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingOther'] dd:nth-of-type(4) {
      flex: 1 1 0;
      min-width: 0;
    }

    [data-section]:not([data-section='SettingBasic']):not([data-section='SettingPlay']):not([data-section='SettingPlayDetail']):not([data-section='SettingDesktopLyric']):not([data-section='SettingHotKey'])[data-section='SettingOther'] dd:nth-of-type(5) {
      flex: 0 1 auto;
    }

    [data-section='SettingDownload'] [data-line-break] {
      flex: 0 0 100%;
      height: 0;
      margin: 0;
      padding: 0;
    }

    // 其他：在「其他缓存管理」后换行，使「不喜欢的歌曲」「歌词编辑缓存」显示在第二行
    [data-section='SettingOther'] [data-line-break] {
      flex: 0 0 100%;
      height: 0;
      margin: 0;
      padding: 0;
    }

    [data-section='SettingPlayDetail'] {
      display: flex;
      flex-flow: row wrap;
      gap: 15px;

      dt {
        flex: 0 0 100%;
        margin: 0;
      }

      dd {
        flex: 1 1 0;
        min-width: 0;
        margin: 0;
      }
    }

    [data-section='SettingDesktopLyric'] {
      display: flex;
      flex-flow: row wrap;
      gap: 15px;

      dt {
        flex: 0 0 100%;
        margin: 0;
      }

      // 首个大卡独占一行，内容分两列显示
      dt + dd {
        flex: 1 1 100%;
        display: flex;
        flex-flow: row wrap;

        h3 {
          flex: 0 0 100%;
        }

        > .gap-top {
          flex: 0 0 50%;
        }
      }

      // 红框 4 个卡片平分一行
      dt + dd ~ dd {
        flex: 1 1 0;
        min-width: 0;
        margin: 0;
      }

      [data-line-break] {
        flex: 0 0 100%;
        height: 0;
        margin: 0;
        padding: 0;
      }

      // 换行之后的 4 个卡片同样平分一行
      [data-line-break] ~ dd {
        flex: 1 1 0;
        min-width: 0;
      }

      // 间距/字体/重置卡片内容较少，宽度按内容自适应，颜色卡片占据剩余空间
      [data-line-break] ~ dd:nth-of-type(6),
      [data-line-break] ~ dd:nth-of-type(8),
      [data-line-break] ~ dd:nth-of-type(9) {
        flex: 0 1 auto;
      }
    }

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
    h3 {
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

    // 卡片内选项竖排（供各 Setting 子组件以普通 class 使用）
    .lx-option-col {
      display: flex;
      flex-flow: column nowrap;
      align-items: flex-start;
      gap: 10px;

      .gap-left {
        margin-left: 0;
      }
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

