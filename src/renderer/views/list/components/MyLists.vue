<template>
<div :class="$style.lists" ref="dom_lists">
  <div :class="$style.listHeader">
    <h2 :class="$style.listsTitle">{{$t('my_list')}}</h2>
    <button :class="$style.listsAdd" @click="handleShowNewList" :tips="$t('lists__new_list_btn')">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="70%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-list-add"></use>
      </svg>
    </button>
  </div>
  <ul class="scroll" :class="[$style.listsContent, { [$style.sortable]: keyEvent.isModDown }]" ref="dom_lists_list">
    <li class="default-list" :class="[$style.listsItem, {[$style.active]: defaultList.id == listId}]" :tips="defaultList.name"
      @contextmenu="handleListsItemRigthClick($event, -2)" @click="handleListToggle(defaultList.id)"
    >
      <span :class="$style.listsLabel">{{defaultList.name}}</span>
    </li>
    <li class="default-list" :class="[$style.listsItem, {[$style.active]: loveList.id == listId}]" :tips="loveList.name"
      @contextmenu="handleListsItemRigthClick($event, -1)" @click="handleListToggle(loveList.id)">
      <span :class="$style.listsLabel">{{loveList.name}}</span>
    </li>
    <li class="user-list"
      :class="[$style.listsItem, {[$style.active]:item.id == listId}, {[$style.clicked]: listsData.rightClickItemIndex == index}, {[$style.fetching]: fetchingListStatus[item.id]}]" :data-index="index"
      @contextmenu="handleListsItemRigthClick($event, index)" :tips="item.name" v-for="(item, index) in userLists" :key="item.id"
    >
      <span :class="$style.listsLabel" @click="handleListToggle(item.id, index + 2)">{{item.name}}</span>
      <input class="key-bind" :class="$style.listsInput" @contextmenu.stop type="text"
        @keyup.enter="handleListsSave(index, $event)" @blur="handleListsSave(index, $event)" :value="item.name" :placeholder="item.name"/>
    </li>
    <transition enter-active-class="animated-fast slideInLeft" leave-active-class="animated-fast fadeOut" @after-leave="handleListsNewAfterLeave">
      <li :class="[$style.listsItem, $style.listsNew, listsData.isNewLeave ? $style.newLeave : null]" v-if="listsData.isShowNewList">
        <input class="key-bind" :class="$style.listsInput" @contextmenu.stop ref="dom_listsNewInput" type="text" @keyup.enter="handleListsCreate"
          @blur="handleListsCreate" :placeholder="$t('lists__new_list_input')"/>
      </li>
    </transition>
  </ul>
  <base-menu :menus="listsItemMenu" :location="listsData.menuLocation" item-name="name" :isShow="listsData.isShowItemMenu" @menu-click="handleListsItemMenuClick" />
  <DuplicateMusicModal v-model:visible="isShowDuplicateMusicModal" :list-info="selectedDuplicateListInfo" />
  <ListSortModal v-model:visible="isShowListSortModal" :list-info="selectedSortListInfo" />
</div>
</template>

<script>
import { mapMutations, mapActions } from 'vuex'
import { openSaveDir, saveLxConfigFile, selectDir, readLxConfigFile, filterFileName } from '@renderer/utils'
import musicSdk from '@renderer/utils/music'
import DuplicateMusicModal from './DuplicateMusicModal'
import ListSortModal from './ListSortModal'
import { defaultList, loveList, userLists } from '@renderer/core/share/list'
import { ref, computed, useCommit, useCssModule } from '@renderer/utils/vueTools'
import { getList } from '@renderer/core/share/utils'
import useDarg from '@renderer/utils/compositions/useDrag'

