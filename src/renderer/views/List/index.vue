<template>
  <div id="my-list" :class="$style.container" @click="handleContainerClick">
    <div :class="$style.pageHeader">
      <div :class="$style.pageIcon">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 444.87 391.18" height="32" width="32" space="preserve">
          <use xlink:href="#icon-love" />
        </svg>
      </div>
      <div :class="$style.pageInfo">
        <span :class="$style.pageTitle">{{ $t('my_list') }}</span>
        <div :class="$style.headerBtns">
          <button :class="$style.listsAdd" :aria-label="$t('lists__new_list_btn')" @click="isShowNewList = true">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="70%" viewBox="0 0 24 24" space="preserve">
              <use xlink:href="#icon-list-add" />
            </svg>
            <span>{{ $t('lists__new_list_btn') }}</span>
          </button>
          <button :class="$style.listsAdd" :aria-label="$t('list_update_modal__title')" @click="isShowListUpdateModal = true">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" style="transform: rotate(45deg);" height="70%" viewBox="0 0 24 24" space="preserve">
              <use xlink:href="#icon-refresh" />
            </svg>
            <span>{{ $t('list_update_modal__title') }}</span>
          </button>
          <button :class="$style.listsAdd" @click="isShowOpenSongListModal = true">{{ $t('songlist__import_input_show_btn') }}</button>
        </div>
      </div>
    </div>
    <div :class="$style.listTabs">
      <ul ref="dom_lists_list" class="scroll" :class="[$style.listsContent, { [$style.sortable]: isModDown }]">
        <li
          class="default-list" :class="[$style.listsItem, {[$style.active]: defaultList.id == listId}, {[$style.clicked]: rightClickItemIndex == -2}, {[$style.fetching]: fetchingListStatus[defaultList.id]}]"
          :aria-label="$t(defaultList.name)" :aria-selected="defaultList.id == listId"
          @contextmenu="handleListsItemRigthClick($event, -2)" @click="handleListToggle(defaultList.id)"
        >
          <span :class="$style.listsLabel">
            {{ $t(defaultList.name) }}
          </span>
        </li>
        <li
          class="default-list" :class="[$style.listsItem, {[$style.active]: loveList.id == listId}, {[$style.clicked]: rightClickItemIndex == -1}, {[$style.fetching]: fetchingListStatus[loveList.id]}]"
          :aria-label="$t(loveList.name)" :aria-selected="loveList.id == listId"
          @contextmenu="handleListsItemRigthClick($event, -1)" @click="handleListToggle(loveList.id)"
        >
          <span :class="$style.listsLabel">
            {{ $t(loveList.name) }}
          </span>
        </li>
        <li
          v-for="(item, index) in userLists"
          :key="item.id" class="user-list"
          :class="[$style.listsItem, {[$style.active]: item.id == listId}, {[$style.clicked]: rightClickItemIndex == index}, {[$style.fetching]: fetchingListStatus[item.id]}]"
          :data-index="index" :aria-label="item.name" :aria-selected="defaultList.id == listId" @contextmenu="handleListsItemRigthClick($event, index)"
        >
          <span :class="$style.listsLabel" @click="handleListToggle(item.id, index + 2)">
            {{ item.name }}
          </span>
        </li>
        <transition enter-active-class="animated-fast slideInLeft" leave-active-class="animated-fast fadeOut" @after-leave="isNewListLeave = false" @after-enter="$refs.dom_listsNewInput.focus()">
          <li v-if="isShowNewList" :class="[$style.listsItem, $style.listsNew, {[$style.newLeave]: isNewListLeave}]">
            <base-input
              ref="dom_listsNewInput" :class="$style.listsInput" type="text" :placeholder="$t('lists__new_list_input')"
              @keyup.enter="handleCreateList" @blur="handleCreateList"
            />
          </li>
        </transition>
      </ul>
    </div>
    <div :class="$style.main">
      <MusicList ref="musicList" :list-id="listId" />
    </div>
    <base-menu v-model="isShowMenu" :menus="menus" :xy="menuLocation" item-name="name" @menu-click="handleMenuClick" />
    <DuplicateMusicModal v-model:visible="isShowDuplicateMusicModal" :list-info="duplicateListInfo" />
    <ListSortModal v-model:visible="isShowListSortModal" :list-info="sortListInfo" />
    <ListUpdateModal v-model:visible="isShowListUpdateModal" />
    <OpenSongListModal v-model="isShowOpenSongListModal" :source-list="sourceList" />
  </div>
