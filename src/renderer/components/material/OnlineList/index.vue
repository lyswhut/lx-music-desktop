<template>
  <div :class="$style.songList">
    <!-- <transition enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut"> -->
    <div :class="$style.list">
      <div class="thead">
        <table>
          <thead>
            <tr v-if="actionButtonsVisible">
              <th class="num" style="width: 5%;">#</th>
              <th v-if="isShowCover" class="nobreak" :style="{ width: (coverSize + 16) + 'px' }"></th>
              <th class="nobreak">{{ $t('music_name') }}</th>
              <th class="nobreak" style="width: 22%;">{{ $t('music_singer') }}</th>
              <th class="nobreak" style="width: 22%;">{{ $t('music_album') }}</th>
              <th class="nobreak" style="width: 9%;">{{ $t('music_time') }}</th>
              <th class="nobreak" style="width: 16%;">{{ $t('action') }}</th>
            </tr>
            <tr v-else>
              <th class="num" style="width: 5%;">#</th>
              <th v-if="isShowCover" class="nobreak" :style="{ width: (coverSize + 16) + 'px' }"></th>
              <th class="nobreak">{{ $t('music_name') }}</th>
              <th class="nobreak" style="width: 24%;">{{ $t('music_singer') }}</th>
              <th class="nobreak" style="width: 27%;">{{ $t('music_album') }}</th>
              <th class="nobreak" style="width: 10%;">{{ $t('music_time') }}</th>
            </tr>
          </thead>
        </table>
      </div>
      <div :class="$style.content">
        <div v-show="!noItem" ref="dom_listContent" :class="$style.content">
          <base-virtualized-list v-if="actionButtonsVisible" ref="listRef" :list="list" key-name="id" :item-height="listItemHeight" container-class="scroll" content-class="list" @scroll="handleScroll" @contextmenu.capture="handleListRightClick">
            <template #default="{ item, index }">
              <div
                class="list-item" :class="[{ selected: rightClickSelectedIndex == index }, { active: selectedList.includes(item) }]"
                @click="handleListItemClick($event, index)" @contextmenu="handleListItemRightClick($event, index)"
              >
                <div class="list-item-cell no-select num" style="flex: 0 0 5%;" @click.stop>{{ index + 1 }}</div>
                <div v-if="isShowCover" class="list-item-cell" :style="{ flex: `0 0 ${coverSize + 16}px`, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                  <div :class="$style.cover" :style="{ width: coverSize + 'px', height: coverSize + 'px' }">
                    <img
                      :src="getCoverUrl(item)"
                      :class="[$style.coverImg, { [$style.placeholder]: isUsingPlaceholder(item), [$style.coverLoaded]: isCoverLoaded(item.id) }]"
                      alt=""
                      @load="handleCoverLoad(item.id)"
                      @error="handleCoverError"
                    >
                  </div>
                </div>
                <div class="list-item-cell auto name" style="padding-left: 8px;">
                  <span class="select name" :aria-label="item.name">{{ item.name }}</span>
                  <span v-if="item.meta._qualitys.flac24bit" class="no-select badge badge-theme-primary">{{ $t('tag__lossless_24bit') }}</span>
                  <span v-else-if="item.meta._qualitys.ape || item.meta._qualitys.flac || item.meta._qualitys.wav" class="no-select badge badge-theme-primary">{{ $t('tag__lossless') }}</span>
                  <span v-else-if="item.meta._qualitys['320k']" class="no-select badge badge-theme-secondary">{{ $t('tag__high_quality') }}</span>
                  <span v-if="sourceTag" class="no-select badge badge-theme-tertiary">{{ item.source }}</span>
                </div>
                <div class="list-item-cell" style="flex: 0 0 22%;"><span class="select" :aria-label="item.singer">{{ item.singer }}</span></div>
                <div class="list-item-cell" style="flex: 0 0 22%;"><span class="select" :aria-label="item.meta.albumName">{{ item.meta.albumName }}</span></div>
                <div class="list-item-cell" style="flex: 0 0 9%;"><span class="no-select">{{ item.interval || '--/--' }}</span></div>
                <div class="list-item-cell" style="flex: 0 0 16%; padding-left: 0; padding-right: 0;">
                  <material-list-buttons :index="index" :remove-btn="false" :download-btn="assertApiSupport(item.source)" :play-btn="checkApiSource ? assertApiSupport(item.source) : true" @btn-click="handleListBtnClick" />
                </div>
              </div>
            </template>
            <template #footer>
              <div :class="$style.pagination">
                <material-pagination :count="total" :limit="limit" :page="page" @btn-click="$emit('togglePage', $event)" />
              </div>
            </template>
          </base-virtualized-list>
          <base-virtualized-list v-else ref="listRef" :list="list" key-name="id" :item-height="listItemHeight" container-class="scroll" content-class="list" @scroll="handleScroll" @contextmenu.capture="handleListRightClick">
            <template #default="{ item, index }">
              <div
                class="list-item" :class="[{ selected: rightClickSelectedIndex == index }, { active: selectedList.includes(item) }]"
                @click="handleListItemClick($event, index)" @contextmenu="handleListItemRightClick($event, index)"
              >
                <div class="list-item-cell no-select num" style="flex: 0 0 5%;" @click.stop>{{ index + 1 }}</div>
                <div v-if="isShowCover" class="list-item-cell" :style="{ flex: `0 0 ${coverSize + 16}px`, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                  <div :class="$style.cover" :style="{ width: coverSize + 'px', height: coverSize + 'px' }">
                    <img
                      :src="getCoverUrl(item)"
                      :class="[$style.coverImg, { [$style.placeholder]: isUsingPlaceholder(item), [$style.coverLoaded]: isCoverLoaded(item.id) }]"
                      alt=""
                      @load="handleCoverLoad(item.id)"
                      @error="handleCoverError"
                    >
                  </div>
                </div>
                <div class="list-item-cell auto name" style="padding-left: 8px;">
                  <span class="select name" :aria-label="item.name">{{ item.name }}</span>
                  <span v-if="item.meta._qualitys.flac24bit" class="no-select badge badge-theme-primary">{{ $t('tag__lossless_24bit') }}</span>
                  <span v-else-if="item.meta._qualitys.ape || item.meta._qualitys.flac || item.meta._qualitys.wav" class="no-select badge badge-theme-primary">{{ $t('tag__lossless') }}</span>
                  <span v-else-if="item.meta._qualitys['320k']" class="no-select badge badge-theme-secondary">{{ $t('tag__high_quality') }}</span>
                  <span v-if="sourceTag" class="no-select badge badge-theme-tertiary">{{ item.source }}</span>
                </div>
                <div class="list-item-cell" style="flex: 0 0 24%;"><span class="select" :aria-label="item.singer">{{ item.singer }}</span></div>
                <div class="list-item-cell" style="flex: 0 0 27%;"><span class="select" :aria-label="item.meta.albumName">{{ item.meta.albumName }}</span></div>
                <div class="list-item-cell" style="flex: 0 0 10%;"><span class="no-select">{{ item.interval || '--/--' }}</span></div>
              </div>
            </template>
            <template #footer>
              <div :class="$style.pagination">
                <material-pagination :count="total" :limit="limit" :page="page" @btn-click="$emit('togglePage', $event)" />
              </div>
            </template>
          </base-virtualized-list>
        </div>
        <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
          <div v-show="noItem" :class="$style.noitem">
            <p v-text="noItem" />
          </div>
        </transition>
      </div>
    </div>
    <!-- </transition> -->
    <!-- <material-flow-btn :show="isShowEditBtn && assertApiSupport(source)" :remove-btn="false" @btn-click="handleFlowBtnClick" /> -->
    <!-- <common-download-modal v-model:show="isShowDownload" :music-info="selectedDownloadMusicInfo" teleport="#view" />
    <common-download-multiple-modal v-model:show="isShowDownloadMultiple" :list="selectedList" teleport="#view" @confirm="removeAllSelect" /> -->
    <common-list-add-modal v-model:show="isShowListAdd" :music-info="selectedAddMusicInfo" teleport="#view" />
    <common-list-add-multiple-modal v-model:show="isShowListAddMultiple" :music-list="selectedList" teleport="#view" @confirm="removeAllSelect" />
    <common-download-modal v-model:show="isShowDownload" :music-info="selectedDownloadMusicInfo" teleport="#view" />
    <common-download-multiple-modal v-model:show="isShowDownloadMultiple" :list="selectedList" teleport="#view" @confirm="removeAllSelect" />
    <base-menu v-model="isShowItemMenu" :menus="menus" :xy="menuLocation" item-name="name" @menu-click="handleMenuClick" />
  </div>
