<template>
  <div :class="$style.download">
    <div :class="$style.pageHeader">
      <div :class="$style.pageIcon">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 425.2 425.2" width="34" height="34" space="preserve">
          <use xlink:href="#icon-download-2" />
        </svg>
      </div>
      <div :class="$style.pageMain">
        <h1 :class="$style.pageTitle">{{ $t('download') }}</h1>
        <button type="button" :class="$style.actionBtn" @click="handleChangeSavePath">
          {{ $t('setting__download_path_change_btn') }}
        </button>
      </div>
    </div>
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
          ref="listRef" v-slot="{ item, index }" :list="list" key-name="id" :item-height="listItemHeight"
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
    <common-list-add-modal v-model:show="isShowListAdd" :music-info="selectedAddMusicInfo" teleport="#view" />
    <common-list-add-multiple-modal v-model:show="isShowListAddMultiple" :music-list="selectedList" teleport="#view" @confirm="removeAllSelect" />
    <common-back-to-top />
  </div>
</template>

<script>
// import { checkPath, openDirInExplorer, openUrl } from '@common/utils/electron'

import { showSelectDialog } from '@renderer/utils/ipc'
import { ref } from '@common/utils/vueTools'
import useListInfo from './useListInfo'
import useList from './useList'
import useTab from './useTab'
import useMenu from './useMenu'
import usePlay from './usePlay'
import useTaskActions from './useTaskActions'
import useMusicAdd from './useMusicAdd'
import { downloadStatus } from '@renderer/store/download/state'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { useI18n } from '@renderer/plugins/i18n'
import { formatMusicName } from '@renderer/utils'

export default {
  name: 'Download',
  setup() {
    const listRef = ref()
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
    } = useList({ listRef, list, listAll })

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
      isShowListAdd,
      isShowListAddMultiple,
      selectedAddMusicInfo,
      handleShowMusicAddModal,
    } = useMusicAdd({ selectedList, list })

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
      handleShowMusicAddModal,
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
      return formatMusicName(appSetting['download.fileName'], downloadInfo.metadata.musicInfo.name, downloadInfo.metadata.musicInfo.singer)
    }
    const getTypeName = (quality) => {
      return quality == 'flac24bit' ? 'FLAC Hires' : quality?.toUpperCase()
    }
    const t = useI18n()
    // 与设置页“下载路径-更改”按钮一致：弹出目录选择框并更新下载路径
    const handleChangeSavePath = () => {
      void showSelectDialog({
        title: t('setting__download_select_save_path'),
        defaultPath: appSetting['download.savePath'],
        properties: ['openDirectory'],
      }).then(result => {
        if (result.canceled) return
        updateSetting({ 'download.savePath': result.filePaths[0] })
      })
    }
    return {
      listRef,
      list,
      downloadStatus,
      rightClickSelectedIndex,
      dom_listContent,
      tabs,
      activeTab,
      selectedList,
      listItemHeight,
      playTaskId,

      isShowListAdd,
      isShowListAddMultiple,
      selectedAddMusicInfo,

      removeAllSelect,

      menus,
      menuLocation,
      isShowItemMenu,

      handleListItemClick,
      handleListItemRightClick,
      handleMenuClick,
      handleListBtnClick,

      getName,
      getTypeName,
      handleChangeSavePath,
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
.pageMain {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
}
.pageTitle {
  margin: 0;
  font-size: 24px;
  font-weight: normal;
  color: var(--color-font);
  line-height: 1.3;
  .mixin-ellipsis-1();
}
.actionBtn {
  flex: none;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  padding: 3px 8px;
  border: none;
  border-radius: @form-radius;
  background-color: var(--color-button-background);
  color: var(--color-button-font);
  font-size: 12px;
  cursor: pointer;
  transition: background-color @transition-fast;

  &:hover {
    background-color: var(--color-button-background-hover);
  }
  &:active {
    background-color: var(--color-button-background-active);
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

