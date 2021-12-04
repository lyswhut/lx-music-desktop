<template lang="pug">
div(:class="$style.download")
  //- transition
  div(:class="$style.header")
    base-tab(:class="$style.tab" :list="tabs" align="left" item-key="id" item-name="name" @change="handleTabChange" v-model="tabId")
  div(:class="$style.content" v-if="downloadList.length")
    div.thead(:class="$style.thead")
      table
        thead
          tr
            th.nobreak.center(style="width: 5%;") #
            th.nobreak {{$t('music_name')}}
            th.nobreak(style="width: 20%;") {{$t('download__progress')}}
            th.nobreak(style="width: 22%;") {{$t('download__status')}}
            th.nobreak(style="width: 10%;") {{$t('download__quality')}}
            th.nobreak(style="width: 13%;") {{$t('action')}}
    div(v-if="downloadList.length" :class="$style.content" ref="dom_listContent")
      base-virtualized-list(:list="showList" key-name="key" ref="list" :item-height="listItemHeight" #default="{ item, index }"
        containerClass="scroll" contentClass="list")
        div.list-item(@click="handleDoubleClick($event, index)" @contextmenu="handleListItemRigthClick($event, index)"
          :class="[{[$style.active]: playListIndex == index }, { selected: selectedIndex == index }, { active: selectedData.includes(item) }]")
          div.list-item-cell.nobreak.center(style="width: 5%; padding-left: 3px; padding-right: 3px;" @click.stop) {{index + 1}}
          div.list-item-cell.auto(:tips="item.name")
            span.select {{item.name}}
          div.list-item-cell(style="width: 20%;") {{item.progress.progress}}%
          div.list-item-cell(style="width: 22%;" :tips="item.statusText") {{item.statusText}}
          div.list-item-cell(style="width: 10%;") {{item.metadata.type && item.metadata.type.toUpperCase()}}
          div.list-item-cell(style="width: 13%; padding-left: 0; padding-right: 0;")
            material-list-buttons(:index="index" :download-btn="false" :file-btn="item.status != downloadStatus.ERROR" remove-btn
              :start-btn="!item.isComplate && item.status != downloadStatus.WAITING && (item.status != downloadStatus.RUN)"
              :pause-btn="!item.isComplate && (item.status == downloadStatus.RUN || item.status == downloadStatus.WAITING)" :list-add-btn="false"
              :play-btn="item.status == downloadStatus.COMPLETED" :search-btn="item.status == downloadStatus.ERROR" @btn-click="handleListBtnClick")
    base-menu(:menus="listItemMenu" :location="listMenu.menuLocation" item-name="name" :isShow="listMenu.isShowItemMenu" @menu-click="handleListItemMenuClick")
  div(:class="$style.noItem" v-else)
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { checkPath, openDirInExplorer, openUrl } from '@renderer/utils'
import musicSdk from '@renderer/utils/music'
import path from 'path'
import { windowSizeList } from '@renderer/core/share'
import { playInfo, playMusicInfo } from '@renderer/core/share/player'
import { downloadList, downloadStatus } from '@renderer/core/share/download'

