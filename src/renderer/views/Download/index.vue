<template>
  <div :class="$style.download">
    <div class="page-head" :class="$style.pageHead">
      <div>
        <h1>{{ $t('download__title') }}</h1>
        <p>{{ $t('download__subtitle') }}</p>
      </div>
      <base-btn outline @click="goDownloadSetting">{{ $t('setting__download') }}</base-btn>
    </div>
    <div :class="$style.summary">
      <div :class="$style.summaryCopy">
        <strong>{{ finishedCount }} {{ $t('download__finished') }}</strong>
        <p>{{ appSetting['download.savePath'] }}</p>
      </div>
      <div :class="$style.summaryActions">
        <base-btn outline :disabled="!listAll.length" @click="pauseAll">{{ $t('list__pause') }}</base-btn>
        <base-btn outline :disabled="!listAll.length" @click="clearAll">{{ $t('lists__remove') }}</base-btn>
      </div>
    </div>
    <div :class="$style.header">
      <div class="seg">
        <button
          v-for="item in tabs"
          :key="item.id"
          type="button"
          :class="{ active: activeTab == item.id }"
          @click="activeTab = item.id"
        >{{ item.label }}</button>
      </div>
    </div>
    <div :class="$style.content">
      <div v-show="false" class="thead" :class="$style.thead">
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
            :class="[{ selected: rightClickSelectedIndex == index }, { active: selectedList.includes(item) }]"
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
              <material-music-cover :src="item.metadata?.musicInfo?.meta?.picUrl" :name="getName(item)" />
              <span class="select name" :aria-label="getName(item)">{{ getName(item) }}</span>
            </div>
            <div class="list-item-cell" style="flex: 0 0 20%;">{{ item.progress }}%<span v-if="item.status == downloadStatus.RUN && item.speed"> - {{ item.speed }}/s</span></div>
            <div class="list-item-cell" style="flex: 0 0 22%;" :aria-label="item.statusText">{{ item.statusText }}</div>
            <div class="list-item-cell" style="flex: 0 0 10%;">{{ getTypeName(item.metadata.quality) }}</div>
            <div class="list-item-cell list-item-actions" style="flex: 0 0 13%; padding-left: 0; padding-right: 0;">
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
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <use xlink:href="#icon-line-download" />
        </svg>
        <h2>{{ $t('download__empty') }}</h2>
        <p>{{ $t('download__empty_hint') }}</p>
        <base-btn outline @click="goSearch">{{ $t('lists__empty_search') }}</base-btn>
      </div>
      <base-menu v-model="isShowItemMenu" :menus="menus" :xy="menuLocation" item-name="name" @menu-click="handleMenuClick" />
      <!-- <base-menu :menus="listItemMenu" :location="listMenu.menuLocation" item-name="name" :is-show="listMenu.isShowItemMenu" @menu-click="handleListItemMenuClick" /> -->
    </div>
    <common-list-add-modal v-model:show="isShowListAdd" :music-info="selectedAddMusicInfo" teleport="#view" />
    <common-list-add-multiple-modal v-model:show="isShowListAddMultiple" :music-list="selectedList" teleport="#view" @confirm="removeAllSelect" />
  </div>
</template>

<script>
// import { checkPath, openDirInExplorer, openUrl } from '@common/utils/electron'

import { computed, ref } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import useListInfo from './useListInfo'
import useList from './useList'
import useTab from './useTab'
import useMenu from './useMenu'
import usePlay from './usePlay'
import useTaskActions from './useTaskActions'
import useMusicAdd from './useMusicAdd'
import { downloadStatus } from '@renderer/store/download/state'
import { pauseDownloadTasks, removeDownloadTasks } from '@renderer/store/download/action'
import { appSetting } from '@renderer/store/setting'
import { formatMusicName } from '@renderer/utils'

export default {
  name: 'Download',
  setup() {
    const listRef = ref()
    const router = useRouter()
    const goSearch = () => {
      void router.push({ path: '/search' })
    }
    const goDownloadSetting = () => {
      void router.push({ path: '/setting', query: { name: 'SettingDownload' } })
    }
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

    const finishedCount = computed(() => listAll.value.filter(i => i.status == downloadStatus.COMPLETED).length)
    const pauseAll = () => {
      if (!listAll.value.length) return
      void pauseDownloadTasks([...listAll.value])
    }
    const clearAll = () => {
      if (!listAll.value.length) return
      void removeDownloadTasks(listAll.value.map(m => m.id))
    }

    const getName = (downloadInfo) => {
      return formatMusicName(appSetting['download.fileName'], downloadInfo.metadata.musicInfo.name, downloadInfo.metadata.musicInfo.singer)
    }
    const getTypeName = (quality) => {
      return quality == 'flac24bit' ? 'FLAC Hires' : quality?.toUpperCase()
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
      appSetting,
      finishedCount,
      listAll,
      pauseAll,
      clearAll,
      goSearch,
      goDownloadSetting,
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
  padding: 29px 32px 0;
  box-sizing: border-box;
}
.pageHead {
  flex: none;
}
.summary {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 21px 23px;
  border-radius: 12px;
  background: var(--color-well);
}
.summaryCopy {
  min-width: 0;
  strong {
    font-size: 13px;
    font-weight: 650;
  }
  p {
    margin: 3px 0 0;
    font-size: 11px;
    color: var(--color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.summaryActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.header {
  flex: none;
  margin-bottom: 12px;
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
  flex: 1;
  min-height: 160px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 24px;
  text-align: center;

  svg {
    width: 38px;
    height: 38px;
    color: var(--color-secondary);
    fill: none;
    stroke: currentColor;
    margin-bottom: 4px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 650;
    line-height: 1.4;
  }
  p {
    margin: 0;
    max-width: 360px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-secondary);
  }
  button {
    margin-top: 6px;
  }
}

</style>