</template>

<script>
import { defaultList, loveList, userLists, fetchingListStatus } from '@renderer/store/list/state'
import { createUserList, updateUserList, removeUserList, getListMusics, addListMusics, overwriteListMusics, updateUserListPosition } from '@renderer/store/list/action'
import Sortable from 'sortablejs/modular/sortable.core.esm'
import { openUrl } from '@common/utils/electron'
import { LIST_IDS } from '@common/constants'
import musicSdk from '@renderer/utils/musicSdk'
import syncSourceList from '@renderer/store/list/syncSourceList'
import { openSaveDir, showSelectDialog } from '@renderer/utils/ipc'
import { filterFileName, toNewMusicInfo, fixNewMusicInfoQuality, filterMusicList } from '@renderer/utils'
import useImportTip from '@renderer/utils/compositions/useImportTip'
import { nextTick, toRaw } from '@common/utils/vueTools'
import { dialog } from '@renderer/plugins/Dialog'

import MusicList from './MusicList/index.vue'
import DuplicateMusicModal from './MyList/components/DuplicateMusicModal.vue'
import ListSortModal from './MyList/components/ListSortModal.vue'
import ListUpdateModal from './MyList/components/ListUpdateModal.vue'
import OpenSongListModal from '../songList/List/components/OpenListModal.vue'
import { sources } from '@renderer/store/songList/state'
import { sourceNames } from '@renderer/store'