export default {
  name: 'Download',
  setup() {
    return {
      playMusicInfo,
      playInfo,
      downloadList,
      downloadStatus,
    }
  },
  data() {
    return {
      clickTime: window.performance.now(),
      clickIndex: -1,
      selectedData: [],
      isShowDownloadMultiple: false,
      tabId: 'all',
      keyEvent: {
        isShiftDown: false,
        isModDown: false,
      },
      selectedIndex: -1,
      lastSelectIndex: 0,
      listMenu: {
        rightClickItemIndex: -1,
        isShowItemMenu: false,
        itemMenuControl: {
          play: true,
          start: true,
          pause: true,
          playLater: true,
          file: true,
          search: true,
          remove: true,
          sourceDetail: true,
        },
        menuLocation: {
          x: 0,
          y: 0,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['setting']),
    isPlayList() {
      return this.playMusicInfo.listId == 'download'
    },
    playListIndex() {
      if (this.playMusicInfo.listId != 'download' || !this.downloadList.length) return -1
      let info = this.downloadList[this.playInfo.playIndex]
      if (!info) return -1
      let key = info.key
      return this.showList.findIndex(i => i.key == key)
    },
    showList() {
      switch (this.tabId) {
        case 'runing':
          return this.downloadList.filter(i => i.status == this.downloadStatus.RUN || i.status == this.downloadStatus.WAITING)
        case 'paused':
          return this.downloadList.filter(i => i.status == this.downloadStatus.PAUSE)
        case 'error':
          return this.downloadList.filter(i => i.status == this.downloadStatus.ERROR)
        case 'finished':
          return this.downloadList.filter(i => i.status == this.downloadStatus.COMPLETED)
        default:
          return this.downloadList
      }
    },
    tabs() {
      return [
        {
          name: this.$t('download__all'),
          id: 'all',
        },
        {
          name: this.$t('download__runing'),
          id: 'runing',
        },
        {
          name: this.$t('download__paused'),
          id: 'paused',
        },
        {
          name: this.$t('download__error'),
          id: 'error',
        },
        {
          name: this.$t('download__finished'),
          id: 'finished',
        },
      ]
    },
    listItemMenu() {
      return [
        {
          name: this.$t('list__play'),
          action: 'play',
          hide: !this.listMenu.itemMenuControl.play,
        },
        {
          name: this.$t('list__start'),
          action: 'start',
          hide: !this.listMenu.itemMenuControl.start,
        },
        {
          name: this.$t('list__pause'),
          action: 'pause',
          hide: !this.listMenu.itemMenuControl.pause,
        },
        {
          name: this.$t('list__play_later'),
          action: 'playLater',
          hide: !this.listMenu.itemMenuControl.playLater,
        },
        {
          name: this.$t('list__file'),
          action: 'file',
          hide: !this.listMenu.itemMenuControl.file,
        },
        {
          name: this.$t('list__source_detail'),
          action: 'sourceDetail',
          disabled: !this.listMenu.itemMenuControl.sourceDetail,
        },
        {
          name: this.$t('list__search'),
          action: 'search',
          hide: !this.listMenu.itemMenuControl.search,
        },
        {
          name: this.$t('list__remove'),
          action: 'remove',
          hide: !this.listMenu.itemMenuControl.remove,
        },
      ]
    },
    listItemHeight() {
      return parseInt(windowSizeList.find(item => item.id == this.setting.windowSizeId).fontSize) / 16 * 37
    },
  },
  watch: {
    list() {
      this.removeAllSelect()
    },
  },
  created() {
    this.listenEvent()
  },
  beforeUnmount() {
    this.unlistenEvent()
  },
  methods: {
    ...mapActions('download', ['removeTask', 'removeTasks', 'startTask', 'startTasks', 'pauseTask', 'pauseTasks']),
    ...mapMutations('player', ['setList', 'setTempPlayList']),
    listenEvent() {
      window.eventHub.on('key_shift_down', this.handle_key_shift_down)
      window.eventHub.on('key_shift_up', this.handle_key_shift_up)
      window.eventHub.on('key_mod_down', this.handle_key_mod_down)
      window.eventHub.on('key_mod_up', this.handle_key_mod_up)
      window.eventHub.on('key_mod+a_down', this.handle_key_mod_a_down)
    },
    unlistenEvent() {
      window.eventHub.off('key_shift_down', this.handle_key_shift_down)
      window.eventHub.off('key_shift_up', this.handle_key_shift_up)
      window.eventHub.off('key_mod_down', this.handle_key_mod_down)
      window.eventHub.off('key_mod_up', this.handle_key_mod_up)
      window.eventHub.off('key_mod+a_down', this.handle_key_mod_a_down)
    },
    handle_key_shift_down() {
      if (!this.keyEvent.isShiftDown) this.keyEvent.isShiftDown = true
    },
    handle_key_shift_up() {
      if (this.keyEvent.isShiftDown) this.keyEvent.isShiftDown = false
    },
    handle_key_mod_down() {
      if (!this.keyEvent.isModDown) this.keyEvent.isModDown = true
    },
    handle_key_mod_up() {
      if (this.keyEvent.isModDown) this.keyEvent.isModDown = false
    },
    handle_key_mod_a_down({ event }) {
      if (event.target.tagName == 'INPUT') return
      event.preventDefault()
      if (event.repeat) return
      this.keyEvent.isModDown = false
      this.handleSelectAllData()
    },
    handleDoubleClick(event, index) {
      if (this.listMenu.rightClickItemIndex > -1) return

      this.handleSelectData(event, index)

      if (
        window.performance.now() - this.clickTime > 400 ||
        this.clickIndex !== index
      ) {
        this.clickTime = window.performance.now()
        this.clickIndex = index
        return
      }
      this.handleClick(index)
      this.clickTime = 0
      this.clickIndex = -1
    },
    handleSelectData(event, clickIndex) {
      if (this.keyEvent.isShiftDown) {
        if (this.selectedData.length) {
          let lastSelectIndex = this.lastSelectIndex
          this.removeAllSelect()
          if (lastSelectIndex != clickIndex) {
            let isNeedReverse = false
            if (clickIndex < lastSelectIndex) {
              let temp = lastSelectIndex
              lastSelectIndex = clickIndex
              clickIndex = temp
              isNeedReverse = true
            }
            this.selectedData = this.showList.slice(lastSelectIndex, clickIndex + 1)
            if (isNeedReverse) this.selectedData.reverse()
          }
        } else {
          this.selectedData.push(this.showList[clickIndex])
          this.lastSelectIndex = clickIndex
        }
      } else if (this.keyEvent.isModDown) {
        this.lastSelectIndex = clickIndex
        let item = this.showList[clickIndex]
        let index = this.selectedData.indexOf(item)
        if (index < 0) {
          this.selectedData.push(item)
        } else {
          this.selectedData.splice(index, 1)
        }
      } else if (this.selectedData.length) this.removeAllSelect()
    },
    removeAllSelect() {
      this.selectedData = []
    },
    handleClick(index) {
      const key = this.showList[index].key
      index = this.downloadList.findIndex(i => i.key === key)
      let info = this.downloadList[index]
      if (info.isComplate) {
        this.handlePlay(info)
      } else if (info.status === this.downloadStatus.RUN) {
        this.handlePauseTask(index)
      } else {
        this.handleStartTask(index)
      }
    },
    async handlePlay(targetSong) {
      if (!await checkPath(path.join(this.setting.download.savePath, targetSong.metadata.fileName))) return
      this.setList({ listId: 'download', index: this.downloadList.findIndex(i => i.key === targetSong.key) })
    },
    handleListBtnClick(info) {
      let item = this.showList[info.index]
      switch (info.action) {
        case 'play':
          this.handlePlay(item)
          break
        case 'start':
          this.startTask(item)
          break
        case 'pause':
          this.pauseTask(item)
          break
        case 'remove':
          this.removeTask(item)
          break
        case 'file':
          this.handleOpenFolder(item.metadata.filePath)
          break
        case 'search':
          this.handleSearch(item.metadata.musicInfo)
          break
      }
    },
    handleSelectAllData() {
      this.removeAllSelect()
      this.selectedData = [...this.showList]
    },
    // async handleFlowBtnClick(action) {
    //   let selectedData = [...this.selectedData]
    //   this.removeAllSelect()
    //   await this.$nextTick()

    //   switch (action) {
    //     case 'start':
    //       this.startTasks(selectedData)
    //       break
    //     case 'pause':
    //       this.pauseTasks(selectedData)
    //       break
    //     case 'remove':
    //       this.removeTasks(selectedData)
    //       break
    //   }
    // },
    async handleOpenFolder(filePath) {
      if (!await checkPath(filePath)) return
      openDirInExplorer(filePath)
    },
    handleSearch(musicInfo) {
      this.$router.push({
        path: 'search',
        query: {
          text: `${musicInfo.name} ${musicInfo.singer}`,
        },
      })
    },
    handleTabChange() {
      this.selectedData = []
    },
    handleListItemRigthClick(event, index) {
      const downloadInfo = this.showList[index]
      this.listMenu.itemMenuControl.sourceDetail = !!musicSdk[downloadInfo.metadata.musicInfo.source].getMusicDetailPageUrl
      let dom_container = event.target.closest('.' + this.$style.download)
      const getOffsetValue = (target, x = 0, y = 0) => {
        if (target === dom_container) return { x, y }
        if (!target) return { x: 0, y: 0 }
        x += target.offsetLeft
        y += target.offsetTop
        return getOffsetValue(target.offsetParent, x, y)
      }
      this.listMenu.rightClickItemIndex = index
      this.selectedIndex = index
      let { x, y } = getOffsetValue(event.target)
      this.listMenu.menuLocation.x = x + event.offsetX
      this.listMenu.menuLocation.y = y + event.offsetY - this.$refs.list.getScrollTop()

      let item = this.showList[index]
      if (item.isComplate) {
        this.listMenu.itemMenuControl.play =
        this.listMenu.itemMenuControl.playLater =
        this.listMenu.itemMenuControl.file = true
        this.listMenu.itemMenuControl.start =
        this.listMenu.itemMenuControl.pause = false
      } else if (item.status === this.downloadStatus.ERROR || item.status === this.downloadStatus.PAUSE) {
        this.listMenu.itemMenuControl.play =
        this.listMenu.itemMenuControl.playLater =
        this.listMenu.itemMenuControl.pause =
        this.listMenu.itemMenuControl.file = false
        this.listMenu.itemMenuControl.start = true
      } else {
        this.listMenu.itemMenuControl.play =
        this.listMenu.itemMenuControl.playLater =
        this.listMenu.itemMenuControl.start =
        this.listMenu.itemMenuControl.file = false
        this.listMenu.itemMenuControl.pause = true
      }

      this.$nextTick(() => {
        this.listMenu.isShowItemMenu = true
      })
    },
    hideListMenu() {
      this.selectedIndex = -1
      this.listMenu.isShowItemMenu = false
      this.listMenu.rightClickItemIndex = -1
    },
    handleListItemMenuClick(action) {
      // console.log(action)
      let index = this.listMenu.rightClickItemIndex
      this.hideListMenu()
      // let key
      let item
      let url

      switch (action && action.action) {
        case 'play':
          item = this.showList[index]
          if (item) this.handlePlay(item)
          break
        case 'start':
          if (this.selectedData.length) {
            let selectedData = [...this.selectedData]
            this.removeAllSelect()
            this.startTasks(selectedData)
          } else {
            item = this.showList[index]
            if (item) this.startTask(item)
            this.$nextTick(() => {
              this.isShowDownload = true
            })
          }
          break
        case 'pause':
          if (this.selectedData.length) {
            let selectedData = [...this.selectedData]
            this.removeAllSelect()
            this.pauseTasks(selectedData)
          } else {
            item = this.showList[index]
            if (item) this.pauseTask(item)
            this.$nextTick(() => {
              this.isShowDownload = true
            })
          }
          break
        case 'file':
          item = this.showList[index]
          // key = item.key
          // index = this.list.findIndex(i => i.key === key)
          if (item) this.handleOpenFolder(item.metadata.filePath)
          break
        case 'search':
          item = this.showList[index]
          if (item) this.handleSearch(item.metadata.musicInfo)
          break
        case 'remove':
          if (this.selectedData.length) {
            let selectedData = [...this.selectedData]
            this.removeAllSelect()
            this.removeTasks(selectedData)
          } else {
            item = this.showList[index]
            if (item) this.removeTask(item)
            this.$nextTick(() => {
              this.isShowDownload = true
            })
          }
          break
        case 'playLater':
          if (this.selectedData.length) {
            this.setTempPlayList(this.selectedData.map(s => ({ listId: 'download', musicInfo: s })))
            this.removeAllSelect()
          } else {
            this.setTempPlayList([{ listId: 'download', musicInfo: this.showList[index] }])
          }
          break
        case 'sourceDetail':
          item = this.showList[index].metadata.musicInfo
          url = musicSdk[item.source].getMusicDetailPageUrl(item)
          if (!url) return
          openUrl(url)
      }
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.download {
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  // .noItem {

    // }
}
.header {
  flex: none;
}

.content {
  height: 100%;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
  flex: auto;
  overflow: hidden;
  // table {
  //   position: relative;
  //   thead {
  //     position: fixed;
  //     width: 100%;
  //     th {
  //       width: 100%;
  //     }
  //   }
  // }
}
.thead {
  flex: none;
  tr > th:first-child {
    color: @color-theme_2-font-label;
    // padding-left: 10px;
  }
}
:global(.list) {
  flex: auto;
  overflow-y: auto;
  :global(.list-item-cell) {
    font-size: 12px !important;
    &:first-child {
      // padding-left: 10px;
      font-size: 11px !important;
      color: @color-theme_2-font-label !important;
    }
  }
  :global(.list-item) {
    &.active {
      color: @color-btn;
    }
  }
}

each(@themes, {
  :global(#root.@{value}) {
    :global(.list) {
      :global(.list-item-cell) {
        &:first-child {
          color: ~'@{color-@{value}-theme_2-font-label}';
        }
      }
      :global(.list-item) {
        &.active {
          color: ~'@{color-@{value}-btn}' !important;
        }
      }
    }
  }
})
</style>
