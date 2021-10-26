<template lang="pug">
  div(:class="$style.leaderboard")
    //- div(:class="$style.header")
      material-tab(:class="$style.tab" :list="boards" align="left" item-key="id" item-name="name" v-model="tabId")
      material-select(:class="$style.select" :list="sources.sources" item-key="id" item-name="name" v-model="source")
    div(:class="$style.lists" ref="dom_lists")
      div(:class="$style.listsSelect")
        //- h2(:class="$style.listsTitle") {{$t('core.aside.my_list')}}
        material-selection(:class="$style.select" :list="sources" item-key="id" item-name="name" v-model="source")
        //- button(:class="$style.listsAdd" @click="handleShowNewList" :tips="$t('view.list.lists_new_list_btn')")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='70%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-list-add')
      ul.scroll(:class="$style.listsContent" ref="dom_lists_list")
        li(:class="[$style.listsItem, item.id == tabId ? $style.active : null, { [$style.clicked]: boardListData.rightClickItemIndex == index }]"
            :tips="item.name" v-for="(item, index) in boardList" :key="item.id" @click="handleToggleList(item.id)"
            @contextmenu="handleListsItemRigthClick($event, index)")
          span(:class="$style.listsLabel") {{item.name}}
    div(:class="$style.list")
      material-song-list(v-model="selectedData" ref="songList" :hideListsMenu="hideListsMenu" :rowWidth="{r1: '5%', r2: 'auto', r3: '22%', r4: '22%', r5: '9%', r6: '15%'}" @action="handleSongListAction" :source="source" :page="page" :limit="listInfo.limit" :total="listInfo.total" :noItem="$t('material.song_list.loding_list')" :list="list")
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectedData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
    material-list-add-modal(:show="isShowListAdd" :musicInfo="musicInfo" @close="isShowListAdd = false")
    material-list-add-multiple-modal(:show="isShowListAddMultiple" :musicList="selectedData" @close="handleListAddModalClose")
    material-menu(:menus="listsItemMenu" :location="boardListData.menuLocation" item-name="name" :isShow="boardListData.isShowItemMenu" @menu-click="handleListsItemMenuClick")
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { openUrl } from '../utils'
import musicSdk from '../utils/music'
export default {
  name: 'Leaderboard',
  data() {
    return {
      tabId: null,
      source: null,
      page: 1,
      isShowDownload: false,
      musicInfo: null,
      selectedData: [],
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
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('leaderboard', ['sources', 'boards', 'info']),
    ...mapGetters('list', ['defaultList']),
    boardList() {
      return this.source && this.boards[this.source] ? this.boards[this.source] : []
    },
    listsItemMenu() {
      return [
        {
          name: this.$t('view.leaderboard.play'),
          action: 'play',
          disabled: false,
        },
        {
          name: this.$t('view.leaderboard.collect'),
          action: 'collect',
          disabled: false,
        },
      ]
    },
    list() {
      return this.listInfo.list
    },
  },
  watch: {
    tabId(n, o) {
      this.setLeaderboard({ tabId: n })
      if (!n || (!o && this.page !== 1)) return
      this.listInfo.list = []
      this.getList(1).then(listInfo => {
        this.listInfo.list = listInfo.list
        this.listInfo.total = listInfo.total
        this.listInfo.limit = listInfo.limit
        this.listInfo.page = listInfo.page
        this.listInfo.key = listInfo.key
        this.page = listInfo.page
      })
    },
    source(n, o) {
      this.setLeaderboard({ source: n })
      if (o) this.tabId = null
      this.getBoardsList().then(() => {
        if (this.tabId != null) return
        this.$nextTick(() => {
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
    ...mapActions('download', ['createDownload', 'createDownloadMultiple']),
    ...mapMutations('list', ['listAdd', 'listAddMultiple', 'createUserList']),
    ...mapMutations('player', ['setList', 'setTempPlayList']),
    handleListBtnClick(info) {
      switch (info.action) {
        case 'download':
          this.musicInfo = this.list[info.index]
          this.$nextTick(() => {
            this.isShowDownload = true
          })
          break
        case 'play':
          this.testPlay(info.index)
          break
        case 'search':
          this.handleSearch(info.index)
          break
        case 'listAdd':
          this.musicInfo = this.list[info.index]
          this.$nextTick(() => {
            this.isShowListAdd = true
          })
          break
      }
    },
    handleMenuClick(info) {
      let minfo
      let url
      switch (info.action) {
        case 'download':
          if (this.selectedData.length) {
            this.isShowDownloadMultiple = true
          } else {
            this.musicInfo = this.list[info.index]
            this.$nextTick(() => {
              this.isShowDownload = true
            })
          }
          break
        case 'play':
          if (this.selectedData.length) {
            this.listAddMultiple({ id: 'default', list: this.selectedData })
            this.resetSelect()
          }
          this.testPlay(info.index)
          break
        case 'playLater':
          if (this.selectedData.length) {
            this.setTempPlayList(this.selectedData.map(s => ({ listId: '__temp__', musicInfo: s })))
            this.resetSelect()
          } else {
            this.setTempPlayList([{ listId: '__temp__', musicInfo: this.list[info.index] }])
          }
          break
        case 'search':
          this.handleSearch(info.index)
          break
        case 'addTo':
          if (this.selectedData.length) {
            this.$nextTick(() => {
              this.isShowListAddMultiple = true
            })
          } else {
            this.musicInfo = this.list[info.index]
            this.$nextTick(() => {
              this.isShowListAdd = true
            })
          }
          break
        case 'sourceDetail':
          minfo = this.list[info.index]
          url = musicSdk[minfo.source].getMusicDetailPageUrl(minfo)
          if (!url) return
          openUrl(url)
      }
    },
    testPlay(index) {
      let targetSong = this.list[index]
      this.listAdd({ id: 'default', musicInfo: targetSong })
      let targetIndex = this.defaultList.list.findIndex(
        s => s.songmid === targetSong.songmid,
      )
      if (targetIndex > -1) {
        this.setList({
          list: this.defaultList,
          index: targetIndex,
        })
      }
    },
    handleSearch(index) {
      const info = this.list[index]
      this.$router.push({
        path: 'search',
        query: {
          text: `${info.name} ${info.singer}`,
        },
      })
    },
    handleTogglePage(page) {
      this.listInfo.list = []
      this.getList(page).then(listInfo => {
        this.listInfo.list = listInfo.list
        this.listInfo.total = listInfo.total
        this.listInfo.limit = listInfo.limit
        this.listInfo.page = listInfo.page
        this.listInfo.key = listInfo.key
        this.page = listInfo.page
      })
    },
    handleAddDownload(type) {
      this.createDownload({ musicInfo: this.musicInfo, type })
      this.isShowDownload = false
    },
    handleAddDownloadMultiple(type) {
      if (this.source == 'xm' && type == 'flac') type = 'wav'
      this.createDownloadMultiple({ list: [...this.selectedData], type })
      this.isShowDownloadMultiple = false
      this.resetSelect()
    },
    handleListAddModalClose(isSelect) {
      if (isSelect) this.resetSelect()
      this.isShowListAddMultiple = false
    },
    // handleFlowBtnClick(action) {
    //   switch (action) {
    //     case 'download':
    //       this.isShowDownloadMultiple = true
    //       break
    //     case 'play':
    //       this.testPlay()
    //       break
    //     case 'add':
    //       this.isShowListAddMultiple = true
    //       break
    //   }
    // },
    handleSongListAction({ action, data }) {
      switch (action) {
        case 'listBtnClick':
          return this.handleListBtnClick(data)
        case 'menuClick':
          return this.handleMenuClick(data)
        case 'togglePage':
          return this.handleTogglePage(data)
        // case 'flowBtnClick':
        //   return this.handleFlowBtnClick(data)
        case 'testPlay':
          return this.testPlay(data)
        case 'search':
          return this.handleSearch(data)
      }
    },
    handleToggleList(id) {
      if (this.tabId == id) return
      this.tabId = id
    },
    resetSelect() {
      this.selectedData = []
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
      this.$refs.songList.hideListMenu()
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
        const list = await this.getListAll(board.id)
        if (!list.length) return
        switch (action && action.action) {
          case 'play':
            this.setList({
              list: {
                list,
                id: null,
              },
              index: 0,
            })
            break
          case 'collect':
            this.createUserList({
              name: board.name,
              id: `board__${this.source}__${board.id}`,
              list,
              source: this.source,
              sourceListId: `board__${board.id}`,
            })
            break
        }
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
  overflow-y: scroll;
  overflow-x: hidden;
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
  :global(#container.@{value}) {
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
