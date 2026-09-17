<template>
  <div :class="$style.list">
    <div v-show="list.length" class="thead">
      <table>
        <thead>
          <tr v-if="actionButtonsVisible">
            <th class="num" style="width: 5%;">#</th>
            <th class="nobreak">{{ $t('music_name') }}</th>
            <th class="nobreak" style="width: 22%;">{{ $t('music_singer') }}</th>
            <th class="nobreak" style="width: 22%;">{{ $t('music_album') }}</th>
            <th class="nobreak" style="width: 9%;">{{ $t('music_time') }}</th>
            <th class="nobreak" style="width: 16%;">{{ $t('action') }}</th>
          </tr>
          <tr v-else>
            <th class="num" style="width: 5%;">#</th>
            <th class="nobreak">{{ $t('music_name') }}</th>
            <th class="nobreak" style="width: 25%;">{{ $t('music_singer') }}</th>
            <th class="nobreak" style="width: 28%;">{{ $t('music_album') }}</th>
            <th class="nobreak" style="width: 10%;">{{ $t('music_time') }}</th>
          </tr>
        </thead>
      </table>
    </div>
    <div v-show="list.length" ref="dom_listContent" :class="$style.content">
      <base-virtualized-list
        v-if="actionButtonsVisible" ref="listRef" v-slot="{ item, index }" :list="list" key-name="id"
        :item-height="listItemHeight" container-class="scroll" content-class="list"
        @scroll="saveListPosition" @contextmenu.capture="handleListRightClick"
      >
        <div
          class="list-item" :class="[{ [$style.active]: playerInfo.isPlayList && playerInfo.playIndex === index }, { selected: selectedIndex == index || rightClickSelectedIndex == index }, { active: selectedList.includes(item) }, { disabled: !assertApiSupport(item.source) }]"
          @click="handleListItemClick($event, index)" @contextmenu="handleListItemRightClick($event, index)"
        >
          <div class="list-item-cell no-select" :class="$style.num" style="flex: 0 0 5%;">
            <transition name="play-active">
              <div v-if="playerInfo.isPlayList && playerInfo.playIndex === index" :class="[$style.playIcon, { [$style.paused]: !isPlay }]">
                <span :class="$style.playingBars" aria-hidden="true"><i /><i /><i /></span>
              </div>
              <div v-else class="num">{{ String(index + 1).padStart(2, '0') }}</div>
            </transition>
          </div>
          <div class="list-item-cell auto name" :aria-label="item.name">
            <material-music-cover :src="item.meta?.picUrl" :name="item.name" />
            <div class="list-item-song-meta">
              <span class="select name">{{ item.name }}</span>
              <div v-if="qualityTag(item) || isShowSource" class="list-item-song-sub">
                <span v-if="qualityTag(item)" class="no-select badge" :class="qualityTag(item) == 'tag__high_quality' ? 'badge-theme-secondary' : 'badge-theme-primary'">{{ $t(qualityTag(item)) }}</span>
                <span v-if="isShowSource" class="no-select list-item-source">{{ item.source }}</span>
              </div>
            </div>
          </div>
          <div class="list-item-cell" style="flex: 0 0 22%;"><span class="select" :aria-label="item.singer">{{ item.singer }}</span></div>
          <div class="list-item-cell" style="flex: 0 0 22%;"><span class="select" :aria-label="item.meta.albumName">{{ item.meta.albumName }}</span></div>
          <div class="list-item-cell" style="flex: 0 0 9%;"><span class="no-select">{{ item.interval || '--/--' }}</span></div>
          <div class="list-item-cell list-item-actions" style="flex: 0 0 16%; padding-left: 0; padding-right: 0;">
            <material-list-buttons :index="index" :download-btn="assertApiSupport(item.source) && item.source != 'local'" @btn-click="handleListBtnClick" />
          </div>
        </div>
      </base-virtualized-list>
      <base-virtualized-list
        v-else ref="listRef" v-slot="{ item, index }" :list="list" key-name="id"
        :item-height="listItemHeight" container-class="scroll" content-class="list"
        @scroll="saveListPosition" @contextmenu.capture="handleListRightClick"
      >
        <div
          class="list-item"
          :class="[{ [$style.active]: playerInfo.isPlayList && playerInfo.playIndex === index }, { selected: selectedIndex == index || rightClickSelectedIndex == index }, { active: selectedList.includes(item) }, { disabled: !assertApiSupport(item.source) }]"
          @click="handleListItemClick($event, index)" @contextmenu="handleListItemRightClick($event, index)"
        >
          <div class="list-item-cell no-select" :class="$style.num" style="flex: 0 0 5%;">
            <transition name="play-active">
              <div v-if="playerInfo.isPlayList && playerInfo.playIndex === index" :class="[$style.playIcon, { [$style.paused]: !isPlay }]">
                <span :class="$style.playingBars" aria-hidden="true"><i /><i /><i /></span>
              </div>
              <div v-else class="num">{{ String(index + 1).padStart(2, '0') }}</div>
            </transition>
          </div>
          <div class="list-item-cell auto name">
            <material-music-cover :src="item.meta?.picUrl" :name="item.name" />
            <div class="list-item-song-meta">
              <span class="select name" :aria-label="item.name">{{ item.name }}</span>
              <div v-if="qualityTag(item) || isShowSource" class="list-item-song-sub">
                <span v-if="qualityTag(item)" class="no-select badge" :class="qualityTag(item) == 'tag__high_quality' ? 'badge-theme-secondary' : 'badge-theme-primary'">{{ $t(qualityTag(item)) }}</span>
                <span v-if="isShowSource" class="no-select list-item-source">{{ item.source }}</span>
              </div>
            </div>
          </div>
          <div class="list-item-cell" style="flex: 0 0 25%;"><span class="select" :aria-label="item.singer">{{ item.singer }}</span></div>
          <div class="list-item-cell" style="flex: 0 0 28%;"><span class="select" :aria-label="item.meta.albumName">{{ item.meta.albumName }}</span></div>
          <div class="list-item-cell" style="flex: 0 0 10%;"><span class="no-select">{{ item.interval || '--/--' }}</span></div>
        </div>
      </base-virtualized-list>
    </div>
    <div v-show="!hideEmpty && !list.length" :class="$style.noItem">
      <svg v-if="isLoveList" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 444.87 391.18" space="preserve">
        <use xlink:href="#icon-love" />
      </svg>
      <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 425.2 425.2" space="preserve">
        <use xlink:href="#icon-album" />
      </svg>
      <h2>{{ isLoveList ? $t('lists__empty_love') : $t('lists__empty_list') }}</h2>
      <p>{{ $t('lists__empty_desc') }}</p>
      <base-btn v-if="isLoveList" primary @click="goSearch">{{ $t('lists__empty_search') }}</base-btn>
    </div>
    <common-list-add-modal
      v-model:show="isShowListAdd" :is-move="isMove" :from-list-id="listId"
      :music-info="selectedAddMusicInfo" :exclude-list-id="excludeListIds" teleport="#view"
    />
    <common-list-add-multiple-modal
      v-model:show="isShowListAddMultiple" :from-list-id="listId"
      :is-move="isMoveMultiple" :music-list="selectedList" :exclude-list-id="excludeListIds" teleport="#view" @confirm="removeAllSelect"
    />
    <common-download-modal v-model:show="isShowDownload" :music-info="selectedDownloadMusicInfo" teleport="#view" :list-id="listId" />
    <common-download-multiple-modal v-model:show="isShowDownloadMultiple" :list="selectedList" teleport="#view" :list-id="listId" @confirm="removeAllSelect" />
    <search-list :list="list" :visible="isShowSearchBar" @action="handleMusicSearchAction" />
    <music-sort-modal v-model:show="isShowMusicSortModal" :music-info="selectedSortMusicInfo" :selected-num="selectedNum" @confirm="sortMusic" />
    <music-toggle-modal v-model:show="isShowMusicToggleModal" :music-info="selectedToggleMusicInfo" @toggle="toggleSource" />
    <base-menu v-model="isShowItemMenu" :menus="menus" :xy="menuLocation" item-name="name" @menu-click="handleMenuClick" />
  </div>
