<template>
  <div :class="$style.download">
    <div :class="$style.header">
      <base-tab v-model="activeTab" :class="$style.tab" :list="tabs" />
    </div>
    <div :class="$style.content">
      <div class="thead" :class="$style.thead">
        <table>
          <thead>
            <tr>
              <th class="num" style="width: 5%;">#</th>
              <th class="nobreak">{{ $t('music_name') }}</th>
              <th class="nobreak" style="width: 20%;">{{ $t('download__progress') }}</th>
              <th class="nobreak" style="width: 22%;">{{ $t('download__status') }}</th>
              <th class="nobreak" style="width: 10%;">{{ $t('download__quality') }}</th>
              <th class="nobreak" style="width: 13%;">{{ $t('action') }}</th>
            </tr>
          </thead>
        </table>
      </div>
      <div v-if="list.length" ref="dom_listContent" :class="$style.content">
        <base-virtualized-list
          v-slot="{ item, index }" :list="list" key-name="id" :item-height="listItemHeight"
          container-class="scroll" content-class="list"
        >
          <div
            class="list-item"
            :class="[{[$style.active]: playTaskId == item.id }, { selected: rightClickSelectedIndex == index }, { active: selectedList.includes(item) }]"
            @click="handleListItemClick($event, index)" @contextmenu="handleListItemRightClick($event, index)"
          >
            <div class="list-item-cell no-select" :class="$style.num" style="flex: 0 0 5%;">
              <transition name="play-active">
                <div v-if="playTaskId == item.id" :class="$style.playIcon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="50%" viewBox="0 0 512 512" space="preserve">
                    <use xlink:href="#icon-play-outline" />
                  </svg>
                </div>
                <div v-else class="num">{{ index + 1 }}</div>
              </transition>
            </div>
            <div class="list-item-cell auto name">
              <span class="select name" :aria-label="getName(item)">{{ getName(item) }}</span>
            </div>
            <div class="list-item-cell" style="flex: 0 0 20%;">{{ item.progress }}%<span v-if="item.status == downloadStatus.RUN && item.speed"> - {{ item.speed }}/s</span></div>
            <div class="list-item-cell" style="flex: 0 0 22%;" :aria-label="item.statusText">{{ item.statusText }}</div>
            <div class="list-item-cell" style="flex: 0 0 10%;">{{ getTypeName(item.metadata.quality) }}</div>
            <div class="list-item-cell" style="flex: 0 0 13%; padding-left: 0; padding-right: 0;">
              <material-list-buttons
                :index="index" :download-btn="false" :file-btn="item.status != downloadStatus.ERROR" remove-btn="remove-btn"
                :start-btn="!item.isComplate && item.status != downloadStatus.WAITING && (item.status != downloadStatus.RUN)"
                :pause-btn="!item.isComplate && (item.status == downloadStatus.RUN || item.status == downloadStatus.WAITING)"
                :list-add-btn="false" :play-btn="item.status == downloadStatus.COMPLETED"
                :search-btn="item.status == downloadStatus.ERROR" @btn-click="handleListBtnClick"
              />
            </div>
          </div>
        </base-virtualized-list>
      </div>
      <div v-else :class="$style.noItem">
        <p v-text="$t('no_item')" />
      </div>
      <base-menu v-model="isShowItemMenu" :menus="menus" :xy="menuLocation" item-name="name" @menu-click="handleMenuClick" />
      <!-- <base-menu :menus="listItemMenu" :location="listMenu.menuLocation" item-name="name" :is-show="listMenu.isShowItemMenu" @menu-click="handleListItemMenuClick" /> -->
    </div>
  </div>
</template>

<script>
// import { checkPath, openDirInExplorer, openUrl } from '@common/utils/electron'

import useListInfo from './useListInfo'
import useList from './useList'
import useTab from './useTab'
import useMenu from './useMenu'
import usePlay from './usePlay'
import useTaskActions from './useTaskActions'
import { downloadStatus } from '@renderer/store/download/state'
import { appSetting } from '@renderer/store/setting'

export default {
  name: 'Download',
  setup() {
    const { tabs, activeTab } = useTab()

    const {
      rightClickSelectedIndex,
      dom_listContent,
      listAll,
      list,
      playTaskId,
    } = useListInfo(activeTab)

    const {
      selectedList,
      listItemHeight,
      removeAllSelect,
      handleSelectData,
    } = useList({ list, listAll })

    const {
      handlePlayMusic,
      handlePlayMusicLater,
    } = usePlay({ selectedList, list, listAll, removeAllSelect })

    const {
      handleSearch,
      handleOpenMusicDetail,
      handleStartTask,
      handlePauseTask,
      handleRemoveTask,
      handleOpenFile,
    } = useTaskActions({ list, removeAllSelect, selectedList })

    const {
      menus,
      menuLocation,
      isShowItemMenu,
      showMenu,
      menuClick,
    } = useMenu({
      handleStartTask,
      handlePauseTask,
      handleRemoveTask,
      handleOpenFile,
      handlePlayMusic,
      handlePlayMusicLater,
      handleSearch,
      handleOpenMusicDetail,
    })

    let clickTime = 0
    let clickIndex = -1
    const doubleClickPlay = index => {
      if (
        window.performance.now() - clickTime > 400 ||
      clickIndex !== index
      ) {
        clickTime = window.performance.now()
        clickIndex = index
        return
      }
      const task = list.value[index]
      if (task.isComplate) {
        handlePlayMusic(list.value.indexOf(task), true)
      } else if (task.status === downloadStatus.RUN || task.status === downloadStatus.WAITING) {
        void handlePauseTask(index, true)
      } else {
        void handleStartTask(index, true)
      }
      clickTime = 0
      clickIndex = -1
    }

    const handleListItemClick = (event, index) => {
      if (rightClickSelectedIndex.value > -1) return
      handleSelectData(index)
      doubleClickPlay(index)
    }
    const handleListItemRightClick = (event, index) => {
      rightClickSelectedIndex.value = index
      showMenu(event, list.value[index], index)
    }
    const handleMenuClick = (action) => {
      let index = rightClickSelectedIndex.value
      rightClickSelectedIndex.value = -1
      menuClick(action, index)
    }

    const handleListBtnClick = ({ action, index }) => {
      switch (action) {
        case 'play':
          handlePlayMusic(index, true)
          break
        case 'start':
          void handleStartTask(index, true)
          break
        case 'pause':
          void handlePauseTask(index, true)
          break
        case 'remove':
          void handleRemoveTask(index, true)
          break
        case 'file':
          void handleOpenFile(index)
          break
        case 'search':
          handleSearch(index)
          break
      }
    }

    const getName = (downloadInfo) => {
      return appSetting['download.fileName'].replace('歌名', downloadInfo.metadata.musicInfo.name).replace('歌手', downloadInfo.metadata.musicInfo.singer)
    }
    const getTypeName = (quality) => {
      return quality == 'flac24bit' ? 'FLAC Hires' : quality?.toUpperCase()
    }
    return {
      list,
      downloadStatus,
      rightClickSelectedIndex,
      dom_listContent,
      tabs,
      activeTab,
      selectedList,
      listItemHeight,
      playTaskId,

      menus,
      menuLocation,
      isShowItemMenu,

      handleListItemClick,
      handleListItemRightClick,
      handleMenuClick,
      handleListBtnClick,

      getName,
      getTypeName,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.download {
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

