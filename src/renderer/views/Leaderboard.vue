<template>
<div :class="$style.leaderboard">
  <div :class="$style.lists" ref="dom_lists">
    <div :class="$style.listsSelect">
      <base-selection :class="$style.select" :list="sources" item-key="id" item-name="name" v-model="source" />
    </div>
    <ul class="scroll" :class="$style.listsContent" ref="dom_lists_list">
      <li :class="[$style.listsItem, { [$style.active]: item.id == tabId }, { [$style.clicked]: boardListData.rightClickItemIndex == index }]"
      :tips="item.name" v-for="(item, index) in boardList" :key="item.id"
      @click="handleToggleList(item.id)" @contextmenu="handleListsItemRigthClick($event, index)">
        <span :class="$style.listsLabel">{{item.name}}</span>
      </li>
    </ul>
  </div>
  <div :class="$style.list">
    <material-online-list
      ref="songList"
      @show-menu="hideListsMenu"
      @toggle-page="handleGetList"
      :rowWidth="{r1: '5%', r2: 'auto', r3: '22%', r4: '22%', r5: '9%', r6: '15%'}"
      :page="page"
      :limit="listInfo.limit"
      :total="listInfo.total"
      :noItem="noItemLabel"
      :list="list" />
  </div>
  <base-menu
    :menus="listsItemMenu"
    :location="boardListData.menuLocation"
    item-name="name"
    :isShow="boardListData.isShowItemMenu"
    @menu-click="handleListsItemMenuClick" />