</template>

<script>
import { clipboardWriteText } from '@common/utils/electron'
import { assertApiSupport } from '@renderer/store/utils'
import SearchList from './components/SearchList.vue'
import MusicSortModal from './components/MusicSortModal.vue'
import MusicToggleModal from './components/MusicToggleModal.vue'
import useListInfo from './useListInfo'
import useList from './useList'
import useMenu from './useMenu'
import usePlay from './usePlay'
import useMusicDownload from './useMusicDownload'
import useMusicAdd from './useMusicAdd'
import useSort from './useSort'
import useMusicActions from './useMusicActions'
import useSearch from './useSearch'
import useListScroll from './useListScroll'
import useMusicToggle from './useMusicToggle'
import { computed } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { LIST_IDS } from '@common/constants'
import { appSetting } from '@renderer/store/setting'
import { isPlay } from '@renderer/store/player/state'
export default {
  name: 'MusicList',
  components: {
    SearchList,
    MusicSortModal,
    MusicToggleModal,
  },
  props: {
    listId: {
      type: String,
      required: true,
    },
    hideEmpty: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['show-menu'],
  setup(props, { emit }) {
    const actionButtonsVisible = appSetting['list.actionButtonsVisible']
    const router = useRouter()
    const isLoveList = computed(() => props.listId == LIST_IDS.LOVE)
    const goSearch = () => {
      void router.push({ path: '/search' })
    }

    let scrollIndex = null
    let isAnimation = false
    const handleRestoreScroll = (_scrollIndex, _isAnimation) => {
      scrollIndex = _scrollIndex
      isAnimation = _isAnimation
      if (isAnimation) void restoreScroll(scrollIndex, isAnimation)
      // console.log('handleRestoreScroll', scrollIndex, isAnimation)
    }
    const onLoadedList = () => {
      // console.log('restoreScroll', scrollIndex, isAnimation)
      void restoreScroll(scrollIndex, isAnimation)
    }

    const {
      rightClickSelectedIndex,
      selectedIndex,
      dom_listContent,
      listRef,
      list,
      playerInfo,
      setSelectedIndex,
      isShowSource,
      excludeListIds,
    } = useListInfo({ props, onLoadedList })

    const {
      selectedList,
      listItemHeight,
      handleSelectData,
      removeAllSelect,
    } = useList({ listRef, list })

    const {
      handlePlayMusic,
      handlePlayMusicLater,
      doubleClickPlay,
    } = usePlay({ props, selectedList, list, removeAllSelect })

    const {
      isShowListAdd,
      isMove,
      isShowListAddMultiple,
      isMoveMultiple,
      selectedAddMusicInfo,
      handleShowMusicAddModal,
      handleShowMusicMoveModal,
    } = useMusicAdd({ selectedList, list })

    const {
      isShowDownload,
      isShowDownloadMultiple,
      selectedDownloadMusicInfo,
      handleShowDownloadModal,
    } = useMusicDownload({ selectedList, list })

    const {
      isShowMusicSortModal,
      selectedNum,
      selectedSortMusicInfo,
      handleShowSortModal,
      sortMusic,
    } = useSort({ props, list, selectedList, removeAllSelect })

    const {
      handleShowMusicToggleModal,
      isShowMusicToggleModal,
      selectedToggleMusicInfo,
      toggleSource,
    } = useMusicToggle(props, list)

    const {
      handleSearch,
      handleOpenMusicDetail,
      handleCopyName,
      handleDislikeMusic,
      handleRemoveMusic,
    } = useMusicActions({ props, list, removeAllSelect, selectedList })

    const {
      menus,
      menuLocation,
      isShowItemMenu,
      showMenu,
      menuClick,
    } = useMenu({
      assertApiSupport,
      emit,

      handleShowDownloadModal,
      handlePlayMusic,
      handlePlayMusicLater,
      handleShowMusicToggleModal,
      handleSearch,
      handleShowMusicAddModal,
      handleShowMusicMoveModal,
      handleShowSortModal,
      handleOpenMusicDetail,
      handleCopyName,
      handleDislikeMusic,
      handleRemoveMusic,
    })

    const {
      isShowSearchBar,
      searchList,
      handleShowSearchBar,
      handleMusicSearchAction,
    } = useSearch({
      setSelectedIndex,
      handlePlayMusic,
      listRef,
    })

    const { saveListPosition, restoreScroll } = useListScroll({ props, listRef, list, handleRestoreScroll })


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
    const handleListRightClick = (event) => {
      if (!event.target.classList.contains('select')) return
      event.stopImmediatePropagation()
      let classList = dom_listContent.value.classList
      classList.add('copying')
      window.requestAnimationFrame(() => {
        let str = window.getSelection().toString()
        classList.remove('copying')
        str = str.split(/\n\n/).map(s => s.replace(/\n/g, '  ')).join('\n').trim()
        if (!str.length) return
        clipboardWriteText(str)
      })
    }
    const handleListBtnClick = ({ action, index }) => {
      switch (action) {
        case 'download':
          handleShowDownloadModal(index, true)
          break
        case 'play':
          handlePlayMusic(index, true)
          break
        case 'search':
          handleSearch(index)
          break
        case 'listAdd':
          handleShowMusicAddModal(index, true)
          break
      }
    }
    const scrollToTop = () => {
      listRef.value.scrollTo(0, true)
    }
    const qualityTag = (item) => {
      const q = item?.meta?._qualitys
      if (!q) return ''
      if (q.flac24bit) return 'tag__lossless_24bit'
      if (q.ape || q.flac || q.wav) return 'tag__lossless'
      if (q['320k']) return 'tag__high_quality'
      return ''
    }

    return {
      listItemHeight,
      handleListItemClick,
      selectedList,
      handleListItemRightClick,
      removeAllSelect,
      handleListBtnClick,
      rightClickSelectedIndex,
      selectedIndex,
      dom_listContent,
      listRef,
      excludeListIds,

      menus,
      isShowItemMenu,
      menuLocation,
      handleMenuClick,

      handleListRightClick,
      assertApiSupport,

      isShowListAdd,
      isMove,
      isShowListAddMultiple,
      isMoveMultiple,
      selectedAddMusicInfo,

      isShowMusicSortModal,
      selectedNum,
      selectedSortMusicInfo,
      sortMusic,

      isShowDownload,
      isShowDownloadMultiple,
      selectedDownloadMusicInfo,

      scrollToTop,

      isShowSearchBar,
      showSearchBar: handleShowSearchBar,
      searchList,
      handleMusicSearchAction,

      list,
      playerInfo,

      saveListPosition,
      isShowSource,
      handleRestoreScroll,

      actionButtonsVisible,
      isLoveList,
      goSearch,
      isPlay,
      qualityTag,

      isShowMusicToggleModal,
      selectedToggleMusicInfo,
      toggleSource,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.list {
  position: relative;
  overflow: hidden;
  min-height: 0;
  height: 100%;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;

}
.active {
  :global(.name) {
    color: var(--color-primary);
    font-weight: 600;
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
  color: var(--color-primary);
}
.playingBars {
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  height: 13px;
  color: var(--color-primary);
  i {
    display: block;
    width: 2px;
    background: currentColor;
    animation: playing-bars 0.8s alternate infinite;
    &:nth-child(1) {
      height: 5px;
      animation-delay: -0.3s;
    }
    &:nth-child(2) {
      height: 12px;
      animation-delay: -0.6s;
    }
    &:nth-child(3) {
      height: 8px;
      animation-delay: -0.1s;
    }
  }
}
.paused {
  .playingBars i {
    animation-play-state: paused;
  }
}
@keyframes playing-bars {
  to {
    height: 3px;
  }
}
.content {
  min-height: 0;
  display: flex;
  flex-flow: column nowrap;
  flex: auto;
}

.noItem {
  position: absolute;
  inset: 0;
  z-index: 2;
  min-height: 160px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 24px;
  text-align: center;

  svg {
    width: 34px;
    height: 34px;
    color: var(--color-secondary, var(--color-font-label));
    fill: currentColor;
    margin-bottom: 4px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 650;
    color: var(--color-font);
    line-height: 1.4;
  }
  p {
    margin: 0;
    max-width: 360px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-secondary, var(--color-font-label));
  }
  button {
    margin-top: 6px;
  }
}

</style>
