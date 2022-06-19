<template lang="pug">
div(:class="$style.list")
  //- transition
  div.thead(:class="$style.thead")
    table
      thead
        tr
          th.nobreak.center(:class="$style.th" style="width: 5%;") #
          th.nobreak(:class="$style.th") {{$t('music_name')}}
          th.nobreak(:class="$style.th" style="width: 22%;") {{$t('music_singer')}}
          th.nobreak(:class="$style.th" style="width: 22%;") {{$t('music_album')}}
          th.nobreak(:class="$style.th" style="width: 9%;") {{$t('music_time')}}
          th.nobreak(:class="$style.th" style="width: 15%;") {{$t('action')}}
  div(v-show="list.length" :class="$style.content" ref="dom_listContent")
    base-virtualized-list(:list="list" key-name="songmid" ref="listRef" #default="{ item, index }" :item-height="listItemHeight"
      @scroll="saveListPosition" containerClass="scroll" contentClass="list" @contextmenu.capture="handleListRightClick")
      div.list-item(@click="handleListItemClick($event, index)"
        :class="[{ [$style.active]: playerInfo.isPlayList && playerInfo.playIndex === index }, { selected: selectedIndex == index || rightClickSelectedIndex == index }, { active: selectedList.includes(item) }, { [$style.disabled]: !assertApiSupport(item.source) }]"
        @contextmenu="handleListItemRightClick($event, index)")
        div.list-item-cell.nobreak.center(style="flex: 0 0 5%; padding-left: 3px; padding-right: 3px;" :class="$style.noSelect" @click.stop) {{index + 1}}
        div.list-item-cell.auto(:aria-label="item.name + (isShowSource ? ` - ${item.source}` : '')")
          span.select {{item.name}}
          span(:class="[$style.labelSource, $style.noSelect]" v-if="isShowSource") {{item.source}}
        div.list-item-cell(style="flex: 0 0 22%;" :aria-label="item.singer")
          span.select {{item.singer}}
        div.list-item-cell(style="flex: 0 0 22%;" :aria-label="item.albumName")
          span.select {{item.albumName}}
        div.list-item-cell(style="flex: 0 0 9%;")
          span(:class="[$style.time, $style.noSelect]") {{item.interval || '--/--'}}
        div.list-item-cell(style="flex: 0 0 15%; padding-left: 0; padding-right: 0;")
          material-list-buttons(:index="index" @btn-click="handleListBtnClick" :download-btn="assertApiSupport(item.source)")
  div(:class="$style.noItem" v-show="!list.length")
    p(v-text="$t('no_item')")
  //- material-flow-btn(:show="isShowEditBtn && assertApiSupport(source)" :remove-btn="false" @btn-click="handleFlowBtnClick")
  common-download-modal(v-model:show="isShowDownload" :musicInfo="selectedDownloadMusicInfo" teleport="#view")
  common-download-multiple-modal(v-model:show="isShowDownloadMultiple" :list="selectedList" @confirm="removeAllSelect" teleport="#view")
  common-list-add-modal(v-model:show="isShowListAdd" :is-move="isMove" :from-list-id="listId" :musicInfo="selectedAddMusicInfo" :exclude-list-id="excludeListIds" teleport="#view")
  common-list-add-multiple-modal(v-model:show="isShowListAddMultiple" :from-list-id="listId" :is-move="isMoveMultiple" :musicList="selectedList" @confirm="removeAllSelect" :exclude-list-id="excludeListIds" teleport="#view")
  search-list(:list="list" @action="handleMusicSearchAction" :visible="isShowSearchBar")
  music-sort-modal(v-model:show="isShowMusicSortModal" :music-info="selectedSortMusicInfo" :selected-num="selectedNum" @confirm="sortMusic")
  base-menu(:menus="menus" :location="menuLocation" item-name="name" :isShow="isShowItemMenu" @menu-click="handleMenuClick")
</template>

<script>
import { clipboardWriteText, assertApiSupport } from '@renderer/utils'
import { useCssModule } from '@renderer/utils/vueTools'
import SearchList from '../SearchList'
import MusicSortModal from '../MusicSortModal'
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
export default {
  name: 'MusicList',
  props: {
    listId: {
      type: String,
      required: true,
    },
  },
  emits: ['show-menu'],
  components: {
    SearchList,
    MusicSortModal,
  },
  setup(props, { emit }) {
    const styles = useCssModule()

    const {
      rightClickSelectedIndex,
      selectedIndex,
      dom_listContent,
      listRef,
      list,
      playerInfo,
      setSelectedIndex,
      isShowSource,
      setting,
      excludeListIds,
    } = useListInfo({ props })

    const {
      selectedList,
      listItemHeight,
      handleSelectData,
      removeAllSelect,
    } = useList({ list, setting })

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
      handleSearch,
      handleOpenMusicDetail,
      handleCopyName,
      handleRemoveMusic,
    } = useMusicActions({ props, list, setting, removeAllSelect, selectedList })

    const {
      menus,
      menuLocation,
      isShowItemMenu,
      showMenu,
      menuClick,
    } = useMenu({
      listRef,
      assertApiSupport,
      emit,

      handleShowDownloadModal,
      handlePlayMusic,
      handlePlayMusicLater,
      handleSearch,
      handleShowMusicAddModal,
      handleShowMusicMoveModal,
      handleShowSortModal,
      handleOpenMusicDetail,
      handleCopyName,
      handleRemoveMusic,
    })

    const {
      isShowSearchBar,
      searchList,
      handleMusicSearchAction,
    } = useSearch({
      setSelectedIndex,
      handlePlayMusic,
      listRef,
    })

    const { saveListPosition, restoreScroll } = useListScroll({ props, listRef, list, setting })

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
      classList.add(styles.copying)
      window.requestAnimationFrame(() => {
        let str = window.getSelection().toString()
        classList.remove(styles.copying)
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
      searchList,
      handleMusicSearchAction,

      list,
      playerInfo,

      saveListPosition,
      restoreScroll,
      isShowSource,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.list {
  overflow: hidden;
  height: 100%;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
}
.content {
  min-height: 0;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
  flex: auto;
  &.copying {
    .no-select {
      display: none;
    }
  }
}

.thead {
  flex: none;
}
.th:first-child {
  color: @color-theme_2-font-label;
  // padding-left: 10px;
}

:global(.list) {
  flex: auto;
  :global(.list-item) {
    &.active {
      color: @color-btn;
    }
  }
  :global(.list-item-cell) {
    font-size: 12px !important;

    &:first-child {
      // padding-left: 10px;
      font-size: 11px !important;
      color: @color-theme_2-font-label !important;
    }
  }
}

.labelSource {
  color: @color-theme;
  padding: 5px;
  font-size: .8em;
  line-height: 1;
  opacity: .75;
  display: inline-block;
}

.disabled {
  opacity: .5;
}

.no-item {
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 24px;
    color: @color-theme_2-font-label;
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .th:first-child {
      color: ~'@{color-@{value}-theme_2-font-label}' !important;
    }
    :global(.list) {
      :global(.list-item) {
        &.active {
          color: ~'@{color-@{value}-btn}';
        }
      }
    }
    .labelSource {
      color: ~'@{color-@{value}-theme}';
    }
    .no-item {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})

</style>
