<template>
  <material-modal :show="show" teleport="#view" bg-close height="100%" @close="handleClose">
    <main :class="$style.main">
      <base-tab v-model="source" :class="$style.tab" :list="tabs" />
      <div class="scroll" :class="$style.list">
        <template v-if="list.length">
          <div v-for="item in list" :key="item.id" :class="$style.listItem">
            <!-- <div :class="$style.num">{{ index + 1 }}</div> -->
            <div :class="$style.textContent">
              <h3 :class="$style.text" :aria-label="`${item.name} - ${item.singer}`">{{ item.name }}</h3>
              <h3 v-if="item.meta.albumName" :class="[$style.text, $style.albumName]" :aria-label="item.meta.albumName">
                {{ item.singer }}
                <span v-if="item.meta.albumName"> / {{ item.meta.albumName }}</span>
              </h3>
            </div>
            <div :class="$style.label">{{ item.interval }}</div>
            <div :class="$style.btns">
              <button type="button" :class="$style.btn" @click="openDetail(item)">
                <svg-icon name="share" />
              </button>
              <button type="button" :class="$style.btn" @click="handlePlay(item)">
                <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="50%" viewBox="0 0 287.386 287.386" space="preserve">
                  <use xlink:href="#icon-testPlay" />
                </svg>
              </button>
            </div>
          </div>
        </template>
        <div v-else :class="$style.noItem">
          <p v-text="noItemLabel" />
        </div>
      </div>
      <div :class="$style.footer">
        <div :class="$style.info">
          <h2>
            <div :class="$style.nameLabel">
              <span :class="$style.name">{{ musicInfo.name }}</span>
              <span :class="$style.label">{{ musicInfo.source }} {{ musicInfo.interval }}</span>
            </div>
            <div :class="$style.singer">
              {{ musicInfo.singer }}
              <span v-if="musicInfo.meta.albumName"> / {{ musicInfo.meta.albumName }}</span>
            </div>
          </h2>
          <template v-if="toggleMusicInfo">
            <span style="flex: none;">→</span>
            <h2>
              <div :class="$style.nameLabel">
                <span :class="$style.name">{{ toggleMusicInfo.name }}</span>
                <span :class="$style.label">{{ toggleMusicInfo.source }} {{ musicInfo.interval }}</span>
              </div>
              <div :class="$style.singer">
                {{ toggleMusicInfo.singer }}
                <span v-if="toggleMusicInfo.meta.albumName"> / {{ toggleMusicInfo.meta.albumName }}</span>
              </div>
            </h2>
          </template>
        </div>
        <base-btn :disabled="!toggleMusicInfo || musicInfo.id == toggleMusicInfo.id" :class="$style.btn" @click="handleConfirm">{{ $t('music_toggle_confirm') }}</base-btn>
      </div>
    </main>
  </material-modal>
</template>

<script>
import { LIST_IDS } from '@common/constants'
import { openUrl } from '@common/utils/electron'
import { playNext } from '@renderer/core/player'
import { getSourceI18nPrefix } from '@renderer/store'
import { addTempPlayList } from '@renderer/store/player/action'
import { playMusicInfo } from '@renderer/store/player/state'
import { toNewMusicInfo, toOldMusicInfo } from '@renderer/utils'
import musicSdk from '@renderer/utils/musicSdk'
import { markRaw } from 'vue'

