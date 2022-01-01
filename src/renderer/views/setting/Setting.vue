<template>
<div :class="$style.main">
  <!-- <div class="scroll" :class="$style.toc">
    <ul :class="$style.tocList">
      <li :class="$style.tocListItem" v-for="h2 in toc.list" :key="h2.id">
        <h2 :class="[$style.tocH2, toc.activeId == h2.id ? $style.active : null]" :tips="h2.title">
          <a :href="'#' + h2.id" @click.stop="toc.activeId = h2.id">{{h2.title}}</a>
        </h2>
        <ul :class="$style.tocList" v-if="h2.children.length">
          <li :class="$style.tocSubListItem" v-for="h3 in h2.children" :key="h3.id">
            <h3 :class="[$style.tocH3, toc.activeId == h3.id ? $style.active : null]" :tips="h3.title">
              <a :href="'#' + h3.id" @click.stop="toc.activeId = h3.id">{{h3.title}}</a>
            </h3>
          </li>
        </ul>
      </li>
    </ul>
  </div> -->
  <div class="scroll" :class="$style.setting" ref="dom_setting">
    <dl ref="dom_setting_list">
      <SettingBasic />
      <SettingPlay />
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
      <SettingAbout />
    </dl>
  </div>
</div>
</template>

<script>
import { useRefGetter, watch, useCommit, toRaw } from '@renderer/utils/vueTools'
import { currentStting } from './setting'

import SettingBasic from './components/SettingBasic'
import SettingPlay from './components/SettingPlay'
import SettingDesktopLyric from './components/SettingDesktopLyric'
import SettingSearch from './components/SettingSearch'
import SettingList from './components/SettingList'
import SettingDownload from './components/SettingDownload'
import SettingSync from './components/SettingSync'
import SettingHotKey from './components/SettingHotKey'
import SettingNetwork from './components/SettingNetwork'
import SettingOdc from './components/SettingOdc'
import SettingBackup from './components/SettingBackup'
import SettingOther from './components/SettingOther'
import SettingUpdate from './components/SettingUpdate'
import SettingAbout from './components/SettingAbout'

export default {
  name: 'Setting',
  components: {
    SettingBasic,
    SettingPlay,
    SettingDesktopLyric,
    SettingSearch,
    SettingList,
    SettingDownload,
    SettingSync,
    SettingHotKey,
    SettingNetwork,
    SettingOdc,
    SettingBackup,
    SettingOther,
    SettingUpdate,
    SettingAbout,
  },
  setup() {
    const setting = useRefGetter('setting')

    const setSetting = useCommit('setSetting')
    currentStting.value = JSON.parse(JSON.stringify(toRaw(setting.value)))
    watch(currentStting, newSetting => {
      const newSettingStr = JSON.stringify(newSetting)
      if (newSettingStr === JSON.stringify(setting.value)) return
      // console.log(newSetting)
      setSetting(JSON.parse(newSettingStr))
    }, {
      deep: true,
    })

    watch(() => setting.value.isAgreePact, val => {
      currentStting.value.isAgreePact = val
    })
    watch(() => setting.value.player.mediaDeviceId, val => {
      currentStting.value.player.mediaDeviceId = val
    })
    watch(() => setting.value.player.isMute, val => {
      currentStting.value.player.isMute = val
    })
    watch(() => setting.value.apiSource, val => {
      currentStting.value.apiSource = val
    })
    watch(() => setting.value.desktopLyric.enable, val => {
      currentStting.value.desktopLyric.enable = val
    })
    watch(() => setting.value.desktopLyric.isLock, val => {
      currentStting.value.desktopLyric.isLock = val
    })
    watch(() => setting.value.player.togglePlayMethod, val => {
      currentStting.value.player.togglePlayMethod = val
    })
  },
  data() {
    return {
      toc: {
        list: [],
        activeId: '',
      },
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
  // border-top: 1px solid rgba(0, 0, 0, 0.06);
}

// .toc {
//   flex: 0 0 15%;
//   overflow-y: scroll;
//   padding: 10px;
//   a {
//     text-decoration: none;
//     display: block;
//     line-height: 1.5;
//     .mixin-ellipsis-1;
//   }
// }
// .tocH2 {
//   font-size: 14px;
//   a {
//     color: @color-theme;
//   }
//   &.active {
//     a {
//       color: @color-theme;
//     }
//   }
// }
// .tocH3 {
//   font-size: 13px;
//   opacity: .8;
// }

// .tocList {
//   .tocList {
//     padding-left: 15px;
//   }
// }
// .tocListItem {
//   +.tocListItem {
//     padding-top: 10px;
//   }
// }
// .tocSubListItem {
//   padding-top: 10px;
// }

.setting {
  padding: 0 15px 30px 15px;
  font-size: 14px;
  box-sizing: border-box;
  overflow-y: auto;
  height: 100%;
  position: relative;

  :global {
    dt {
      border-left: 5px solid @color-theme;
      padding: 3px 7px;
      margin: 30px 0 15px;

      + dd h3 {
        margin-top: 0;
      }
    }

    dd {
      margin-left: 15px;
      // font-size: 13px;
      > div {
        padding: 0 15px;
      }

    }
    h3 {
      font-size: 12px;
      margin: 25px 0 15px;
    }
    p {
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
      color: @color-theme;
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

.btn-content {
  display: inline-block;
  transition: @transition-theme;
  transition-property: opacity, transform;
  opacity: 1;
  transform: scale(1);

  &.hide {
    opacity: 0;
    transform: scale(0);
  }
}



// :global(dt):target, :global(h3):target {
//   animation: highlight 1s ease;
// }

// @keyframes highlight {
//   from { background: yellow; }
//   to { background: transparent; }
// }

each(@themes, {
  :global(#root.@{value}) {
    .tocH2 {
      a {
        color: ~'@{color-@{value}-theme}';
      }
    }
    .tbody {
      tr {
        &.active {
          color: ~'@{color-@{value}-theme}';
        }
      }
    }
    .setting {
      dt {
        border-left-color: ~'@{color-@{value}-theme}';
      }

      :global {
        .help-btn {
          color: ~'@{color-@{value}-theme}';
        }
      }
    }
  }
})
</style>
