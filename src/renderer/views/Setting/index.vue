<template>
  <div :class="$style.main">
    <div class="scroll scroll-ghost" :class="$style.toc">
      <ul :class="$style.tocList" role="toolbar">
        <li v-for="h2 in tocList" :key="h2.id" :class="$style.tocListItem" role="presentation">
          <h2
            :class="[$style.tocH2, {[$style.active]: avtiveComponentName == h2.id }]"
            role="tab" :aria-selected="avtiveComponentName == h2.id"
            :aria-label="h2.title" ignore-tip @click="toggleTab(h2.id)"
          >
            <span :class="$style.settingIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" :class="{ [$style.fillIcon]: h2.fill }">
                <use :xlink:href="h2.icon" />
              </svg>
            </span>
            {{ h2.title }}
          </h2>
          <!-- <ul v-if="h2.children.length" :class="$style.tocList">
            <li v-for="h3 in h2.children" :key="h3.id" :class="$style.tocSubListItem">
              <h3 :class="[$style.tocH3, toc.activeId == h3.id ? $style.active : null]" :aria-label="h3.title">
                <a :href="'#' + h3.id" @click.stop="toc.activeId = h3.id">{{ h3.title }}</a>
              </h3>
            </li>
          </ul> -->
        </li>
      </ul>
    </div>
    <div ref="dom_content_ref" class="scroll scroll-ghost" :class="$style.setting">
      <dl>
        <component :is="avtiveComponentName" />
        <!-- <SettingBasic />
        <SettingPlay />
        <SettingPlayDetail />
        <SettingDesktopLyric />
        <SettingSearch />
        <SettingList />
        <SettingDownload />
        <SettingSync />
        <SettingHotKey />
        <SettingNetwork />
        <SettingOdc />
        <SettingBackup />
        <SettingOther />
        <SettingUpdate />
        <SettingAbout /> -->
      </dl>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick } from '@common/utils/vueTools'
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
        { id: 'SettingBasic', title: t('setting__basic'), icon: '#icon-line-gear' },
        { id: 'SettingPlay', title: t('setting__play'), icon: '#icon-line-play-fill', fill: true },
        { id: 'SettingPlayDetail', title: t('setting__play_detail'), icon: '#icon-line-lyric' },
        { id: 'SettingDesktopLyric', title: t('setting__desktop_lyric'), icon: '#icon-line-screen' },
        { id: 'SettingSearch', title: t('setting__search'), icon: '#icon-line-search' },
        { id: 'SettingList', title: t('setting__list'), icon: '#icon-line-list' },
        { id: 'SettingDownload', title: t('setting__download'), icon: '#icon-line-download' },
        { id: 'SettingHotKey', title: t('setting__hot_key'), icon: '#icon-line-keyboard' },
        { id: 'SettingSync', title: t('setting__sync'), icon: '#icon-line-sync' },
        { id: 'SettingOpenAPI', title: t('setting__open_api'), icon: '#icon-line-code' },
        { id: 'SettingNetwork', title: t('setting__network'), icon: '#icon-line-network' },
        { id: 'SettingOdc', title: t('setting__odc'), icon: '#icon-line-spark' },
        { id: 'SettingBackup', title: t('setting__backup'), icon: '#icon-line-folder' },
        { id: 'SettingOther', title: t('setting__other'), icon: '#icon-line-sliders' },
        { id: 'SettingUpdate', title: t('setting__update'), icon: '#icon-line-sync' },
        { id: 'SettingAbout', title: t('setting__about'), icon: '#icon-line-info' },
      ]
    })

    const avtiveComponentName = ref(route.query.name && tocList.value.some(t => t.id == route.query.name)
      ? route.query.name
      : tocList.value[0].id)

    const toggleTab = id => {
      avtiveComponentName.value = id
      void nextTick(() => {
        dom_content_ref.value?.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      })
    }

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
  flex-flow: row nowrap;
  height: 100%;
  min-height: 0;
  background: var(--color-main-background);
}