export default {
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    musicInfo: {
      type: Object,
      default() {
        return {}
      },
    },
  },
  emits: ['update:show', 'toggle'],
  data() {
    return {
      tabs: [],
      lists: {},
      source: '',
      isError: false,
      loading: false,
      searchKey: 0,
      toggleMusicInfo: null,
    }
  },
  computed: {
    list() {
      return this.lists[this.source] ?? []
    },
    noItemLabel() {
      return this.loading ? this.$t('list__loading') : this.isError ? this.$t('list__load_failed') : this.$t('no_item')
    },
  },
  watch: {
    show(n) {
      if (n) {
        this.isError = false
        this.toggleMusicInfo = null
        const musicInfo = this.musicInfo
        this.tabs = []
        this.lists = {}
        this.loading = true
        const searchKey = this.searchKey = Math.random()
        void musicSdk.searchMusic({
          name: musicInfo.name,
          singer: musicInfo.singer,
          source: '',
          albumName: musicInfo.meta.albumName,
          interval: musicInfo.interval ?? '',
        }).then((lists) => {
          if (this.searchKey != searchKey) return
          const prefix = getSourceI18nPrefix()
          this.tabs = lists.map(item => {
            return {
              id: item.source,
              label: window.i18n.t(prefix + item.source),
            }
          })
          if (lists.length) this.source = lists[0].source
          for (const s of lists) this.lists[s.source] = s.list.map(s => markRaw(toNewMusicInfo(s)))
        }).catch(() => {
          if (this.searchKey != searchKey) return
          this.isError = true
        }).finally(() => {
          if (this.searchKey != searchKey) return
          this.loading = false
        })
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit('update:show', false)
    },
    handleConfirm() {
      this.$emit('toggle', this.toggleMusicInfo)
    },
    openDetail(minfo) {
      const url = musicSdk[minfo.source]?.getMusicDetailPageUrl(toOldMusicInfo(minfo))
      if (!url) return
      void openUrl(url)
    },
    handlePlay(musicInfo) {
      this.toggleMusicInfo = musicInfo
      const isPlaying = !!playMusicInfo.musicInfo
      addTempPlayList([{ listId: LIST_IDS.PLAY_LATER, musicInfo, isTop: true }])
      if (isPlaying) void playNext()
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 10px 7px 0;
  width: 560px;
  max-width: 100%;
  box-sizing: border-box;
  // min-width: 280px;
  display: flex;
  flex-flow: column nowrap;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  height: 100%;
}
.tab {
  flex: none;
}

.list {
  flex: auto;
  min-height: 100px;
  min-width: 460px;
  // background-color: @color-search-form-background;
  font-size: 13px;
  transition-property: height;
  margin-top: 10px;
  padding: 0 7px;
  // position: relative;
  .listItem {
    position: relative;
    padding: 10px 5px;
    transition: background-color .2s ease;
    line-height: 1.4;
    // height: 100%;
    // overflow: hidden;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    border-radius: 4px;

    &:hover {
      background-color: var(--color-primary-background-hover);
    }
    // &:last-child {
    //   border-bottom-left-radius: 4px;
    //   border-bottom-right-radius: 4px;
    // }
  }

  .num {
    flex: none;
    font-size: 12px;
    width: 20px;
    text-align: center;
    color: var(--color-font-label);
  }
  .textContent {
    flex: auto;
    min-width: 0;
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;
    overflow: hidden;
  }
  .text {
    max-width: 100%;
    .mixin-ellipsis-1();
  }
  .albumName {
    font-size: 12px;
    opacity: 0.6;
    // .mixin-ellipsis-1();
  }
  .label {
    flex: none;
    font-size: 12px;
    opacity: 0.5;
    padding: 0 5px;
    display: flex;
    align-items: center;
    // transform: rotate(45deg);
    // background-color:
  }
  .btns {
    flex: none;
    font-size: 12px;
    padding: 0 5px;
    display: flex;
    align-items: center;
  }
  .btn {
    background-color: transparent;
    border: none;
    border-radius: @form-radius;
    margin-right: 5px;
    cursor: pointer;
    padding: 4px 7px;
    color: var(--color-button-font);
    outline: none;
    transition: background-color 0.2s ease;
    line-height: 0;
    &:last-child {
      margin-right: 0;
    }

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background-color: var(--color-primary-background-hover);
    }
    &:active {
      background-color: var(--color-primary-font-active);
    }
  }

  .noItem {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    height: 100%;

    p {
      font-size: 16px;
      color: var(--color-font-label);
    }
  }
}

.footer {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  padding: 10px 7px;
  .info {
    min-width: 0;
    display: flex;
    flex-flow: row nowrap;
    padding-right: 10px;
    gap: 10px;
    font-size: 12px;
    align-items: center;

    h2 {
      min-width: 0;
      color: var(--color-font);
      line-height: 1.5;
      word-break: break-all;
    }
    .nameLabel {
      display: flex;
      flex-flow: row nowrap;
    }
    .name {
      .mixin-ellipsis();
    }
    .label {
      flex: none;
      font-size: 12px;
      opacity: 0.8;
      padding: 0 5px;
      color: var(--color-primary);
      // display: flex;
      // align-items: center;
      // transform: rotate(45deg);
      // background-color:
    }
    .singer {
      // font-size: 0.9em;
      color: var(--color-font-label);
      .mixin-ellipsis();
    }
  }

  .btn {
    flex: none;
    // box-sizing: border-box;
    // margin-left: 15px;
    // margin-bottom: 15px;
    // height: 36px;
    // line-height: 36px;
    // padding: 0 10px !important;
    min-width: 70px;
    // .mixin-ellipsis-1();

    +.btn {
      margin-left: 10px;
    }
  }
}


</style>