</template>

<script>
import { clipboardWriteText } from '@common/utils/electron'
import { assertApiSupport } from '@renderer/store/utils'
import { computed, reactive, ref, onMounted, watch, nextTick } from '@common/utils/vueTools'
import useList from './useList'
import useMenu from './useMenu'
import usePlay from './usePlay'
import useMusicDownload from './useMusicDownload'
import useMusicAdd from './useMusicAdd'
import useMusicActions from './useMusicActions'
import { appSetting } from '@renderer/store/setting'
import { getPicUrl as getOnlinePicUrl } from '@renderer/core/music/online'
import { getPicUrl as getLocalPicUrl } from '@renderer/core/music/local'
import placeholderCover from '@renderer/assets/icons/64x64.png' // eslint-disable-line import/no-unresolved

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
    sourceTag: {
      type: Boolean,
      default: false,
    },
    noItem: {
      type: String,
      default: '',
    },
    checkApiSource: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['show-menu', 'play-list', 'togglePage'],
  setup(props, { emit }) {
    const actionButtonsVisible = appSetting['list.actionButtonsVisible']
    const isShowCover = appSetting['list.isShowCover']
    const coverSize = appSetting['list.coverSize']
    const rightClickSelectedIndex = ref(-1)
    const dom_listContent = ref(null)
    const listRef = ref(null)

    // 封面缓存
    const coverUrls = reactive(new Map())
    const fetchingPics = reactive(new Set())
    const loadedCovers = reactive(new Set()) // 已加载完成的封面

    /**
     * 计算列表项高度（确保能容纳封面）
     * @param {number} baseHeight - 基础行高
     * @returns {number} 调整后的行高
     */
    const getListItemHeight = (baseHeight) => {
      if (!isShowCover) return baseHeight
      // 封面高度 + 上下内边距（各 8px）
      const minHeight = coverSize + 16
      return Math.max(baseHeight, minHeight)
    }

    const getCoverUrl = (item) => {
      if (!isShowCover) return ''
      // 如果封面已加载完成，显示实际封面
      if (loadedCovers.has(item.id)) {
        // 优先使用已缓存的封面
        if (item.meta.picUrl) {
          return item.meta.picUrl
        }
        // 如果已经有缓存的 URL
        if (coverUrls.has(item.id)) {
          return coverUrls.get(item.id)
        }
      }
      // 返回占位图片，等待懒加载
      return placeholderCover
    }

    const handleCoverError = (event) => {
      event.target.style.display = 'none'
    }

    const handleCoverLoad = (musicId) => {
      loadedCovers.add(musicId)
    }

    const isCoverLoaded = (musicId) => {
      return loadedCovers.has(musicId)
    }

    // 判断是否使用占位图片（用于决定是否需要过渡效果）
    const isUsingPlaceholder = (item) => {
      // 只要封面未加载完成，就使用占位图
      return isShowCover && !loadedCovers.has(item.id)
    }

    const fetchCover = async(musicInfo) => {
      const musicId = musicInfo.id
      if (fetchingPics.has(musicId)) return

      fetchingPics.add(musicId)
      try {
        let picUrl
        // 优先使用已缓存的封面 URL
        if (musicInfo.meta.picUrl) {
          picUrl = musicInfo.meta.picUrl
        } else if (coverUrls.has(musicId)) {
          picUrl = coverUrls.get(musicId)
        } else {
          // 从网络或本地获取
          if (musicInfo.source === 'local') {
            picUrl = await getLocalPicUrl({ musicInfo, isRefresh: false })
          } else {
            picUrl = await getOnlinePicUrl({ musicInfo, isRefresh: false })
          }
        }
        if (picUrl) {
          coverUrls.set(musicId, picUrl)
          const musicItem = props.list.find(m => m.id === musicId)
          if (musicItem) {
            musicItem.meta.picUrl = picUrl
          }
        }
      } catch (err) {
        console.log('Failed to fetch cover:', err)
      } finally {
        fetchingPics.delete(musicId)
      }
    }

    const {
      selectedList,
      listItemHeight: baseListItemHeight,
      handleSelectData,
      removeAllSelect,
    } = useList({ props, listRef })

    // 根据封面大小调整行高
    const listItemHeight = computed(() => {
      return getListItemHeight(baseListItemHeight.value)
    })

    // 加载可见区域的封面
    const loadVisibleCovers = () => {
      if (!isShowCover || !listRef.value || !props.list) return
      // 从虚拟列表组件获取滚动容器
      const scrollContainer = listRef.value?.$el?.querySelector('.scroll')
      const scrollTop = scrollContainer?.scrollTop ?? 0
      const viewHeight = scrollContainer?.clientHeight ?? 0
      const listItemHeightValue = listItemHeight.value || 50
      const startIndex = Math.floor(scrollTop / listItemHeightValue)
      const endIndex = Math.min(props.list.length, Math.ceil((scrollTop + viewHeight) / listItemHeightValue) + 5)

      for (let i = startIndex; i < endIndex; i++) {
        const item = props.list[i]
        if (item && !coverUrls.has(item.id) && !fetchingPics.has(item.id)) {
          if (!item.meta.picUrl) {
            fetchCover(item).catch(() => {})
          }
        }
      }
    }

    const {
      handlePlayMusic,
      handlePlayMusicLater,
      doubleClickPlay,
    } = usePlay({ selectedList, props, removeAllSelect, emit })

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
      handleDislikeMusic,
    } = useMusicActions({ props })

    const {
      menus,
      menuLocation,
      isShowItemMenu,
      showMenu,
      menuClick,
    } = useMenu({
      props,
      assertApiSupport,
      emit,

      handleShowDownloadModal,
      handlePlayMusic,
      handlePlayMusicLater,
      handleSearch,
      handleShowMusicAddModal,
      handleOpenMusicDetail,
      handleDislikeMusic,
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
          void handlePlayMusic(index, true)
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
      listRef.value?.scrollTo(0, true)
    }

    const handleScroll = () => {
      loadVisibleCovers()
    }

    // 监听列表数据变化，加载可见区域封面
    watch(() => props.list, () => {
      if (isShowCover) {
        void nextTick(() => {
          loadVisibleCovers()
        })
      }
    }, { immediate: true, deep: true })

    onMounted(() => {
      if (isShowCover) {
        loadVisibleCovers()
      }
    })

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

      handleListRightClick,
      assertApiSupport,

      isShowListAdd,
      isShowListAddMultiple,
      selectedAddMusicInfo,

      isShowDownload,
      isShowDownloadMultiple,
      selectedDownloadMusicInfo,

      scrollToTop,
      actionButtonsVisible,

      isShowCover,
      coverSize,
      getCoverUrl,
      handleCoverError,
      handleCoverLoad,
      isCoverLoaded,
      isUsingPlaceholder,
      loadVisibleCovers,
      handleScroll,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.songList {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
}

.list {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  font-size: 14px;
}

.content {
  flex: auto;
  min-height: 0;
  position: relative;
  height: 100%;
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
  // background-color: var(--color-000);

  p {
    font-size: 24px;
    color: var(--color-font-label);
  }
}
.cover {
  flex: 0 0 auto;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--color-500);
  flex-shrink: 0;

  .coverImg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 1; // 缓存封面直接显示

    // 只有占位图才需要淡入效果
    &.placeholder {
      opacity: 0.6;
      transition: opacity 0.3s ease;

      &.coverLoaded {
        opacity: 1;
      }
    }
  }
}

</style>