.toc {
  flex: 0 0 165px;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 20px 12px;
  border-right: 1px solid var(--color-line);
  background: var(--color-well);
}
.tocH2 {
  line-height: 1.3;
  .mixin-ellipsis-1();
  font-size: 11px;
  font-weight: 400;
  color: var(--color-font);
  padding: 8px 10px;
  min-height: 0;
  border-radius: 7px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: @transition-fast;
  transition-property: background-color, color, box-shadow;

  &:not(.active) {
    cursor: pointer;
    &:hover {
      background-color: var(--color-accent-soft);
    }
    .settingIcon {
      background: transparent;
      box-shadow: none;
    }
  }
  &.active {
    color: var(--color-font);
    background-color: var(--color-panel);
    box-shadow: 0 1px 5px color-mix(in srgb, var(--color-font) 3%, transparent);
    .settingIcon {
      background: var(--color-primary);
      color: #fff;
    }
  }
}
.settingIcon {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: grid;
  place-items: center;
  background: transparent;
  box-shadow: none;
  color: var(--color-secondary);
  svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
  }
  .fillIcon {
    fill: currentColor;
    stroke: none;
  }
}

@media (max-width: 960px) {
  .toc {
    flex-basis: 134px;
    padding: 18px 8px;
  }
  .tocH2 {
    padding: 8px 6px;
    gap: 6px;
    font-size: 10px;
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
  padding: 27px 30px 48px;
  font-size: 13px;
  box-sizing: border-box;
  height: 100%;
  min-width: 0;
  position: relative;
  width: 100%;
  background: var(--color-main-background);

  :global {
      dt {
      border-left: 0;
      padding: 0 0 8px;
      margin: 0;
      font-size: 25px;
      font-weight: 720;
      letter-spacing: -0.7px;

      + dd h3 {
        margin-top: 0;
      }
    }

    dd {
      > .gap-top {
        max-width: 920px;
        margin: 0 0 16px;
      }
      > div,
      > .gap-top {
        padding: 0;
        margin: 0 0 16px;
        max-width: 920px;
        border: 1px solid var(--color-line);
        border-radius: 10px;
        overflow: hidden;
        background: var(--color-panel);
      }
      > .gap-top {
        min-height: 53px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 13px 16px;
        box-sizing: border-box;
        font-size: 12px;
      }
      > .gap-left,
      > .p {
        max-width: 920px;
        min-height: 53px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 13px 16px;
        box-sizing: border-box;
        font-size: 12px;
      }
      > div {
        > .gap-top,
        > .gap-left,
        > .p {
          min-height: 53px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 13px 16px;
          box-sizing: border-box;
          margin-top: 0;
          border-bottom: 1px solid var(--color-line);
          &:last-child {
            border-bottom: 0;
          }
          + .gap-top {
            margin-top: 0;
          }
        }
        > *:not(.gap-top):not(.gap-left):not(.p) {
          padding: 12px 16px;
        }
        > .p:not(:has(label)):has(.btn) {
          justify-content: space-between;
        }
        &:has(> .gap-left) {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          min-height: 53px;
          padding: 13px 16px;
          gap: 8px 16px;
          box-sizing: border-box;
          overflow: visible;
        }
        > .gap-left {
          min-height: auto;
          padding: 0;
          border-bottom: 0;
          display: inline-flex;
          justify-content: flex-start;
          width: auto;
          margin-left: 0;
          + .gap-left {
            margin-left: 0;
          }
        }
      }
      > .gap-top,
      > div > .gap-top {
        > :first-child:has(label) {
          flex: 1 1 auto;
          min-width: 0;
          max-width: 100%;
          display: block;
        }
        label {
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: row-reverse;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          > span {
            flex: 1 1 auto;
            min-width: 0;
            margin-left: 0;
            overflow-wrap: anywhere;
          }
        }
      }
    }
    h3 {
      font-size: 11px;
      font-weight: 620;
      margin: 22px 0 9px;
      color: var(--color-secondary);
    }
    .p {
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
      flex: none;
      margin: 0;
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