export default {
  name: 'List',
  components: {
    MusicList,
    DuplicateMusicModal,
    ListSortModal,
    ListUpdateModal,
    OpenSongListModal,
  },
  beforeRouteEnter(to, from, next) {
    let id = to.query.id
    if (!id) {
      // 默认选中第一个标签「试听列表」
      id = LIST_IDS.DEFAULT
      next({
        path: to.path,
        query: { id },
      })
    } else next()
  },
  beforeRouteUpdate(to, from) {
    if (to.query.updated) return
    let id = to.query.id
    if (id == null) return
    this.listId = id
    const scrollIndex = to.query.scrollIndex
    const isAnimation = from.query.id == to.query.id
    this.$refs.musicList?.handleRestoreScroll(scrollIndex, isAnimation)

    return {
      path: '/list',
      query: { id, updated: true },
    }
  },
  beforeRouteLeave(to, from) {
    this.$refs.musicList?.saveListPosition()
  },
  data() {
    return {
      listId: null,
      defaultList,
      loveList,
      userLists,
      fetchingListStatus,
      rightClickItemIndex: -10,
      isModDown: false,
      isShowNewList: false,
      isNewListLeave: false,
      isShowMenu: false,
      menuLocation: { x: 0, y: 0 },
      menuControl: {
        rename: true,
        duplicate: true,
        sort: true,
        sourceDetail: true,
        import: true,
        export: true,
        sync: false,
        remove: true,
      },
      isShowListUpdateModal: false,
      isShowListSortModal: false,
      sortListInfo: {},
      isShowDuplicateMusicModal: false,
      duplicateListInfo: {},
      isShowOpenSongListModal: false,
    }
  },
  computed: {
    sourceList() {
      return sources.map(s => ({ id: s, name: sourceNames.value[s] }))
    },
    menus() {
      const t = this.$t
      return [
        { name: t('lists__rename'), action: 'rename', disabled: !this.menuControl.rename },
        { name: t('lists__sort_list'), action: 'sort', disabled: !this.menuControl.sort },
        { name: t('lists__duplicate'), action: 'duplicate', disabled: !this.menuControl.duplicate },
        { name: t('lists__sync'), action: 'sync', disabled: !this.menuControl.sync },
        { name: t('lists__source_detail'), action: 'sourceDetail', disabled: !this.menuControl.sourceDetail },
        { name: t('lists__import'), action: 'import', disabled: !this.menuControl.import },
        { name: t('lists__export'), action: 'export', disabled: !this.menuControl.export },
        { name: t('lists__remove'), action: 'remove', disabled: !this.menuControl.remove },
      ]
    },
  },
  created() {
    this.listId = this.$route.query.id
  },
  mounted() {
    const dom_lists_list = this.$refs.dom_lists_list
    if (!dom_lists_list) return

    // 按住 Ctrl/Meta 时启用标签拖动排序（前两个内置列表与新列表输入框不可拖）
    const sortable = Sortable.create(dom_lists_list, {
      animation: 150,
      disabled: true,
      filter: `.default-list, .${this.$style.listsNew}`,
      ghostClass: this.$style.dragingItem,
      onUpdate: (newIndex, oldIndex) => {
        void updateUserListPosition({ ids: [userLists[oldIndex - 2].id], position: newIndex - 2 })
      },
    })

    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        this.isModDown = true
        sortable.option('disabled', false)
      }
    }
    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        this.isModDown = false
        sortable.option('disabled', true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    this._cleanup = () => {
      sortable.destroy()
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  },
  beforeUnmount() {
    this._cleanup?.()
  },
  methods: {
    handleContainerClick() {
      this.hideMenu()
      this.$refs.musicList?.handleMenuClick()
    },
    handleListToggle(id) {
      if (id == this.listId) return
      void this.$router.replace({
        path: '/list',
        query: { id },
      }).catch(_ => _)
    },
    handleListsItemRigthClick(event, index) {
      event.preventDefault()
      this.rightClickItemIndex = index
      this.showMenu(event, index)
    },
    showMenu(event, index) {
      let source
      switch (index) {
        case -1:
        case -2:
          this.menuControl.rename = false
          this.menuControl.remove = false
          this.menuControl.sync = false
          break
        default:
          this.menuControl.rename = true
          this.menuControl.remove = true
          source = userLists[index].source
          this.menuControl.sync = !!source && !!musicSdk[source]?.songList
          break
      }
      this.menuControl.sourceDetail = this.assertSupportDetail(source, index)

      this.menuLocation.x = event.pageX
      this.menuLocation.y = event.pageY

      if (this.isShowMenu) return
      void nextTick(() => {
        this.isShowMenu = true
      })
    },
    hideMenu() {
      this.isShowMenu = false
    },
    assertSupportDetail(source, index) {
      if (source) {
        const { sourceListId } = userLists[index]
        if (sourceListId) {
          if (sourceListId.includes('board__')) {
            return !!musicSdk[source]?.leaderboard?.getDetailPageUrl
          } else {
            return !!musicSdk[source]?.songList?.getDetailPageUrl
          }
        }
      }
      return false
    },
    getListInfo(index) {
      let list
      switch (index) {
        case -2:
          list = defaultList
          break
        case -1:
          list = loveList
          break
        default:
          list = userLists[index]
          if (!list) return null
          break
      }
      return list
    },
    handleMenuClick(action) {
      this.hideMenu()
      if (!action) return
      const listInfo = this.getListInfo(this.rightClickItemIndex)
      switch (action.action) {
        case 'rename':
          this.handleRename(this.rightClickItemIndex)
          break
        case 'duplicate':
          this.handleDuplicateList(listInfo)
          break
        case 'sort':
          this.handleSortList(listInfo)
          break
        case 'sourceDetail':
          this.handleOpenSourceDetailPage(listInfo)
          break
        case 'import':
          this.handleImportList(listInfo, this.rightClickItemIndex)
          break
        case 'export':
          this.handleExportList(listInfo)
          break
        case 'sync':
          this.handleUpdateSourceList(listInfo)
          break
        case 'remove':
          this.handleRemove(listInfo)
          break
      }
    },
    handleRename(index) {
      const dom = this.$refs.dom_lists_list?.querySelectorAll('.user-list')[index]
      if (!dom) return
      void nextTick(() => {
        dom.classList.add(this.$style.editing)
        dom.querySelector('input')?.focus()
      })
    },
    handleDuplicateList(listInfo) {
      this.duplicateListInfo = { id: listInfo.id, name: listInfo.name }
      this.isShowDuplicateMusicModal = true
    },
    handleSortList(listInfo) {
      this.sortListInfo = { id: listInfo.id, name: listInfo.name }
      this.isShowListSortModal = true
    },
    handleOpenSourceDetailPage(listInfo) {
      const { source, sourceListId } = listInfo
      if (!sourceListId) return
      let url
      if (sourceListId.includes('board__')) {
        const id = sourceListId.replace('board__', '')
        url = musicSdk[source].leaderboard.getDetailPageUrl(id)
      } else if (musicSdk[source]?.songList?.getDetailPageUrl) {
        url = musicSdk[source].songList.getDetailPageUrl(sourceListId)
      }
      if (url) void openUrl(url)
    },
    handleImportList(listInfo, index) {
      void showSelectDialog({
        title: this.$t('lists__import_part_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Play List Part', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(async result => {
        if (result.canceled) return
        const filePath = result.filePaths[0]
        if (!filePath) return
        let configData
        try {
          configData = await window.lx.worker.main.readLxConfigFile(filePath)
        } catch (error) {
          return
        }
        let listData
        switch (configData.type) {
          case 'playListPart':
            listData = configData.data
            listData.list = filterMusicList(listData.list.map(m => toNewMusicInfo(m)))
            break
          case 'playListPart_v2':
            listData = configData.data
            listData.list = filterMusicList(listData.list).map(m => fixNewMusicInfoQuality(m))
            break
          default:
            useImportTip()(configData.type)
            return
        }

        const targetList = [defaultList, loveList, ...userLists].find(l => l.id == listData.id)
        if (targetList) {
          const confirm = await dialog.confirm({
            message: this.$t('lists__import_part_confirm', { importName: listData.name, localName: targetList.name }),
            cancelButtonText: this.$t('lists__import_part_button_cancel'),
            confirmButtonText: this.$t('lists__import_part_button_confirm'),
          })
          if (confirm) {
            listData.name = targetList.name
            switch (listData.id) {
              case defaultList.id:
              case loveList.id:
                break
              default:
                void updateUserList([
                  {
                    name: listData.name,
                    id: listData.id,
                    source: listData.source,
                    sourceListId: listData.sourceListId,
                    locationUpdateTime: targetList.locationUpdateTime,
                  },
                ])
                break
            }
            void overwriteListMusics({
              listId: listData.id,
              musicInfos: listData.list.map(m => fixNewMusicInfoQuality(m)),
            })
            return
          }
          listData.id += `__${Date.now()}`
        }
        void createUserList({
          position: index,
          name: listData.name,
          id: listData.id,
          source: listData.source,
          sourceListId: listData.sourceListId,
        })
        void addListMusics(listData.id, listData.list.map(m => fixNewMusicInfoQuality(m)))
      })
    },
    handleExportList(listInfo) {
      if (!listInfo) return
      void openSaveDir({
        title: this.$t('lists__export_part_desc'),
        defaultPath: `lx_list_part_${filterFileName(listInfo.name)}.lxmc`,
      }).then(async result => {
        if (result.canceled || !result.filePath) return
        void window.lx.worker.main.saveLxConfigFile(result.filePath, {
          type: 'playListPart_v2',
          data: { ...toRaw(listInfo), list: toRaw(await getListMusics(listInfo.id)) },
        })
      })
    },
    handleUpdateSourceList(listInfo) {
      void dialog.confirm({
        message: this.$t('lists__sync_confirm_tip', { name: listInfo.name }),
        confirmButtonText: this.$t('lists__remove_tip_button'),
      }).then(isSync => {
        if (!isSync) return
        void syncSourceList(listInfo)
      })
    },
    handleRemove(listInfo) {
      void dialog.confirm({
        message: this.$t('lists__remove_tip', { name: listInfo.name }),
      }).then((confirm) => {
        if (!confirm) return
        void removeUserList([listInfo.id]).then(() => {
          if (this.listId == listInfo.id) {
            void this.$router.replace({
              path: '/list',
              query: { id: defaultList.id },
            }).catch(_ => _)
          }
        })
      })
    },
    async handleCreateList(event) {
      const target = event.target
      if (target.readOnly) return
      const name = target.value.trim()
      target.readOnly = true
      if (name == '' || (this.userLists.some(l => l.name == name) && !await dialog.confirm(this.$t('list_duplicate_tip')))) {
        this.isShowNewList = false
        return
      }
      void createUserList({ name }).then(() => {
        this.isNewListLeave = true
        void nextTick(() => {
          this.isShowNewList = false
        })
      })
    },
    handleSaveListName(index, event) {
      const name = event.target.value.trim()
      if (!name) return
      const list = userLists[index]
      if (list.name === name) return
      void updateUserList({ ...list, name })
    },
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
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
.headerBtns {
  flex: none;
  display: flex;
  gap: 5px;
}
.listsTitle {
  flex: auto;
  font-size: 12px;
  line-height: 38px;
  padding: 0 10px;
  .mixin-ellipsis-1();
}
.openSongListBtn {
  flex: none;
  margin-right: 10px;
  background: var(--color-primary-background);
  height: 32px;
  border: none;
  outline: none;
  border-radius: 8px;
  cursor: pointer;
  opacity: 1;
  transition: all @transition-fast;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 14px;
  font-size: 13px;
  white-space: nowrap;
  &:active {
    background: var(--color-primary-alpha-800);
  }
  &:hover {
    background: var(--color-primary-alpha-900);
  }
}
.listsAdd {
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
.listTabs {
  flex: none;
  border-bottom: var(--color-list-header-border-bottom);
  overflow: hidden;
  padding: 8px 0;
}
.listsContent {
  display: flex;
  flex-flow: row wrap;
  align-content: flex-start;
  padding: 0 10px;
  gap: 6px;
  // 标签 11px 字 + 上下 3px 内边距 = 19.2px 高，最多铺 3 行，超出部分裁掉，不再横向滚动
  max-height: calc(19.2px * 3 + 6px * 2);
  overflow: hidden;
  &.sortable {
    * {
      -webkit-user-drag: element;
    }
    .listsItem {
      &:hover, &.active, &.selected, &.clicked {
        background-color: transparent !important;
      }
      &.dragingItem {
        background-color: var(--color-primary-background-hover) !important;
      }
    }
  }
}
.listsItem {
  position: relative;
  transition: .3s ease;
  transition-property: color, background-color, opacity;
  background-color: var(--color-primary-light-400-alpha-300);
  border: none;
  border-radius: @radius-progress-border;
  flex: none;
  display: flex;
  align-items: center;
  padding: 3px 6px;
  line-height: 13.2px;
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
  color: var(--color-primary);
  opacity: 1;
  &:not(.active) {
    &:hover {
      background-color: var(--color-primary-light-400-alpha-500);
    }
  }
  &.active {
    color: #fff;
    background-color: var(--color-primary);
    font-weight: 500;
  }
  &.selected {
    background-color: var(--color-primary-font-active);
  }
  &.clicked {
    background-color: var(--color-primary-background-hover);
  }
}
.listsLabel {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.activeIcon {
  color: var(--color-primary);
  width: 12px;
  height: 12px;
}
.listsInput {
  width: 100%;
  height: 13.2px;
  padding: 0 2px !important;
  line-height: 13.2px;
  background: none !important;
  border: none;
  border-bottom: 1px solid var(--color-primary);
  border-radius: 0 !important;
  outline: none;
  font-size: 11px !important;
  color: var(--color-text) !important;
}
.listsNew {
  display: flex;
  align-items: center;
  background-color: var(--color-primary-background-hover) !important;
  opacity: 1;
}
.newLeave {
  margin-top: 0;
  z-index: -1;
}
.main {
  flex: auto;
  display: flex;
  overflow: hidden;
  flex-flow: column nowrap;
}
</style>
