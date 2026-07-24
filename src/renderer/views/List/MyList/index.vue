<template>
  <div ref="dom_lists" :class="$style.lists">
    <ul ref="dom_lists_list" :class="[$style.listsContent, { [$style.sortable]: isModDown }]">
      <li
        class="default-list" :class="[$style.listsItem, {[$style.active]: defaultList.id == listId}, {[$style.clicked]: rightClickItemIndex == -2}, {[$style.fetching]: fetchingListStatus[defaultList.id]}]"
        :aria-label="$t(defaultList.name)" :aria-selected="defaultList.id == listId"
        @contextmenu="handleListsItemRigthClick($event, -2)" @click="handleListToggle(defaultList.id)"
      >
        <!-- <div v-if="defaultList.id == listId" :class="$style.activeIcon">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="40%" viewBox="0 0 451.846 451.847" space="preserve">
            <use xlink:href="#icon-right" />
          </svg>
        </div> -->
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
        <base-input
          :class="$style.listsInput" type="text" :value="item.name"
          :placeholder="item.name" @keyup.enter="handleSaveListName(index, $event)" @blur="handleSaveListName(index, $event)"
        />
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
    <base-menu v-model="isShowMenu" :menus="menus" :xy="menuLocation" item-name="name" @menu-click="handleMenuClick" />
    <DuplicateMusicModal v-model:visible="isShowDuplicateMusicModal" :list-info="duplicateListInfo" />
    <ListSortModal v-model:visible="isShowListSortModal" :list-info="sortListInfo" />
    <ListUpdateModal v-model:visible="isShowListUpdateModal" />
  </div>
</template>

<script>
import { openUrl } from '@common/utils/electron'

import musicSdk from '@renderer/utils/musicSdk'
import DuplicateMusicModal from './components/DuplicateMusicModal.vue'
import ListSortModal from './components/ListSortModal.vue'
import ListUpdateModal from './components/ListUpdateModal.vue'

import { defaultList, loveList, userLists, fetchingListStatus } from '@renderer/store/list/state'
import { removeUserList } from '@renderer/store/list/action'

import { ref, watch } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { LIST_IDS } from '@common/constants'

import { dialog } from '@renderer/plugins/Dialog'

import { saveListPrevSelectId } from '@renderer/utils/data'

import { useI18n } from '@renderer/plugins/i18n'


import useShare from './useShare'
import useMenu from './useMenu'
import useListUpdate from './useListUpdate'
import useSort from './useSort'
import useDarg from './useDarg'
import useEditList from './useEditList'
import useListScroll from './useListScroll'
import useDuplicate from './useDuplicate'