export default {
  name: 'MyLists',
  props: {
    listId: {
      type: [String, Number],
      required: true,
    },
  },
  components: {
    DuplicateMusicModal,
    ListSortModal,
  },
  setup() {
    const dom_lists_list = ref(null)
    const lists = computed(() => [defaultList, loveList, ...userLists])
    const setUserListPosition = useCommit('list', 'setUserListPosition')

    const styles = useCssModule()
    const { setDisabled } = useDarg({
      dom_list: dom_lists_list,
      dragingItemClassName: styles.dragingItem,
      filter: 'default-list',
      onUpdate(newIndex, oldIndex) {
        setUserListPosition({ id: lists.value[oldIndex].id, position: newIndex - 2 })
      },
    })

    return {
      defaultList,
      loveList,
      userLists,
      lists,
      dom_lists_list,
      setDisabledSort: setDisabled,
    }
  },
  emits: ['show-menu'],
  data() {
    return {
      isShowDuplicateMusicModal: false,
      isShowListSortModal: false,
      listsData: {
        isShowItemMenu: false,
        itemMenuControl: {
          rename: true,
          duplicate: true,
          sort: true,
          import: true,
          export: true,
          sync: false,
          remove: true,
        },
        rightClickItemIndex: -1,
        menuLocation: {
          x: 0,
          y: 0,
        },
        isShowNewList: false,
        isNewLeave: false,
      },
      fetchingListStatus: {},
      selectedDuplicateListInfo: {},
      selectedSortListInfo: {},
      keyEvent: {
        isModDown: false,
      },
    }
  },
  computed: {
    listsItemMenu() {
      return [
        {
          name: this.$t('lists__rename'),
          action: 'rename',
          disabled: !this.listsData.itemMenuControl.rename,
        },
        {
          name: this.$t('lists__sync'),
          action: 'sync',
          disabled: !this.listsData.itemMenuControl.sync,
        },
        {
          name: this.$t('lists__sort_list'),
          action: 'sort',
          disabled: !this.listsData.itemMenuControl.sort,
        },
        {
          name: this.$t('lists__duplicate'),
          action: 'duplicate',
          disabled: !this.listsData.itemMenuControl.duplicate,
        },
        {
          name: this.$t('lists__import'),
          action: 'import',
          disabled: !this.listsData.itemMenuControl.export,
        },
        {
          name: this.$t('lists__export'),
          action: 'export',
          disabled: !this.listsData.itemMenuControl.export,
        },
        {
          name: this.$t('lists__remove'),
          action: 'remove',
          disabled: !this.listsData.itemMenuControl.remove,
        },
      ]
    },
  },
  watch: {
    listId(id) {
      this.setPrevSelectListId(id)
    },
    lists(lists) {
      if (lists.some(l => l.id == this.listId)) return
      this.$router.replace({
        path: 'list',
        query: {
          id: this.defaultList.id,
        },
      })
    },
  },
  created() {
    this.setPrevSelectListId(this.listId)
  },
  mounted() {
    this.setListsScroll()
    window.eventHub.on('key_mod_down', this.handle_key_mod_down)
    window.eventHub.on('key_mod_up', this.handle_key_mod_up)
  },
  beforeUnmount() {
    window.eventHub.off('key_mod_down', this.handle_key_mod_down)
    window.eventHub.off('key_mod_up', this.handle_key_mod_up)
  },
  methods: {
    ...mapMutations('list', [
      'setUserListName',
      'createUserList',
      'removeUserList',
      'setPrevSelectListId',
      'setList',
    ]),
    ...mapActions('songList', ['getListDetailAll']),
    ...mapActions('leaderboard', {
      getBoardListAll: 'getListAll',
    }),
    handle_key_mod_down() {
      if (!this.keyEvent.isModDown) {
        this.keyEvent.isModDown = true
        this.setDisabledSort(false)
        const dom_target = this.dom_lists_list.querySelector('.' + this.$style.editing)
        if (dom_target) this.handleListsSave(dom_target.dataset.index)
      }
      if (this.listsData.isShowItemMenu) this.hideListsMenu()
    },
    handle_key_mod_up() {
      if (this.keyEvent.isModDown) {
        this.keyEvent.isModDown = false
        this.setDisabledSort(true)
      }
    },
    setListsScroll() {
      let target = this.dom_lists_list.querySelector('.' + this.$style.active)
      if (!target) return
      let offsetTop = target.offsetTop
      let location = offsetTop - 150
      if (location > 0) this.dom_lists_list.scrollTop = location
    },
    handleListsSave(index) {
      let dom_target = this.dom_lists_list.querySelector('.' + this.$style.editing)
      if (!dom_target) return
      dom_target.classList.remove(this.$style.editing)
      const dom_input = dom_target.querySelector('.' + this.$style.listsInput)
      let name = dom_input.value.trim()
      const targetList = userLists[index]
      if (name.length) return this.setUserListName({ id: targetList.id, name })
      dom_input.value = targetList.name
    },
    handleListsCreate(event) {
      if (event.target.readonly) return
      let name = event.target.value.trim()
      event.target.readonly = true

      if (name == '') {
        this.listsData.isShowNewList = false
        return
      }

      this.listsData.isNewLeave = true
      this.$nextTick(() => {
        this.listsData.isShowNewList = false
      })

      this.createUserList({ name })
    },
    handleShowNewList() {
      this.listsData.isShowNewList = true
      this.$nextTick(() => {
        this.$refs.dom_listsNewInput.focus()
      })
    },
    handleListsNewAfterLeave() {
      this.listsData.isNewLeave = false
    },
    handleListToggle(id) {
      if (id == this.listId) return
      this.$router.replace({
        path: 'list',
        query: { id },
      }).catch(_ => _)
    },
    handleListsItemRigthClick(event, index) {
      let source
      switch (index) {
        case -1:
        case -2:
          this.listsData.itemMenuControl.rename = false
          this.listsData.itemMenuControl.remove = false
          this.listsData.itemMenuControl.sync = false
          break
        default:
          this.listsData.itemMenuControl.rename = true
          this.listsData.itemMenuControl.remove = true
          source = userLists[index].source
          this.listsData.itemMenuControl.sync = !!source && !!musicSdk[source]?.songList
          break
      }
      this.listsData.itemMenuControl.sort = !!getList(this.getTargetListInfo(index)?.id).length
      this.listsData.rightClickItemIndex = index
      this.listsData.menuLocation.x = event.currentTarget.offsetLeft + event.offsetX
      this.listsData.menuLocation.y = event.currentTarget.offsetTop + event.offsetY - this.dom_lists_list.scrollTop
      this.$emit('show-menu')
      this.$nextTick(() => {
        this.listsData.isShowItemMenu = true
      })
    },
    hideListsMenu() {
      this.listsData.isShowItemMenu = false
      this.listsData.rightClickItemIndex = -1
    },
    handleListsItemMenuClick(action) {
      // console.log(action)
      let index = this.listsData.rightClickItemIndex
      this.hideListsMenu()
      this.listsData.isShowItemMenu = false
      let dom
      switch (action && action.action) {
        case 'rename':
          dom = this.dom_lists_list.querySelectorAll('.user-list')[index]
          this.$nextTick(() => {
            dom.classList.add(this.$style.editing)
            dom.querySelector('input').focus()
          })
          break
        case 'duplicate':
          this.selectedDuplicateListInfo = this.getTargetListInfo(index)
          this.isShowDuplicateMusicModal = true
          break
        case 'sort':
          this.selectedSortListInfo = this.getTargetListInfo(index)
          this.isShowListSortModal = true
          break
        case 'import':
          this.handleImportList(index)
          break
        case 'export':
          this.handleExportList(index)
          break
        case 'sync':
          this.handleSyncSourceList(index)
          break
        case 'remove':
          this.$dialog.confirm({
            message: this.$t('lists__remove_tip', { name: userLists[index].name }),
            confirmButtonText: this.$t('lists__remove_tip_button'),
          }).then(isRemove => {
            if (!isRemove) return
            this.removeUserList({ id: userLists[index].id })
          })
          break
      }
    },
    fetchList(id, source, sourceListId) {
      this.fetchingListStatus[id] = true

      let promise
      if (/board__/.test(sourceListId)) {
        const id = sourceListId.replace(/board__/, '')
        promise = this.getBoardListAll(id)
      } else {
        promise = this.getListDetailAll({ source, id: sourceListId })
      }
      return promise.finally(() => {
        this.fetchingListStatus[id] = false
      })
    },
    async handleSyncSourceList(index) {
      const targetListInfo = userLists[index]
      const list = await this.fetchList(targetListInfo.id, targetListInfo.source, targetListInfo.sourceListId)
      // console.log(targetListInfo.list.length, list.length)
      this.setList({
        ...targetListInfo,
        list,
      })
    },
    getTargetListInfo(index) {
      let list
      switch (index) {
        case -2:
          list = { ...this.defaultList, list: getList(this.defaultList.id) }
          break
        case -1:
          list = { ...this.loveList, list: getList(this.loveList.id) }
          break
        default:
          list = this.userLists[index]
          if (!list) return null
          list = { ...list, list: getList(list.id) }
          break
      }
      return list
    },
    handleExportList(index) {
      const list = this.getTargetListInfo(index)
      if (!list) return
      openSaveDir({
        title: this.$t('lists__export_part_desc'),
        defaultPath: `lx_list_part_${filterFileName(list.name)}.lxmc`,
      }).then(async result => {
        if (result.canceled) return
        const data = JSON.parse(JSON.stringify({
          type: 'playListPart',
          data: list,
        }))
        for await (const item of data.data.list) {
          if (item.otherSource) delete item.otherSource
          if (item.lrc) delete item.lrc
        }
        saveLxConfigFile(result.filePath, data)
      })
    },
    handleImportList(index) {
      selectDir({
        title: this.$t('lists__import_part_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Play List Part', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(async result => {
        if (result.canceled) return
        let listData
        try {
          listData = await readLxConfigFile(result.filePaths[0])
        } catch (error) {
          return
        }
        if (listData.type !== 'playListPart') return
        const targetList = this.lists.find(l => l.id == listData.data.id)
        if (targetList) {
          const confirm = await this.$dialog.confirm({
            message: this.$t('lists__import_part_confirm', { importName: listData.data.name, localName: targetList.name }),
            cancelButtonText: this.$t('lists__import_part_button_cancel'),
            confirmButtonText: this.$t('lists__import_part_button_confirm'),
          })
          if (confirm) {
            listData.data.name = targetList.name
            this.setList({
              name: listData.data.name,
              id: listData.data.id,
              list: listData.data.list,
              source: listData.data.source,
              sourceListId: listData.data.sourceListId,
            })
            return
          }
          listData.data.id += `__${Date.now()}`
        }
        this.createUserList({
          name: listData.data.name,
          id: listData.data.id,
          list: listData.data.list,
          source: listData.data.source,
          sourceListId: listData.data.sourceListId,
          position: Math.max(index, -1),
        })
      })
    },
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

@lists-item-height: 36px;
.lists {
  flex: none;
  width: 16%;
  display: flex;
  flex-flow: column nowrap;
}
.listHeader {
  position: relative;
  &:hover {
    .listsAdd {
      opacity: 1;
    }
  }
}
.listsTitle {
  font-size: 12px;
  line-height: 38px;
  padding: 0 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  flex: none;
}
.listsAdd {
  position: absolute;
  right: 0;
  top: 8px;
  background: none;
  height: 30px;
  border: none;
  outline: none;
  border-radius: @radius-border;
  cursor: pointer;
  opacity: 0;
  transition: opacity @transition-theme;
  color: @color-btn;
  svg {
    vertical-align: bottom;
  }
  &:active {
    opacity: .7 !important;
  }
}
.listsContent {
  flex: auto;
  min-width: 0;
  overflow-y: scroll !important;
  // border-right: 1px solid rgba(0, 0, 0, 0.12);

  &.sortable {
    * {
      -webkit-user-drag: element;
    }

    .listsItem {
      &:hover, &.active, &.selected, &.clicked {
        background-color: transparent !important;
      }

      &.dragingItem {
        background-color: @color-theme_2-hover !important;
      }
    }
  }
}
.listsItem {
  position: relative;
  transition: .3s ease;
  transition-property: color, background-color, opacity;
  background-color: transparent;
  &:hover:not(.active) {
    background-color: @color-theme_2-hover;
    cursor: pointer;
  }
  &.active {
    // background-color:
    color: @color-theme;
  }
  &.selected {
    background-color: @color-theme_2-active;
  }
  &.clicked {
    background-color: @color-theme_2-hover;
  }
  &.fetching {
    opacity: .5;
  }
  &.editing {
    padding: 0 10px;
    background-color: @color-theme_2-hover;
    .listsLabel {
      display: none;
    }
    .listsInput {
      display: block;
    }
  }
}
.listsLabel {
  display: block;
  height: @lists-item-height;
  padding: 0 10px;
  font-size: 13px;
  line-height: @lists-item-height;
  .mixin-ellipsis-1;
}
.listsInput {
  width: 100%;
  height: @lists-item-height;
  border: none;
  padding: 0;
  // padding-bottom: 1px;
  line-height: @lists-item-height;
  background: none;
  outline: none;
  font-size: 13px;
  display: none;
  font-family: inherit;
}

.listsNew {
  padding: 0 10px;
  background-color: @color-theme_2-hover;
  .listsInput {
    display: block;
  }
}
.newLeave {
  margin-top: -@lists-item-height;
  z-index: -1;
}

each(@themes, {
  :global(#root.@{value}) {
    .listsAdd {
      color: ~'@{color-@{value}-btn}';
    }
    .listsItem {
      &:hover:not(.active) {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &.active {
        color: ~'@{color-@{value}-theme}';
      }
      &.select {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
      &.clicked {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &.editing {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
    }
    .listsContent {
      &.sortable {
        .listsItem {
          &.dragingItem {
            background-color: ~'@{color-@{value}-theme_2-hover}' !important;
          }
        }
      }
    }
    .listsNew {
      background-color: ~'@{color-@{value}-theme_2-hover}';
    }
  }
})

</style>