</div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { nextTick } from '@renderer/utils/vueTools'
import { tempList } from '@renderer/core/share/list'
export default {
  name: 'Leaderboard',
  data() {
    return {
      tabId: null,
      source: null,
      page: 1,
      isShowDownload: false,
      musicInfo: null,
      isShowDownloadMultiple: false,
      isShowListAdd: false,
      isShowListAddMultiple: false,
      boardListData: {
        isShowItemMenu: false,
        itemMenuControl: {
          rename: true,
          sync: false,
          moveup: true,
          movedown: true,
          remove: true,
        },
        rightClickItemIndex: -1,
        menuLocation: {
          x: 0,
          y: 0,
        },
      },
      listInfo: {
        list: [],
        total: 0,
        page: 1,
        limit: 30,
        key: null,
      },
      loadId: null,
      loadError: null,
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('leaderboard', ['sources', 'boards', 'info']),
    boardList() {
      return this.source && this.boards[this.source] ? this.boards[this.source] : []
    },
    listsItemMenu() {
      return [
        {
          name: this.$t('list__play'),
          action: 'play',
          disabled: false,
        },
        {
          name: this.$t('list__collect'),
          action: 'collect',
          disabled: false,
        },
      ]
    },
    list() {
      return this.listInfo.list
    },
    noItemLabel() {
      return this.loadId
        ? this.$t('list__loading')
        : this.loadError
          ? this.$t('list__load_failed')
          : this.listInfo.list.length
            ? this.$t('list__loading')
            : this.$t('no_item')
    },
  },
  watch: {
    tabId(n, o) {
      this.setLeaderboard({ tabId: n })
      if (!n || (!o && this.page !== 1)) return
      this.listInfo.list = []
      this.handleGetList(1)
    },
    source(n, o) {
      this.setLeaderboard({ source: n })
      if (o) this.tabId = null
      this.getBoardsList().then(() => {
        if (this.tabId != null) return
        nextTick(() => {
          this.tabId = this.boardList[0] && this.boardList[0].id
        })
      })
    },
  },
  mounted() {
    this.source = this.setting.leaderboard.source
    this.tabId = this.setting.leaderboard.tabId
    this.page = this.listInfo.page
  },
  methods: {
    ...mapMutations(['setLeaderboard']),
    ...mapActions('leaderboard', ['getBoardsList', 'getList', 'getListAll']),
    ...mapMutations('list', ['createUserList']),
    ...mapMutations('player', ['setTempList', 'updateTempList']),
    handleGetList(page) {
      const loadId = `${this.source}${this.tabId}${page}`
      this.loadError = false
      this.loadId = loadId
      this.getList(page).then(listInfo => {
        if (this.loadId != loadId) return
        this.listInfo.list = listInfo.list
        this.listInfo.total = listInfo.total
        this.listInfo.limit = listInfo.limit
        this.listInfo.page = listInfo.page
        this.listInfo.key = listInfo.key
        this.page = listInfo.page
        nextTick(() => {
          this.$refs.songList?.scrollToTop()
        })
      }).catch(() => {
        if (this.loadId != loadId) return
        this.loadError = true
      }).finally(() => {
        if (this.loadId != loadId) return
        this.loadId = null
      })
    },
    handleToggleList(id) {
      if (this.tabId == id) return
      this.tabId = id
    },
    handleListsItemRigthClick(event, index) {
      // const board = this.boardList[index]
      // this.boardListData.itemMenuControl.sync = !!source && !!musicSdk[source].songList
      // this.boardListData.itemMenuControl.moveup = index > 0
      // this.boardListData.itemMenuControl.movedown = index < this.userList.length - 1
      this.boardListData.rightClickItemIndex = index
      this.boardListData.menuLocation.x = event.currentTarget.offsetLeft + event.offsetX
      this.boardListData.menuLocation.y = event.currentTarget.offsetTop + event.offsetY - this.$refs.dom_lists_list.scrollTop
      // this.hideListsMenu()
      this.$refs.songList.hideMenu()
      this.$nextTick(() => {
        this.boardListData.isShowItemMenu = true
      })
    },
    hideListsMenu() {
      this.boardListData.isShowItemMenu = false
      this.boardListData.rightClickItemIndex = -1
    },
    async handleListsItemMenuClick(action) {
      let index = this.boardListData.rightClickItemIndex
      this.hideListsMenu()
      this.boardListData.isShowItemMenu = false

      if (action) {
        const board = this.boardList[index]
        const id = `board__${this.source}__${board.id}`
        switch (action && action.action) {
          case 'play':
            this.playSongListDetail({
              boardId: board.id,
              list: [...this.list],
              id,
            })
            break
          case 'collect':
            this.addSongListDetail({
              boardId: board.id,
              boardName: board.name,
              source: this.source,
              id,
            })
            break
        }
      }
    },
    async addSongListDetail({ boardId, boardName, source, id }) {
      // console.log(this.listDetail.info)
      // if (!this.listDetail.info.name) return
      const list = await this.getListAll(boardId)
      this.createUserList({
        name: boardName,
        id,
        list,
        source,
        sourceListId: `board__${boardId}`,
      })
    },
    async playSongListDetail({ boardId, id, list }) {
      let isPlayingList = false
      if (list?.length) {
        this.setTempList({
          list,
          index: 0,
          id,
        })
        isPlayingList = true
      }
      const fullList = await this.getListAll(boardId)
      if (!fullList.length) return
      if (isPlayingList) {
        if (tempList.meta.id == id) {
          this.updateTempList({
            list: fullList,
            id,
          })
        }
      } else {
        this.setTempList({
          list: fullList,
          index: 0,
          id,
        })
      }
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.leaderboard {
  height: 100%;
  display: flex;
  position: relative;
}
.header {
  flex: none;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;

}
.tab {
  flex: auto;
}
.select {
  flex: none;
  width: 80px;
}
.content {
  flex: auto;
  display: flex;
  overflow: hidden;
  flex-flow: column nowrap;
}

.lists {
  flex: none;
  width: 14.8%;
  display: flex;
  flex-flow: column nowrap;
}
.listsHeader {
  position: relative;
}
.listsSelect {
  font-size: 12px;

  &:hover {
    :global(.icon) {
      opacity: 1;
    }
  }

  >:global(.content) {
    display: block;
    width: 100%;
  }
  :global(.label-content) {
    background-color: transparent !important;
    line-height: 38px;
    height: 38px;
    border-radius: 0;
    &:hover {
      background: none !important;
    }
  }
  :global(.label) {
    color: @color-theme_2-font !important;
  }
  :global(.icon) {
    opacity: .6;
    transition: opacity .3s ease;
  }

  :global(.selection-list) {
    max-height: 500px;
    box-shadow: 0 1px 8px 0 rgba(0,0,0,.2);
    li {
      background-color: @color-theme_2-background_2;
      line-height: 38px;
      font-size: 13px;
      &:hover {
        background-color: @color-btn-hover;
      }
      &:active {
        background-color: @color-btn-active;
      }
    }
  }
  // line-height: 38px;
  // padding: 0 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  flex: none;
}
.listsContent {
  flex: auto;
  min-width: 0;
  overflow-y: scroll !important;
  // border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.listsItem {
  position: relative;
  transition: .3s ease;
  transition-property: color, background-color;
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
  height: 100%;
  padding: 0 10px;
  font-size: 13px;
  line-height: 36px;
  .mixin-ellipsis-1;
}

.list {
  overflow: hidden;
  height: 100%;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  // .noItem {

  // }
}


each(@themes, {
  :global(#root.@{value}) {
    .listsSelect {
      :global(.label) {
        color: ~'@{color-@{value}-theme_2-font}' !important;
      }
      :global(.selection-list) {
        li {
          background-color: ~'@{color-@{value}-theme_2-background_2}';
          &:hover {
            background-color: ~'@{color-@{value}-btn-hover}';
          }
          &:active {
            background-color: ~'@{color-@{value}-btn-active}';
          }
        }
      }
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
  }
})

</style>