export default {
  name: 'MyLists',
  components: {
    DuplicateMusicModal,
    ListSortModal,
    ListUpdateModal,
  },
  props: {
    listId: {
      type: String,
      required: true,
    },
  },
  emits: ['show-menu'],
  setup(props, { emit }) {
    const router = useRouter()
    const t = useI18n()

    const dom_lists_list = ref(null)
    const rightClickItemIndex = ref(-10)

    const { handleImportList, handleExportList } = useShare()
    const { isShowListUpdateModal, handleUpdateSourceList } = useListUpdate()
    const { isShowListSortModal, sortListInfo, handleSortList } = useSort()
    const { isShowDuplicateMusicModal, duplicateListInfo, handleDuplicateList } = useDuplicate()
    const { handleRename, handleSaveListName, isShowNewList, isNewListLeave, handleCreateList } = useEditList({ dom_lists_list })
    useListScroll({ dom_lists_list })

    const handleOpenSourceDetailPage = async(listInfo) => {
      const { source, sourceListId } = listInfo
      if (!sourceListId) return
      let url
      if (/board__/.test(sourceListId)) {
        const id = sourceListId.replace(/board__/, '')
        url = musicSdk[source].leaderboard.getDetailPageUrl(id)
      } else if (musicSdk[source]?.songList?.getDetailPageUrl) {
        url = await musicSdk[source].songList.getDetailPageUrl(sourceListId)
      }
      if (!url) return
      void openUrl(url)
    }

    const handleRemove = (listInfo) => {
      void dialog.confirm({
        message: t('lists__remove_tip', { name: listInfo.name }),
        confirmButtonText: t('lists__remove_tip_button'),
      }).then(isRemove => {
        if (!isRemove) return
        void removeUserList([listInfo.id])
        if (props.listId == listInfo.id) {
          handleListToggle(LIST_IDS.DEFAULT)
        }
      })
    }

    const {
      menus,
      menuLocation,
      isShowMenu,
      showMenu,
      menuClick,
    } = useMenu({
      emit,

      handleImportList,
      handleExportList,
      handleUpdateSourceList,
      handleOpenSourceDetailPage,
      handleSortList,
      handleDuplicateList,
      handleRename,
      handleRemove,
    })

    const handleListsItemRigthClick = (event, index) => {
      rightClickItemIndex.value = index
      showMenu(event, index)
    }

    const handleListToggle = (id) => {
      if (id == props.listId) return
      router.replace({
        path: '/list',
        query: { id },
      }).catch(_ => _)
    }

    const handleMenuClick = (action) => {
      if (rightClickItemIndex.value < -2) return
      let index = rightClickItemIndex.value
      rightClickItemIndex.value = -10
      menuClick(action, index)
    }

    const { isModDown } = useDarg({ dom_lists_list, handleMenuClick, handleSaveListName })


    watch(() => props.listId, (listId) => {
      saveListPrevSelectId(listId)
    })

    watch(() => userLists, (lists) => {
      if (lists.some(l => l.id == props.listId)) return
      void router.replace({
        path: '/list',
        query: {
          id: defaultList.id,
        },
      })
    })

    return {
      rightClickItemIndex,
      defaultList,
      loveList,
      userLists,
      fetchingListStatus,
      dom_lists_list,
      isShowListUpdateModal,
      isShowListSortModal,
      sortListInfo,
      isShowDuplicateMusicModal,
      duplicateListInfo,
      handleSaveListName,
      isShowNewList,
      isNewListLeave,
      handleCreateList,
      handleListsItemRigthClick,
      isShowMenu,
      handleMenuClick,
      menus,
      menuLocation,
      handleListToggle,
      isModDown,
      hideMenu: handleMenuClick,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

@lists-item-height: 32px;
.lists {
  flex: none;
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  padding: 0 15px;
  box-sizing: border-box;
}
.listsContent {
  flex: auto;
  min-height: 0;
  display: flex;
  flex-flow: row wrap;
  padding: 4px 0;
  list-style: none;
  margin: 0;

  &.sortable {
    * {
      -webkit-user-drag: element;
    }

    .listsItem {
      &:hover, &.active, &.selected, &.clicked {
        background-color: transparent !important;
      }

      &.dragingItem {
        background-color: var(--color-button-background-hover) !important;
      }
    }
  }
}
.listsItem {
  position: relative;
  transition: .3s ease;
  transition-property: color, background-color, opacity;
  background-color: var(--color-button-background);
  flex: 0 0 auto;
  margin: 2px 3px;
  border-radius: @radius-progress-border;
  cursor: pointer;
  color: var(--color-button-font);
  font-size: 12px;
  &:hover:not(.active) {
    background-color: var(--color-button-background-hover);
  }
  &.active {
    color: #ffffff;
    background-color: var(--color-primary);
  }
  &.selected {
    background-color: var(--color-primary-font-active);
  }
  &.clicked {
    background-color: var(--color-button-background-hover);
  }
  &.fetching {
    opacity: .5;
  }
  &.editing {
    padding: 0 6px;
    background-color: var(--color-button-background-hover);
    .listsLabel {
      display: none;
    }
    .listsInput {
      display: block;
    }
  }
}
.activeIcon {
  height: .85em;
  width: .85em;
  margin-left: -0.4em;
  vertical-align: -0.05em;
}
.listsLabel {
  display: block;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
}
.listsInput {
  width: 140px;
  padding: 0;
  background: none !important;
  border-radius: 0;
  font-size: 12px;
  display: none;
}

.listsNew {
  padding: 0 6px;
  background-color: var(--color-button-background-hover) !important;
  .listsInput {
    display: block;
  }
}
.newLeave {
  margin-left: -@lists-item-height;
  z-index: -1;
}


</style>
