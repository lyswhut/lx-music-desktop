<template>
  <div :class="[$style.localMusic, 'with-cover']">
    <div :class="$style.pageHeader">
      <div :class="$style.pageIcon">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" space="preserve">
          <use xlink:href="#icon-folder" />
        </svg>
      </div>
      <div :class="$style.pageInfo">
        <span :class="$style.pageTitle">{{ $t('local_music') }}</span>
        <div :class="$style.header">
          <button :class="$style.addBtn" :aria-label="$t('lists__add_local_dir')" @click="handleAddLocalFile">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="70%" viewBox="0 0 247.498 247.498" space="preserve">
              <use xlink:href="#icon-musicFolder" />
            </svg>
            <span>{{ $t('lists__add_local_dir') }}</span>
          </button>
        </div>
      </div>
    </div>
    <div :class="$style.content">
      <div class="thead" :class="$style.thead">
        <table>
          <thead>
            <tr>
              <th class="num" style="width: 5%;">#</th>
              <th class="nobreak">{{ $t('music_name') }}</th>
              <th class="nobreak" style="width: 20%;">{{ $t('music_singer') }}</th>
              <th class="nobreak" style="width: 20%;">{{ $t('music_album') }}</th>
              <th class="nobreak" style="width: 9%;">{{ $t('music_time') }}</th>
              <th class="nobreak" style="width: 14%;">{{ $t('action') }}</th>
            </tr>
          </thead>
        </table>
      </div>
      <div v-if="list.length" ref="dom_listContent" :class="$style.content">
        <base-virtualized-list
          ref="listRef" v-slot="{ item, index }" :list="list" key-name="id" :item-height="listItemHeight"
          container-class="scroll" content-class="list"
        >
          <div
            class="list-item"
            :class="[{[$style.active]: playId == item.id }]"
            @click="handleListItemClick($event, index)"
          >
            <div class="list-item-cell no-select" :class="$style.num" style="flex: 0 0 5%;">
              <transition name="play-active">
                <div v-if="playId == item.id" :class="$style.playIcon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="50%" viewBox="0 0 512 512" space="preserve">
                    <use xlink:href="#icon-play-outline" />
                  </svg>
                </div>
                <div v-else class="num">{{ index + 1 }}</div>
              </transition>
            </div>
            <div class="list-item-cell auto name">
              <material-music-cover :music-info="item" @play="handleListBtnClick({ action: 'play', index })" />
              <span class="select name" :aria-label="item.name">{{ item.name }}</span>
            </div>
            <div class="list-item-cell" style="flex: 0 0 20%;"><span class="select" :aria-label="item.singer">{{ item.singer }}</span></div>
            <div class="list-item-cell" style="flex: 0 0 20%;"><span class="select" :aria-label="item.meta?.albumName || '--'">{{ item.meta?.albumName || '--' }}</span></div>
            <div class="list-item-cell" style="flex: 0 0 9%;"><span class="no-select">{{ item.interval || '--/--' }}</span></div>
            <div class="list-item-cell" style="flex: 0 0 14%; padding-left: 0; padding-right: 0;">
              <material-list-buttons
                :index="index" :download-btn="false" :file-btn="true" remove-btn="remove-btn"
                :list-add-btn="false" :play-btn="true" @btn-click="handleListBtnClick"
              />
            </div>
          </div>
        </base-virtualized-list>
      </div>
      <div v-else :class="$style.noItem">
        <p v-text="$t('no_item')" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from '@common/utils/vueTools'
import { localMusicList, removeLocalMusic } from '@renderer/store/localMusic/state'
import { addLocalFile } from '@renderer/store/localMusic/action'
import { playList } from '@renderer/core/player'
import { LIST_IDS } from '@common/constants'
import { isFullscreen } from '@renderer/store'
import { getFontSizeWithScreen } from '@renderer/utils'
import { appSetting } from '@renderer/store/setting'

export default {
  name: 'LocalMusic',
  setup() {
    const listRef = ref()
    const list = localMusicList
    const playId = ref('')
    const listItemHeight = computed(() => {
      return Math.ceil((isFullscreen.value ? getFontSizeWithScreen() : appSetting['common.fontSize']) * 3.5)
    })

    const handleListItemClick = (event, index) => {
      const item = list[index]
      if (!item) return
      playId.value = item.id
      playList(LIST_IDS.LOCAL, index)
    }

    const handleAddLocalFile = () => {
      void addLocalFile()
    }

    const handleListBtnClick = ({ action, index }) => {
      const item = list[index]
      if (!item) return
      switch (action) {
        case 'play':
          playId.value = item.id
          playList(LIST_IDS.LOCAL, index)
          break
        case 'remove':
          removeLocalMusic(index)
          break
      }
    }

    return {
      listRef,
      list,
      playId,
      listItemHeight,
      handleAddLocalFile,
      handleListItemClick,
      handleListBtnClick,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.localMusic {
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;

  :global(.list-item) {
    &.active {
      color: var(--color-button-font);
    }
  }
}
.pageHeader {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 12px;
  padding: 0 15px;
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
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  gap: 4px;
}
.pageTitle {
  font-size: 28px;
  font-weight: normal;
  color: var(--color-primary);
}
.header {
  flex: none;
  display: flex;
}
.addBtn {
  background: var(--color-primary-background);
  height: 24px;
  border: none;
  outline: none;
  border-radius: 6px;
  cursor: pointer;
  opacity: 1;
  transition: all @transition-fast;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0 7px;
  font-size: 11px;
  svg {
    vertical-align: bottom;
    flex-shrink: 0;
    width: 11px;
    height: 11px;
  }
  span {
    white-space: nowrap;
  }
  &:active {
    background: var(--color-primary-alpha-800);
  }
  &:hover {
    background: var(--color-primary-alpha-900);
  }
}
.num {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.playIcon {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  color: var(--color-button-font);
  opacity: .7;
}

.content {
  min-height: 0;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
  flex: auto;
}

.thead {
  margin-top: 12px;
}

.noItem {
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 24px;
    color: var(--color-font-label);
  }
}

</style>
