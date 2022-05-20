<template lang="pug">
div(:class="$style.songList")
  transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
    div(:class="$style.list")
      div.thead(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(:class="$style.th" :style="{ width: rowWidth.r1 }") #
              th.nobreak(:class="$style.th" :style="{ width: rowWidth.r2 }") {{$t('music_name')}}
              th.nobreak(:class="$style.th" :style="{ width: rowWidth.r3 }") {{$t('music_singer')}}
              th.nobreak(:class="$style.th" :style="{ width: rowWidth.r4 }") {{$t('music_album')}}
              th.nobreak(:class="$style.th" :style="{ width: rowWidth.r5 }") {{$t('music_time')}}
              th.nobreak(:class="$style.th" :style="{ width: rowWidth.r6 }") {{$t('action')}}
      div(:class="$style.content")
        div(v-show="list.length" :class="$style.content" ref="dom_listContent")
          base-virtualized-list(:list="list" key-name="songmid" ref="listRef" :item-height="listItemHeight"
            containerClass="scroll" contentClass="list" @contextmenu.capture="handleListRightClick")
            template(#default="{ item, index }")
              div.list-item(@click="handleListItemClick($event, index)" @contextmenu="handleListItemRightClick($event, index)"
                :class="[{ selected: rightClickSelectedIndex == index }, { active: selectedList.includes(item) }]")
                div.list-item-cell.nobreak.center(:style="{ width: rowWidth.r1 }" style="padding-left: 3px; padding-right: 3px;" :class="$style.noSelect" @click.stop) {{index + 1}}
                div.list-item-cell.auto(:style="{ width: rowWidth.r2 }" :aria-label="item.name + (item._types.flac32bit ? ` - ${$t('tag__lossless_24bit')}` : (item._types.ape || item._types.flac || item._types.wav) ? ` - ${$t('tag__lossless')}` : item._types['320k'] ? ` - ${$t('tag__high_quality')}` : '')")
                  span.select {{item.name}}
                  span.badge.badge-theme-success(:class="[$style.labelQuality, $style.noSelect]" v-if="item._types.flac32bit") {{$t('tag__lossless_24bit')}}
                  span.badge.badge-theme-success(:class="[$style.labelQuality, $style.noSelect]" v-else-if="item._types.ape || item._types.flac || item._types.wav") {{$t('tag__lossless')}}
                  span.badge.badge-theme-info(:class="[$style.labelQuality, $style.noSelect]" v-else-if="item._types['320k']") {{$t('tag__high_quality')}}
                div.list-item-cell(:style="{ width: rowWidth.r3 }" :aria-label="item.singer")
                  span.select {{item.singer}}
                div.list-item-cell(:style="{ width: rowWidth.r4 }" :aria-label="item.albumName")
                  span.select {{item.albumName}}
                div.list-item-cell(:style="{ width: rowWidth.r5 }")
                  span(:class="[$style.time, $style.noSelect]") {{item.interval || '--/--'}}
                div.list-item-cell(:style="{ width: rowWidth.r6 }" style="padding-left: 0; padding-right: 0;")
                  material-list-buttons(:index="index" :class="$style.btns"
                      :remove-btn="false" @btn-click="handleListBtnClick"
                      :download-btn="assertApiSupport(item.source)")
            template(#footer)
              div(:class="$style.pagination")
                material-pagination(:count="total" :limit="limit" :page="page" @btn-click="$emit('togglePage', $event)")
        transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
          div(v-show="!list.length" :class="$style.noitem")
            p(v-html="noItem")
  //- material-flow-btn(:show="isShowEditBtn && assertApiSupport(source)" :remove-btn="false" @btn-click="handleFlowBtnClick")
  common-download-modal(v-model:show="isShowDownload" :musicInfo="selectedDownloadMusicInfo" teleport="#view")
  common-download-multiple-modal(v-model:show="isShowDownloadMultiple" :list="selectedList" @confirm="removeAllSelect" teleport="#view")
  common-list-add-modal(v-model:show="isShowListAdd" :musicInfo="selectedAddMusicInfo" teleport="#view")
  common-list-add-multiple-modal(v-model:show="isShowListAddMultiple" :musicList="selectedList" @confirm="removeAllSelect" teleport="#view")
  base-menu(:menus="menus" :location="menuLocation" item-name="name" :isShow="isShowItemMenu" @menu-click="handleMenuClick")
</template>

<script>
import { clipboardWriteText, assertApiSupport } from '@renderer/utils'
import { ref, useCssModule, useRefGetter } from '@renderer/utils/vueTools'
import useList from './useList'
import useMenu from './useMenu'
import usePlay from './usePlay'
import useMusicDownload from './useMusicDownload'
import useMusicAdd from './useMusicAdd'
import useMusicActions from './useMusicActions'
export default {
  name: 'MaterialOnlineList',
  props: {
    list: {
      type: Array,
      default() {
        return []
      },
    },
    page: {
      type: Number,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    rowWidth: {
      type: Object,
      default() {
        return {
          r1: '5%',
          r2: 'auto',
          r3: '22%',
          r4: '22%',
          r5: '8%',
          r6: '13%',
        }
      },
    },
    noItem: {
      type: String,
    },
  },
  emits: ['show-menu', 'play-list', 'togglePage'],
  setup(props, { emit }) {
    const rightClickSelectedIndex = ref(-1)
    const dom_listContent = ref(null)
    const listRef = ref(null)

    const styles = useCssModule()

    const setting = useRefGetter('setting')

    const {
      selectedList,
      listItemHeight,
      handleSelectData,
      removeAllSelect,
    } = useList({ props })

    const {
      handlePlayMusic,
      handlePlayMusicLater,
      doubleClickPlay,
    } = usePlay({ selectedList, props, removeAllSelect, setting, emit })

    const {
      isShowListAdd,
      isShowListAddMultiple,
      selectedAddMusicInfo,
      handleShowMusicAddModal,
    } = useMusicAdd({ selectedList, props })

    const {
      isShowDownload,
      isShowDownloadMultiple,
      selectedDownloadMusicInfo,
      handleShowDownloadModal,
    } = useMusicDownload({ selectedList, props })

    const {
      handleSearch,
      handleOpenMusicDetail,
    } = useMusicActions({ props })

    const {
      menus,
      menuLocation,
      isShowItemMenu,
      showMenu,
      hideMenu,
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
      handleOpenMusicDetail,
    })

    const handleListItemClick = (event, index) => {
      if (rightClickSelectedIndex.value > -1) return
      handleSelectData(index)
      doubleClickPlay(index)
    }
    const handleListItemRightClick = (event, index) => {
      rightClickSelectedIndex.value = index
      showMenu(event, props.list[index], index)
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
      dom_listContent,
      listRef,

      menus,
      isShowItemMenu,
      menuLocation,
      handleMenuClick,
      hideMenu,

      handleListRightClick,
      assertApiSupport,

      isShowListAdd,
      isShowListAddMultiple,
      selectedAddMusicInfo,

      isShowDownload,
      isShowDownloadMultiple,
      selectedDownloadMusicInfo,

      scrollToTop,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.song-list {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
}

.list {
  position: relative;
  font-size: 14px;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
}
.thead {
  flex: none;
}
.th:first-child {
  color: @color-theme_2-font-label;
  // padding-left: 10px;
}
.content {
  flex: auto;
  min-height: 0;
  position: relative;
  height: 100%;

  &.copying {
    .no-select {
      display: none;
    }
  }
}
:global(.list) {
  height: 100%;
  overflow-y: auto;
  :global(.list-item-cell) {
    font-size: 12px !important;
    :global(.badge) {
      margin-left: 3px;
    }
    &:first-child {
      // padding-left: 10px;
      font-size: 11px !important;
      color: @color-theme_2-font-label !important;
    }
  }
  :global(.badge) {
    opacity: .85;
  }
}
.pagination {
  text-align: center;
  padding: 15px 0;
  // left: 50%;
  // transform: translateX(-50%);
}
.noitem {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
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
      color: ~'@{color-@{value}-theme_2-font-label}';
    }
    :global(.list) {
      :global(.list-item-cell) {
        &:first-child {
          color: ~'@{color-@{value}-theme_2-font-label}' !important;
        }
      }
    }
    .noitem {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})
</style>
